import { Injectable, Logger } from '@nestjs/common';
import { Queued } from '@/core/queue/queued.decorator';
import { PrismaService } from '@/core/database/prisma.service';
import { CloudinaryService } from '@/core/cloudinary/cloudinary.service';
import { generateGhibliImage } from '@/flows/generate-image.flow';

@Injectable()
export class ImageService {
    private readonly logger = new Logger(ImageService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly cloudinaryService: CloudinaryService,
    ) { }

    /**
     * Tạo ảnh minh họa cho từ vựng và cập nhật vào database.
     * Chạy trong background queue.
     */
    @Queued({ maxRetries: 2, retryDelay: 2000 })
    async generateImageVocabulary(vocabularyId: string, word: string) {
        this.logger.log(
            `Starting image generation for vocabulary ${vocabularyId}: "${word}"`,
        );

        const prompt = `Create an illustration image for the vocabulary word '${word}' in a Van Gogh style, with no text, moderately detailed, and clearly highlighting the meaning of the word.`;

        const imageBuffer = await generateGhibliImage({
            prompt,
            aspectRatio: '3:4',
        });

        const { large } = await this.cloudinaryService.uploadImage(
            imageBuffer,
            'vocabularies',
        );

        await this.prisma.vocabulary.update({
            where: { id: vocabularyId },
            data: { imageUrl: large },
        });

        this.logger.log(`Image updated for vocabulary ${vocabularyId}`);
    }

    /**
     * Tạo ảnh cho picture description và cập nhật vào database.
     * Chạy trong background queue.
     */
    @Queued({ maxRetries: 2, retryDelay: 2000 })
    async generateImagePictureDescription(
        pictureDescriptionId: string,
        description: string,
    ) {
        this.logger.log(
            `Starting image generation for picture description ${pictureDescriptionId}`,
        );

        const prompt = `Create a photorealistic image for the following scene description. The image should look like a real photograph, with natural lighting, realistic textures, and lifelike details. Suitable for English learning materials: "${description}"`;

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

        this.logger.log(
            `Image updated for picture description ${pictureDescriptionId}`,
        );
    }

    /**
     * Tạo thumbnail cho topic và cập nhật vào database.
     * Chạy trong background queue.
     */
    @Queued({ maxRetries: 2, retryDelay: 2000 })
    async generateImageTopic(
        topicId: string,
        name: string,
        description: string | null,
    ) {
        this.logger.log(`Starting thumbnail generation for topic ${topicId}`);

        const prompt = `Create an illustrative image representing the topic '${name}', inspired by the style of Vincent van Gogh. The image should visually convey the essence and emotion of the topic based on the following description: ${description}. No text included, moderate level of detail, with strong visual elements that clearly highlight and symbolize the topic.`;

        const imageBuffer = await generateGhibliImage({
            prompt,
            aspectRatio: '16:9',
        });

        const { large } = await this.cloudinaryService.uploadImage(
            imageBuffer,
            'topics',
        );

        await this.prisma.topic.update({
            where: { id: topicId },
            data: { thumbnail: large },
        });

        this.logger.log(`Thumbnail updated for topic ${topicId}`);
    }
}
