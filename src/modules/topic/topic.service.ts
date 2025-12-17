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
        const prompt = `A beautiful thumbnail illustration for an English learning topic: "${name}"${description ? `. Description: ${description}` : ''}. Educational and visually appealing.`;

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

    async getTopics(query: QueryFindAllTopic) {
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

        if (isActive) {
            where.isActive = isActive;
        }

        const [topics, total] = await Promise.all([
            this.prisma.topic.findMany({
                where,
                ...options,
                select: selectTopic
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

    async deleteTopic(id: string) {
        await this.prisma.topic.delete({
            where: { id },
        });

        return {
            message: "oke"
        };
    }
}
