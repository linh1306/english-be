import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import {
    BodyCreateTopic,
    BodyUpdateTopic,
    QueryFindAllTopic,
    ResTopic,
    ResFindAllTopic,
    ResCreateTopic,
    ResUpdateTopic,
    ResFindOneTopic,
    ResRemoveTopic,
    ResHardDeleteTopic,
} from './dto/topic.dto';

@Injectable()
export class TopicService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Tạo danh mục từ vựng mới
     */
    async createTopic(dto: BodyCreateTopic): Promise<ResCreateTopic> {
        // Kiểm tra tên đã tồn tại chưa
        const existing = await this.prisma.topic.findUnique({
            where: { name: dto.name },
        });

        if (existing) {
            throw new ConflictException(`Topic with name "${dto.name}" already exists`);
        }

        const topic = await this.prisma.topic.create({
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

        return this.toResponse(topic);
    }

    /**
     * Lấy danh sách danh mục với phân trang và filter
     */
    async getTopics(query: QueryFindAllTopic): Promise<ResFindAllTopic> {
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

        const [topics, total] = await Promise.all([
            this.prisma.topic.findMany({
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
            this.prisma.topic.count({ where }),
        ]);

        return {
            data: topics.map((c) => this.toResponse(c)),
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
    async getTopic(id: string): Promise<ResFindOneTopic> {
        const topic = await this.prisma.topic.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { vocabularies: true },
                },
            },
        });

        if (!topic) {
            throw new NotFoundException(`Topic with id "${id}" not found`);
        }

        return this.toResponse(topic);
    }

    /**
     * Cập nhật danh mục
     */
    async updateTopic(id: string, dto: BodyUpdateTopic): Promise<ResUpdateTopic> {
        // Kiểm tra danh mục tồn tại
        await this.getTopic(id);

        // Kiểm tra tên trùng lặp nếu đổi tên
        if (dto.name) {
            const existing = await this.prisma.topic.findFirst({
                where: {
                    name: dto.name,
                    NOT: { id },
                },
            });

            if (existing) {
                throw new ConflictException(`Topic with name "${dto.name}" already exists`);
            }
        }

        const topic = await this.prisma.topic.update({
            where: { id },
            data: dto,
            include: {
                _count: {
                    select: { vocabularies: true },
                },
            },
        });

        return this.toResponse(topic);
    }

    /**
     * Xóa danh mục (soft delete bằng cách set isActive = false)
     */
    async deleteTopic(id: string): Promise<ResRemoveTopic> {
        await this.getTopic(id);

        const updated = await this.prisma.topic.update({
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
    async hardDeleteTopic(id: string): Promise<ResHardDeleteTopic> {
        await this.getTopic(id);

        const deleted = await this.prisma.topic.delete({
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
    private toResponse(topic: any): ResTopic {
        return {
            id: topic.id,
            name: topic.name,
            nameVi: topic.nameVi,
            description: topic.description,
            thumbnail: topic.thumbnail,
            difficulty: topic.difficulty,
            order: topic.order,
            isActive: topic.isActive,
            vocabularyCount: topic._count?.vocabularies ?? 0,
            createdAt: topic.createdAt,
            updatedAt: topic.updatedAt,
        };
    }
}
