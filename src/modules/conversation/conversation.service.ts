import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Queued } from '@/core/queue/queued.decorator';
import { PrismaService } from '@/core/database/prisma.service';
import { generateConversationFlow } from '@/flows/generate-conversation.flow';
import { AudioService } from '@/modules/audio/audio.service';
import {
    BodyCreateConversation,
    BodyGenerateConversation,
    BodyUpdateConversation,
    QueryGetConversations,
    DialogueLine,
} from './dto/conversation.dto';

@Injectable()
export class ConversationService {
    private readonly logger = new Logger(ConversationService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly audioService: AudioService,
    ) { }

    /**
     * Tạo conversation mới
     */
    async createConversation(dto: BodyCreateConversation) {
        const conversation = await this.prisma.conversation.create({
            data: {
                topic: dto.topic,
                context: dto.context,
                dialogues: dto.dialogues,
            },
        });

        return conversation;
    }

    /**
     * Lấy danh sách conversations với phân trang
     */
    async getConversations(query: QueryGetConversations) {
        const { page = 1, limit = 20, search, isActive } = query;
        const skip = (page - 1) * limit;

        const where: any = {};

        if (isActive !== undefined) {
            where.isActive = isActive;
        }

        if (search) {
            where.OR = [
                { topic: { contains: search, mode: 'insensitive' } },
                { context: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [items, total] = await Promise.all([
            this.prisma.conversation.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.conversation.count({ where }),
        ]);

        return {
            data: items,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Lấy chi tiết một conversation
     */
    async getConversation(id: string) {
        const item = await this.prisma.conversation.findUnique({
            where: { id },
        });

        if (!item) {
            throw new NotFoundException(`Conversation with id "${id}" not found`);
        }

        return item;
    }

    /**
     * Xóa nhiều conversations
     */
    async deleteConversations(ids: string[]) {
        const result = await this.prisma.conversation.deleteMany({
            where: { id: { in: ids } },
        });

        return {
            deletedCount: result.count,
        };
    }

    /**
     * Update conversation
     */
    async updateConversation(id: string, dto: BodyUpdateConversation) {
        // Kiểm tra tồn tại
        await this.getConversation(id);

        const updated = await this.prisma.conversation.update({
            where: { id },
            data: {
                ...(dto.topic && { topic: dto.topic }),
                ...(dto.context && { context: dto.context }),
                ...(dto.dialogues && { dialogues: dto.dialogues }),
                ...(dto.isActive !== undefined && { isActive: dto.isActive }),
            },
        });

        return updated;
    }


    /**
     * Generate conversations bằng AI
     */
    async generateConversation(dto: BodyGenerateConversation) {
        this.processGeneration(dto.topic, dto.count ?? 1, dto.dialogueLength ?? 8);

        return {
            message: 'Conversation generation started in background',
        };
    }

    @Queued({ concurrency: 1 })
    async processGeneration(
        topic: string | undefined,
        count: number,
        dialogueLength: number,
    ): Promise<void> {
        this.logger.log(
            `Starting conversation generation for topic: "${topic ?? 'Auto APTIS'}"`,
        );

        try {
            const results = await generateConversationFlow({
                topic,
                count,
                dialogueLength,
            });

            this.logger.log(
                `Generated ${results.length} conversations. Saving to database...`,
            );

            let successCount = 0;
            for (const item of results) {
                try {
                    const conversation = await this.createConversation({
                        topic: item.topic,
                        context: item.context,
                        dialogues: item.dialogues,
                    });
                    successCount++;

                    this.logger.log(`Created conversation: ${conversation.id}`);

                    // Tự động tạo audio cho conversation
                    this.audioService.generateConversationAudio({
                        conversationId: conversation.id,
                        dialogues: item.dialogues,
                    });

                    this.logger.log(
                        `Audio generation queued for conversation: ${conversation.id}`,
                    );
                } catch (error: any) {
                    this.logger.warn(`Failed to save conversation: ${error.message}`);
                }
            }

            this.logger.log(
                `Conversation generation completed. Saved ${successCount}/${results.length}`,
            );
        } catch (error) {
            this.logger.error('Conversation generation failed', error);
        }
    }
}

