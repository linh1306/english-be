import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { generateWordsFlow } from '../../flows/generate-words.flow';
import { generateGhibliImage } from '../../flows/generate-image.flow';
import { Queued } from '../../core/queue/queued.decorator';
import { PrismaService } from '../../core/database/prisma.service';
import { CloudinaryService } from '../../core/cloudinary/cloudinary.service';
import {
  BodyCreateVocabulary,
  BodyUpdateVocabulary,
  QueryFindAllVocabulary,
  BodyGenerateVocabulary,
} from './dto/vocabulary.dto';
import { parseQuery } from '@/core';

@Injectable()
export class VocabularyService {
  private readonly logger = new Logger(VocabularyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  /**
   * Tạo ảnh từ vocabulary word và meaning, upload lên Cloudinary và cập nhật vocabulary.
   * Chạy trong background queue nên không block request.
   */
  @Queued({ maxRetries: 2, retryDelay: 2000 })
  async generateAndUpdateImage(vocabularyId: string, word: string) {
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
   * Tạo từ vựng mới
   */
  async createVocabulary(dto: BodyCreateVocabulary) {
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
      throw new ConflictException(
        `Word "${dto.word}" already exists in this topic`,
      );
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
      },
      include: {
        topic: {
          select: { id: true, name: true },
        },
      },
    });

    return vocabulary;
  }

  /**
   * Lấy danh sách từ vựng với phân trang và filter
   */
  async getVocabularies(userId: string, query: QueryFindAllVocabulary) {
    const { search, topicId, partOfSpeech, page = 1, limit = 20 } = query;
    const options = parseQuery(query);

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

    if (partOfSpeech) {
      where.partOfSpeech = partOfSpeech;
    }

    const [vocabularies, total] = await Promise.all([
      this.prisma.vocabulary.findMany({
        where,
        ...options,
      }),
      this.prisma.vocabulary.count({ where }),
    ]);

    return {
      data: vocabularies,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Cập nhật từ vựng
   */
  async updateVocabulary(id: string, dto: BodyUpdateVocabulary) {
    const vocabulary = await this.prisma.vocabulary.update({
      where: { id },
      data: dto,
    });

    return vocabulary;
  }

  /**
   * Xóa vĩnh viễn nhiều từ vựng
   */
  async deleteVocabularies(ids: string[]) {
    const result = await this.prisma.vocabulary.deleteMany({
      where: { id: { in: ids } },
    });

    return {
      deletedCount: result.count,
    };
  }

  /**
   * Generate vocabularies using AI flow (Queued)
   */
  async generateVocabularies(topicId: string, dto: BodyGenerateVocabulary) {
    // Validate topic exists
    const topic = await this.prisma.topic.findUnique({
      where: { id: topicId },
      include: {
        vocabularies: {
          select: {
            word: true,
          },
        },
      },
    });

    if (!topic) {
      throw new NotFoundException(`Topic with id "${topicId}" not found`);
    }
    const excludedWords = topic.vocabularies.map((v) => v.word);

    // Trigger background job
    this.processGeneration(
      topicId,
      dto.count,
      topic.name,
      topic.description ?? '',
      excludedWords,
    );

    return {
      message: 'Vocabulary generation started in background',
    };
  }

  @Queued({ concurrency: 1 })
  async processGeneration(
    topicId: string,
    count: number,
    topics: string,
    description: string,
    excludedWords?: string[],
  ): Promise<void> {
    this.logger.log(`Starting vocabulary generation for topic ${topicId}`);
    try {
      const result = await generateWordsFlow({
        count,
        topics,
        description,
        excludedWords,
      });

      this.logger.log(
        `Generated ${result.length} words. Saving to database...`,
      );

      let successCount = 0;
      for (const item of result) {
        try {
          const vocabulary = await this.createVocabulary({
            word: item.word,
            meaning: item.meaning,
            topicId,
            pronunciation: item.pronunciation ?? null,
            partOfSpeech: item.partOfSpeech ?? null,
            exampleEn: item.exampleEn ?? null,
            exampleVi: item.exampleVi ?? null,
            imageUrl: null,
            audioUrl: null,
            synonyms: item.synonyms ?? [],
            antonyms: item.antonyms ?? [],
          });
          successCount++;

          // Trigger background job để generate ảnh
          this.generateAndUpdateImage(vocabulary.id, item.word);
        } catch (error: any) {
          this.logger.warn(
            `Failed to save word "${item.word}": ${error.message}`,
          );
        }
      }
      this.logger.log(
        `Vocabulary generation completed. Saved ${successCount}/${result.length} words.`,
      );
    } catch (error) {
      this.logger.error('Vocabulary generation failed', error);
    }
  }
}
