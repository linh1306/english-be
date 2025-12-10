import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import {
    CreateVocabularyDto,
    UpdateVocabularyDto,
    QueryVocabularyDto,
    VocabularyResponse,
    PaginatedVocabularyResponse,
    BulkCreateVocabularyDto,
    BulkCreateResult,
} from './dto/vocabulary.dto';

@Injectable()
export class VocabularyService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Tạo từ vựng mới
     */
    async create(dto: CreateVocabularyDto): Promise<VocabularyResponse> {
        // Kiểm tra category tồn tại
        const category = await this.prisma.vocabularyCategory.findUnique({
            where: { id: dto.categoryId },
        });

        if (!category) {
            throw new NotFoundException(`Category with id "${dto.categoryId}" not found`);
        }

        // Kiểm tra từ đã tồn tại trong category chưa
        const existing = await this.prisma.vocabulary.findUnique({
            where: {
                word_categoryId: {
                    word: dto.word,
                    categoryId: dto.categoryId,
                },
            },
        });

        if (existing) {
            throw new ConflictException(`Word "${dto.word}" already exists in this category`);
        }

        const vocabulary = await this.prisma.vocabulary.create({
            data: {
                word: dto.word,
                meaning: dto.meaning,
                categoryId: dto.categoryId,
                pronunciation: dto.pronunciation,
                audioUrl: dto.audioUrl,
                partOfSpeech: dto.partOfSpeech,
                exampleEn: dto.exampleEn,
                exampleVi: dto.exampleVi,
                imageUrl: dto.imageUrl,
                synonyms: dto.synonyms ?? [],
                antonyms: dto.antonyms ?? [],
                difficulty: dto.difficulty ?? 'BEGINNER',
            },
            include: {
                category: {
                    select: { id: true, name: true, nameVi: true },
                },
            },
        });

        return this.toResponse(vocabulary);
    }

    /**
     * Tạo nhiều từ vựng cùng lúc
     */
    async bulkCreate(dto: BulkCreateVocabularyDto): Promise<BulkCreateResult> {
        const result: BulkCreateResult = {
            created: 0,
            failed: 0,
            errors: [],
        };

        for (const vocab of dto.vocabularies) {
            try {
                await this.create(vocab);
                result.created++;
            } catch (error: any) {
                result.failed++;
                result.errors.push({
                    word: vocab.word,
                    error: error.message,
                });
            }
        }

        return result;
    }

    /**
     * Lấy danh sách từ vựng với phân trang và filter
     */
    async findAll(query: QueryVocabularyDto): Promise<PaginatedVocabularyResponse> {
        const {
            search,
            categoryId,
            difficulty,
            partOfSpeech,
            isActive = true,
            page = 1,
            limit = 20,
            sortBy = 'word',
            sortOrder = 'asc',
        } = query;

        const where: any = {};

        if (search) {
            where.OR = [
                { word: { contains: search, mode: 'insensitive' } },
                { meaning: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (categoryId) {
            where.categoryId = categoryId;
        }

        if (difficulty) {
            where.difficulty = difficulty;
        }

        if (partOfSpeech) {
            where.partOfSpeech = partOfSpeech;
        }

        if (isActive !== undefined) {
            where.isActive = isActive;
        }

        const [vocabularies, total] = await Promise.all([
            this.prisma.vocabulary.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
                include: {
                    category: {
                        select: { id: true, name: true, nameVi: true },
                    },
                },
            }),
            this.prisma.vocabulary.count({ where }),
        ]);

        return {
            data: vocabularies.map((v) => this.toResponse(v)),
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Lấy chi tiết một từ vựng
     */
    async findOne(id: string): Promise<VocabularyResponse> {
        const vocabulary = await this.prisma.vocabulary.findUnique({
            where: { id },
            include: {
                category: {
                    select: { id: true, name: true, nameVi: true },
                },
            },
        });

        if (!vocabulary) {
            throw new NotFoundException(`Vocabulary with id "${id}" not found`);
        }

        return this.toResponse(vocabulary);
    }

    /**
     * Lấy từ vựng ngẫu nhiên theo category
     */
    async getRandomByCategory(categoryId: string, count: number = 10): Promise<VocabularyResponse[]> {
        const vocabularies = await this.prisma.$queryRaw`
      SELECT * FROM vocabularies 
      WHERE "categoryId" = ${categoryId} AND "isActive" = true
      ORDER BY RANDOM() 
      LIMIT ${count}
    `;

        return (vocabularies as any[]).map((v) => this.toResponse(v));
    }

    /**
     * Cập nhật từ vựng
     */
    async update(id: string, dto: UpdateVocabularyDto): Promise<VocabularyResponse> {
        // Kiểm tra từ vựng tồn tại
        const existing = await this.findOne(id);

        // Kiểm tra từ trùng lặp nếu đổi từ hoặc category
        if (dto.word || dto.categoryId) {
            const word = dto.word ?? existing.word;
            const categoryId = dto.categoryId ?? existing.categoryId;

            const duplicate = await this.prisma.vocabulary.findFirst({
                where: {
                    word,
                    categoryId,
                    NOT: { id },
                },
            });

            if (duplicate) {
                throw new ConflictException(`Word "${word}" already exists in this category`);
            }
        }

        const vocabulary = await this.prisma.vocabulary.update({
            where: { id },
            data: dto,
            include: {
                category: {
                    select: { id: true, name: true, nameVi: true },
                },
            },
        });

        return this.toResponse(vocabulary);
    }

    /**
     * Xóa từ vựng (soft delete)
     */
    async remove(id: string): Promise<void> {
        await this.findOne(id);

        await this.prisma.vocabulary.update({
            where: { id },
            data: { isActive: false },
        });
    }

    /**
     * Xóa vĩnh viễn từ vựng
     */
    async hardDelete(id: string): Promise<void> {
        await this.findOne(id);

        await this.prisma.vocabulary.delete({
            where: { id },
        });
    }

    /**
     * Convert entity to response
     */
    private toResponse(vocabulary: any): VocabularyResponse {
        return {
            id: vocabulary.id,
            word: vocabulary.word,
            pronunciation: vocabulary.pronunciation,
            audioUrl: vocabulary.audioUrl,
            meaning: vocabulary.meaning,
            partOfSpeech: vocabulary.partOfSpeech,
            exampleEn: vocabulary.exampleEn,
            exampleVi: vocabulary.exampleVi,
            imageUrl: vocabulary.imageUrl,
            synonyms: vocabulary.synonyms ?? [],
            antonyms: vocabulary.antonyms ?? [],
            difficulty: vocabulary.difficulty,
            categoryId: vocabulary.categoryId,
            category: vocabulary.category,
            isActive: vocabulary.isActive,
            createdAt: vocabulary.createdAt,
            updatedAt: vocabulary.updatedAt,
        };
    }
}
