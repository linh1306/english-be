import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import {
    BodyCreateTopic,
    BodyUpdateTopic,
    QueryFindAllTopic,
} from './dto/topic.dto';
import { TopicSelect } from '@/generated/prisma/models';
import { parseQuery } from '@/core';
import { CloudinaryService } from '@/core/cloudinary/cloudinary.service';
import { generateGhibliImage } from '@/flows/generate-image.flow';
import { Queued } from '@/core/queue/queued.decorator';
import { UserRole } from '@/generated/prisma/enums';

const selectTopic: TopicSelect = {
    id: true,
    name: true,
    description: true,
    thumbnail: true,
    isActive: true,
    createdAt: true,
    _count: {
        select: {
            vocabularies: true,
        }
    },
}

@Injectable()
export class TopicService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly cloudinaryService: CloudinaryService,
    ) { }

    /**
     * Tạo thumbnail từ topic name và description, upload lên Cloudinary và cập nhật topic.
     * Chạy trong background queue nên không block request.
     */
    @Queued({ maxRetries: 2, retryDelay: 2000 })
    async generateAndUpdateThumbnail(topicId: string, name: string, description: string | null) {
        const prompt = `Create an illustrative image representing the topic '${name}', inspired by the style of Vincent van Gogh. The image should visually convey the essence and emotion of the topic based on the following description: ${description}. No text included, moderate level of detail, with strong visual elements that clearly highlight and symbolize the topic.`;

        const imageBuffer = await generateGhibliImage({
            prompt,
            aspectRatio: '16:9',
        });

        const { large } = await this.cloudinaryService.uploadImage(imageBuffer, 'topics');

        await this.prisma.topic.update({
            where: { id: topicId },
            data: { thumbnail: large },
        });

        console.log(`[TopicService] Thumbnail updated for topic ${topicId}`);
    }

    async createTopic(dto: BodyCreateTopic) {
        const existing = await this.prisma.topic.findUnique({
            where: { name: dto.name },
        });

        if (existing) {
            throw new ConflictException(`Topic with name "${dto.name}" already exists`);
        }

        const topic = await this.prisma.topic.create({
            data: {
                name: dto.name,
                description: dto.description,
            },
            select: selectTopic,
        });

        // Generate thumbnail trong background
        this.generateAndUpdateThumbnail(topic.id, dto.name, dto.description ?? null);

        return topic;
    }

    async getTopics(query: QueryFindAllTopic, role: UserRole, userId: string) {
        const {
            search,
            isActive,
            page = 1,
            limit = 10,
        } = query;

        const options = parseQuery(query)

        const where: any = {};
        if (search) {
            where.name = { contains: search, mode: 'insensitive' };
        }

        // Admin có thể filter theo isActive, user thường chỉ thấy topics active
        if (role === UserRole.ADMIN) {
            if (isActive !== undefined) {
                where.isActive = isActive;
            }
        } else {
            where.isActive = true;
        }

        const [topics, total] = await Promise.all([
            this.prisma.topic.findMany({
                where,
                ...options,
                select: {
                    id: true,
                    name: true,
                    description: true,
                    thumbnail: true,
                    isActive: true,
                    createdAt: true,
                    _count: {
                        select: {
                            vocabularies: true,
                        }
                    },
                    userProgress: {
                        where: {
                            userId,
                        },
                        select: {
                            learnedWords: true,
                            learningWords: true,
                        }
                    },
                }
            }),
            this.prisma.topic.count({ where }),
        ]);

        return {
            data: topics,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getTopic(id: string) {
        const topic = await this.prisma.topic.findUnique({
            where: { id },
            select: selectTopic,
        });

        if (!topic) {
            throw new NotFoundException(`Topic with id "${id}" not found`);
        }

        return topic;
    }

    async updateTopic(id: string, dto: BodyUpdateTopic) {
        const topic = await this.prisma.topic.update({
            where: { id },
            data: dto,
            select: selectTopic,
        });

        return topic;
    }

    async deleteTopics(ids: string[]) {
        const result = await this.prisma.topic.deleteMany({
            where: { id: { in: ids } },
        });

        return {
            deletedCount: result.count,
        };
    }

    async updateTopics(ids: string[], isActive: boolean) {
        const result = await this.prisma.topic.updateMany({
            where: { id: { in: ids } },
            data: { isActive },
        });

        return {
            updatedCount: result.count,
        };
    }
}
