import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import {
    BodyCreateVocabularyCategory,
    BodyUpdateVocabularyCategory,
    QueryFindAllVocabularyCategory,
    ResVocabularyCategory,
    ResFindAllVocabularyCategory,
    ResCreateVocabularyCategory,
    ResUpdateVocabularyCategory,
    ResFindOneVocabularyCategory,
    ResRemoveVocabularyCategory,
    ResHardDeleteVocabularyCategory,
} from './dto/vocabulary-category.dto';

@Injectable()
export class VocabularyCategoryService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Tạo danh mục từ vựng mới
     */
    async create(dto: BodyCreateVocabularyCategory): Promise<ResCreateVocabularyCategory> {
        // Kiểm tra tên đã tồn tại chưa
        const existing = await this.prisma.vocabularyCategory.findUnique({
            where: { name: dto.name },
        });

        if (existing) {
            throw new ConflictException(`Category with name "${dto.name}" already exists`);
        }

        const category = await this.prisma.vocabularyCategory.create({
            data: {
                name: dto.name,
                nameVi: dto.nameVi,
                description: dto.description,
                thumbnail: dto.thumbnail,
                difficulty: dto.difficulty ?? 'BEGINNER',
                order: dto.order ?? 0,
            },
            include: {
                _count: {
                    select: { vocabularies: true },
                },
            },
        });

        return this.toResponse(category);
    }

    /**
     * Lấy danh sách danh mục với phân trang và filter
     */
    async findAll(query: QueryFindAllVocabularyCategory): Promise<ResFindAllVocabularyCategory> {
        const {
            search,
            difficulty,
            isActive = true,
            page = 1,
            limit = 10,
            sortBy = 'order',
            sortOrder = 'asc',
        } = query;

        const where: any = {};

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { nameVi: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (difficulty) {
            where.difficulty = difficulty;
        }

        if (isActive !== undefined) {
            where.isActive = isActive;
        }

        const [categories, total] = await Promise.all([
            this.prisma.vocabularyCategory.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
                include: {
                    _count: {
                        select: { vocabularies: true },
                    },
                },
            }),
            this.prisma.vocabularyCategory.count({ where }),
        ]);

        return {
            data: categories.map((c) => this.toResponse(c)),
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Lấy chi tiết một danh mục
     */
    async findOne(id: string): Promise<ResFindOneVocabularyCategory> {
        const category = await this.prisma.vocabularyCategory.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { vocabularies: true },
                },
            },
        });

        if (!category) {
            throw new NotFoundException(`Category with id "${id}" not found`);
        }

        return this.toResponse(category);
    }

    /**
     * Cập nhật danh mục
     */
    async update(id: string, dto: BodyUpdateVocabularyCategory): Promise<ResUpdateVocabularyCategory> {
        // Kiểm tra danh mục tồn tại
        await this.findOne(id);

        // Kiểm tra tên trùng lặp nếu đổi tên
        if (dto.name) {
            const existing = await this.prisma.vocabularyCategory.findFirst({
                where: {
                    name: dto.name,
                    NOT: { id },
                },
            });

            if (existing) {
                throw new ConflictException(`Category with name "${dto.name}" already exists`);
            }
        }

        const category = await this.prisma.vocabularyCategory.update({
            where: { id },
            data: dto,
            include: {
                _count: {
                    select: { vocabularies: true },
                },
            },
        });

        return this.toResponse(category);
    }

    /**
     * Xóa danh mục (soft delete bằng cách set isActive = false)
     */
    async remove(id: string): Promise<ResRemoveVocabularyCategory> {
        await this.findOne(id);

        const updated = await this.prisma.vocabularyCategory.update({
            where: { id },
            data: { isActive: false },
            include: {
                _count: {
                    select: { vocabularies: true },
                },
            },
        });

        return this.toResponse(updated);
    }

    /**
     * Xóa vĩnh viễn danh mục
     */
    async hardDelete(id: string): Promise<ResHardDeleteVocabularyCategory> {
        await this.findOne(id);

        const deleted = await this.prisma.vocabularyCategory.delete({
            where: { id },
            include: {
                _count: {
                    select: { vocabularies: true },
                },
            },
        });

        return this.toResponse(deleted);
    }

    /**
     * Convert entity to response
     */
    private toResponse(category: any): ResVocabularyCategory {
        return {
            id: category.id,
            name: category.name,
            nameVi: category.nameVi,
            description: category.description,
            thumbnail: category.thumbnail,
            difficulty: category.difficulty,
            order: category.order,
            isActive: category.isActive,
            vocabularyCount: category._count?.vocabularies ?? 0,
            createdAt: category.createdAt,
            updatedAt: category.updatedAt,
        };
    }
}
