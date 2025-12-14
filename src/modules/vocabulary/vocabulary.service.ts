import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { generateWordsFlow } from '../../flows/generate-words.flow';
import { Queued } from '../../core/queue/queued.decorator';
import { PrismaService } from '../../core/database/prisma.service';
import { DifficultyLevel } from '../../generated/prisma/enums';
import {
    BodyCreateVocabulary,
    BodyUpdateVocabulary,
    QueryFindAllVocabulary,
    ResVocabulary,
    ResFindAllVocabulary,
    BodyBulkCreateVocabulary,
    ResBulkCreateVocabulary,
    ResCreateVocabulary,
    ResUpdateVocabulary,
    ResFindOneVocabulary,
    ResGetRandomByTopic,
    ResRemoveVocabulary,
    ResHardDeleteVocabulary,
    BodyGenerateVocabulary,
    ResGenerateVocabulary,
} from './dto/vocabulary.dto';

@Injectable()
export class VocabularyService {
    private readonly logger = new Logger(VocabularyService.name);

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Tạo từ vựng mới
     */
    async createVocabulary(dto: BodyCreateVocabulary): Promise<ResCreateVocabulary> {
        // Kiểm tra topic tồn tại
        const topic = await this.prisma.topic.findUnique({
            where: { id: dto.topicId },
        });

        if (!topic) {
            throw new NotFoundException(`Topic with id "${dto.topicId}" not found`);
        }

        // Kiểm tra từ đã tồn tại trong topic chưa
        const existing = await this.prisma.vocabulary.findUnique({
            where: {
                word_topicId: {
                    word: dto.word,
                    topicId: dto.topicId,
                },
            },
        });

        if (existing) {
            throw new ConflictException(`Word "${dto.word}" already exists in this topic`);
        }

        const vocabulary = await this.prisma.vocabulary.create({
            data: {
                word: dto.word,
                meaning: dto.meaning,
                topicId: dto.topicId,
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
                topic: {
                    select: { id: true, name: true, nameVi: true },
                },
            },
        });

        return this.toResponse(vocabulary);
    }

    /**
     * Tạo nhiều từ vựng cùng lúc
     */
    async bulkCreateVocabularies(dto: BodyBulkCreateVocabulary): Promise<ResBulkCreateVocabulary> {
        const result: ResBulkCreateVocabulary = {
            created: 0,
            failed: 0,
            errors: [],
        };

        for (const vocab of dto.vocabularies) {
            try {
                await this.createVocabulary(vocab);
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
    async getVocabularies(query: QueryFindAllVocabulary): Promise<ResFindAllVocabulary> {
        const {
            search,
            topicId,
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

        if (topicId) {
            where.topicId = topicId;
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
                    topic: {
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
    async getVocabulary(id: string): Promise<ResFindOneVocabulary> {
        const vocabulary = await this.prisma.vocabulary.findUnique({
            where: { id },
            include: {
                topic: {
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
     * Lấy từ vựng ngẫu nhiên theo topic
     */
    async getRandomVocabulariesByTopic(topicId: string, count: number = 10): Promise<ResGetRandomByTopic> {
        const vocabularies = await this.prisma.$queryRaw`
      SELECT * FROM vocabularies 
      WHERE "topicId" = ${topicId} AND "isActive" = true
      ORDER BY RANDOM() 
      LIMIT ${count}
    `;

        return (vocabularies as any[]).map((v) => this.toResponse(v));
    }

    /**
     * Cập nhật từ vựng
     */
    async updateVocabulary(id: string, dto: BodyUpdateVocabulary): Promise<ResUpdateVocabulary> {
        // Kiểm tra từ vựng tồn tại
        const existing = await this.getVocabulary(id);

        // Kiểm tra từ trùng lặp nếu đổi từ hoặc topic
        if (dto.word || dto.topicId) {
            const word = dto.word ?? existing.word;
            const topicId = dto.topicId ?? existing.topicId;

            const duplicate = await this.prisma.vocabulary.findFirst({
                where: {
                    word,
                    topicId,
                    NOT: { id },
                },
            });

            if (duplicate) {
                throw new ConflictException(`Word "${word}" already exists in this topic`);
            }
        }

        const vocabulary = await this.prisma.vocabulary.update({
            where: { id },
            data: dto,
            include: {
                topic: {
                    select: { id: true, name: true, nameVi: true },
                },
            },
        });

        return this.toResponse(vocabulary);
    }

    /**
     * Xóa từ vựng (soft delete)
     */
    async deleteVocabulary(id: string): Promise<ResRemoveVocabulary> {
        await this.getVocabulary(id);

        const updated = await this.prisma.vocabulary.update({
            where: { id },
            data: { isActive: false },
            include: {
                topic: {
                    select: { id: true, name: true, nameVi: true },
                },
            },
        });

        return this.toResponse(updated);
    }

    /**
     * Xóa vĩnh viễn từ vựng
     */
    async hardDeleteVocabulary(id: string): Promise<ResHardDeleteVocabulary> {
        await this.getVocabulary(id);

        const deleted = await this.prisma.vocabulary.delete({
            where: { id },
            include: {
                topic: {
                    select: { id: true, name: true, nameVi: true },
                },
            },
        });

        return this.toResponse(deleted);
    }

    /**
     * Convert entity to response
     */
    private toResponse(vocabulary: any): ResVocabulary {
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
            topicId: vocabulary.topicId,
            topic: vocabulary.topic,
            isActive: vocabulary.isActive,
            createdAt: vocabulary.createdAt,
            updatedAt: vocabulary.updatedAt,
        };
    }
    /**
     * Generate vocabularies using AI flow (Queued)
     */
    async generateVocabularies(topicId: string, dto: BodyGenerateVocabulary): Promise<ResGenerateVocabulary> {
        // Validate topic exists
        const topic = await this.prisma.topic.findUnique({
            where: { id: topicId },
            include: {
                vocabularies: {
                    select: {
                        word: true
                    }
                }
            },
        });

        if (!topic) {
            throw new NotFoundException(`Topic with id "${topicId}" not found`);
        }
        const excludedWords = topic.vocabularies.map((v) => v.word);

        // Trigger background job
        this.processGeneration(topicId, dto.count, topic.name, topic.description ?? "", excludedWords);

        return {
            message: 'Vocabulary generation started in background',
        };
    }

    @Queued({ concurrency: 1 })
    async processGeneration(topicId: string, count: number, topics: string, description: string, excludedWords?: string[]): Promise<void> {
        this.logger.log(`Starting vocabulary generation for topic ${topicId}`);
        try {
            const result = await generateWordsFlow({
                count,
                topics,
                description,
                excludedWords,
            });

            this.logger.log(`Generated ${result.length} words. Saving to database...`);

            let successCount = 0;
            for (const item of result) {
                try {
                    await this.createVocabulary({
                        word: item.word,
                        meaning: item.meaning,
                        topicId,
                        pronunciation: item.pronunciation,
                        partOfSpeech: item.partOfSpeech,
                        exampleEn: item.exampleEn,
                        exampleVi: item.exampleVi,
                        synonyms: item.synonyms,
                        antonyms: item.antonyms,
                        difficulty: item.difficulty as DifficultyLevel,
                    });
                    successCount++;
                } catch (error: any) {
                    this.logger.warn(`Failed to save word "${item.word}": ${error.message}`);
                }
            }
            this.logger.log(`Vocabulary generation completed. Saved ${successCount}/${result.length} words.`);

        } catch (error) {
            this.logger.error('Vocabulary generation failed', error);
        }
    }
}
