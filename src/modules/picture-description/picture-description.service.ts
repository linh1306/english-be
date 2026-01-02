import {
    Injectable,
    NotFoundException,
    Logger,
} from '@nestjs/common';
import { generatePictureDescriptionFlow } from '../../flows/generate-picture-description.flow';
import { gradePictureAnswerFlow } from '../../flows/grade-picture-answer.flow';
import { generateGhibliImage } from '../../flows/generate-image.flow';
import { Queued } from '../../core/queue/queued.decorator';
import { PrismaService } from '../../core/database/prisma.service';
import { CloudinaryService } from '../../core/cloudinary/cloudinary.service';
import {
    BodyCreatePictureDescription,
    BodyUpdatePictureDescription,
    QueryGetPicturesDescription,
    BodyGeneratePictureDescription,
    BodySubmitAnswer,
} from './dto/picture-description.dto';
import { parseQuery } from '@/core';

@Injectable()
export class PictureDescriptionService {
    private readonly logger = new Logger(PictureDescriptionService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly cloudinaryService: CloudinaryService,
    ) { }

    /**
     * Tạo ảnh từ description và upload lên Cloudinary
     */
    @Queued({ maxRetries: 2, retryDelay: 2000 })
    async generateAndUpdateImage(pictureDescriptionId: string, description: string) {
        this.logger.log(
            `Starting image generation for picture description ${pictureDescriptionId}`,
        );

        const prompt = `Create an illustration for the following scene description. The style should be clean, modern and suitable for English learning materials: "${description}"`;

        const imageBuffer = await generateGhibliImage({
            prompt,
            aspectRatio: '4:3',
        });

        const { large } = await this.cloudinaryService.uploadImage(
            imageBuffer,
            'picture-descriptions',
        );

        await this.prisma.pictureDescription.update({
            where: { id: pictureDescriptionId },
            data: { imageUrl: large },
        });

        this.logger.log(`Image updated for picture description ${pictureDescriptionId}`);
    }

    /**
     * Tạo picture description mới
     */
    async create(dto: BodyCreatePictureDescription) {
        const pictureDescription = await this.prisma.pictureDescription.create({
            data: {
                description: dto.description,
                partsEn: dto.partsEn,
                partsVi: dto.partsVi,
                imageUrl: dto.imageUrl ?? null,
            },
        });

        // Nếu chưa có imageUrl, queue generate ảnh
        if (!dto.imageUrl) {
            this.generateAndUpdateImage(pictureDescription.id, dto.description);
        }

        return pictureDescription;
    }

    /**
     * Lấy danh sách picture descriptions với phân trang
     */
    async findAll(query: QueryGetPicturesDescription) {
        const { page = 1, limit = 20, isActive } = query;
        const options = parseQuery(query);

        const where: any = {};

        if (isActive !== undefined) {
            where.isActive = isActive;
        }

        const [items, total] = await Promise.all([
            this.prisma.pictureDescription.findMany({
                where,
                ...options,
            }),
            this.prisma.pictureDescription.count({ where }),
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
     * Lấy chi tiết một picture description
     */
    async findOne(id: string) {
        const item = await this.prisma.pictureDescription.findUnique({
            where: { id },
        });

        if (!item) {
            throw new NotFoundException(`Picture description with id "${id}" not found`);
        }

        return item;
    }

    /**
     * Cập nhật picture description
     */
    async update(id: string, dto: BodyUpdatePictureDescription) {
        const item = await this.prisma.pictureDescription.update({
            where: { id },
            data: dto,
        });

        return item;
    }

    /**
     * Xóa nhiều picture descriptions
     */
    async delete(ids: string[]) {
        const result = await this.prisma.pictureDescription.deleteMany({
            where: { id: { in: ids } },
        });

        return {
            deletedCount: result.count,
        };
    }

    /**
     * Generate picture descriptions bằng AI
     */
    async generate(dto: BodyGeneratePictureDescription) {
        this.processGeneration(dto.context, dto.count ?? 1);

        return {
            message: 'Picture description generation started in background',
        };
    }

    @Queued({ concurrency: 1 })
    async processGeneration(context: string | undefined, count: number): Promise<void> {
        this.logger.log(`Starting picture description generation for context: "${context ?? 'Auto APTIS'}"`);

        try {
            const results = await generatePictureDescriptionFlow({ context, count });

            this.logger.log(`Generated ${results.length} descriptions. Saving to database...`);

            let successCount = 0;
            for (const item of results) {
                try {
                    const pictureDescription = await this.create({
                        description: item.description,
                        partsEn: item.partsEn,
                        partsVi: item.partsVi,
                        imageUrl: null,
                    });
                    successCount++;

                    // Image generation is triggered in create() method
                    this.logger.log(`Created picture description: ${pictureDescription.id}`);
                } catch (error: any) {
                    this.logger.warn(`Failed to save picture description: ${error.message}`);
                }
            }

            this.logger.log(
                `Picture description generation completed. Saved ${successCount}/${results.length}`,
            );
        } catch (error) {
            this.logger.error('Picture description generation failed', error);
        }
    }

    /**
     * Submit câu trả lời và chấm điểm
     */
    async submitAnswer(
        userId: string,
        pictureDescriptionId: string,
        dto: BodySubmitAnswer,
    ) {
        // Lấy picture description
        const pictureDescription = await this.findOne(pictureDescriptionId);

        // Chấm điểm bằng AI
        const gradeResult = await gradePictureAnswerFlow({
            originalDescription: pictureDescription.description,
            partsEn: pictureDescription.partsEn,
            userAnswer: dto.answer,
        });

        // Lưu câu trả lời
        const userAnswer = await this.prisma.userPictureAnswer.create({
            data: {
                userId,
                pictureDescriptionId,
                answer: dto.answer,
                score: gradeResult.score,
                feedback: gradeResult.feedback,
                matchedParts: gradeResult.matchedParts,
            },
            include: {
                pictureDescription: {
                    select: { id: true, description: true },
                },
            },
        });

        return {
            ...userAnswer,
            grammarErrors: gradeResult.grammarErrors,
            suggestions: gradeResult.suggestions,
        };
    }

    /**
     * Lấy lịch sử câu trả lời của user cho một picture description
     */
    async getUserAnswers(userId: string, pictureDescriptionId: string) {
        const answers = await this.prisma.userPictureAnswer.findMany({
            where: {
                userId,
                pictureDescriptionId,
            },
            orderBy: { createdAt: 'desc' },
        });

        return answers;
    }

    /**
     * Lấy tất cả câu trả lời của user (có phân trang)
     */
    async getAllUserAnswers(userId: string, page = 1, limit = 20) {
        const [items, total] = await Promise.all([
            this.prisma.userPictureAnswer.findMany({
                where: { userId },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    pictureDescription: {
                        select: { id: true, imageUrl: true, description: true },
                    },
                },
            }),
            this.prisma.userPictureAnswer.count({ where: { userId } }),
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
}
