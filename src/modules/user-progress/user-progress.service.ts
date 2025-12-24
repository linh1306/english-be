import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { BodyUpdateProgress, QueryDueReviews } from './dto/user-progress.dto';

const LN2 = Math.log(2);
const REVIEW_THRESHOLD = 0.5;
const MIN_HALF_LIFE = 1; // ngày
const MAX_HALF_LIFE = 365; // ngày
const LEARNED_HALF_LIFE_THRESHOLD = 30; // Từ được coi là "đã học thuộc" khi halfLife >= 7 ngày

// Công thức decay đúng với half-life
function calculateRetention(
  lastReviewedAt: Date | null,
  halfLife: number,
): number {
  if (!lastReviewedAt) return 0;
  const days = (Date.now() - lastReviewedAt.getTime()) / (1000 * 60 * 60 * 24);
  return Math.exp((-LN2 * days) / halfLife);
}

// Tính thời điểm cần ôn tiếp theo
function calculateNextReviewAt(lastReviewedAt: Date, halfLife: number): Date {
  const daysUntilThreshold = (-halfLife * Math.log(REVIEW_THRESHOLD)) / LN2;
  const next = new Date(lastReviewedAt);
  next.setDate(next.getDate() + daysUntilThreshold);
  return next;
}

// Điều chỉnh halfLife dựa trên retention và kết quả
function adjustHalfLife(
  currentHalfLife: number,
  retention: number,
  isCorrect: boolean,
): number {
  if (isCorrect) {
    // Đúng khi gần quên → tăng mạnh halfLife
    // Đúng khi còn nhớ → tăng nhẹ
    const boost = 1 + (1 - retention);
    return Math.min(currentHalfLife * boost, MAX_HALF_LIFE);
  } else {
    // Sai → giảm halfLife
    return Math.max(currentHalfLife * 0.5, MIN_HALF_LIFE);
  }
}

@Injectable()
export class UserProgressService {
  constructor(private readonly prisma: PrismaService) {}

  async updateProgress(
    userId: string,
    vocabularyId: string,
    dto: BodyUpdateProgress,
  ) {
    const { isCorrect } = dto;

    const existing = await this.prisma.userVocabularyProgress.findUnique({
      where: { userId_vocabularyId: { userId, vocabularyId } },
    });

    const now = new Date();

    // Kiểm tra nếu đã ôn trong ngày hôm nay thì bỏ qua
    if (existing?.lastReviewedAt) {
      const lastReviewDate = existing.lastReviewedAt.toDateString();
      const todayDate = now.toDateString();
      if (lastReviewDate === todayDate) {
        return existing; // Đã ôn hôm nay rồi, bỏ qua
      }
    }
    const retention = calculateRetention(
      existing?.lastReviewedAt ?? null,
      existing?.halfLife ?? 1.0,
    );
    const halfLife = adjustHalfLife(
      existing?.halfLife ?? 1.0,
      retention,
      isCorrect,
    );
    const lastReviewedAt = now;
    const nextReviewAt = calculateNextReviewAt(lastReviewedAt, halfLife);

    const result = await this.prisma.userVocabularyProgress.upsert({
      where: { userId_vocabularyId: { userId, vocabularyId } },
      create: {
        userId,
        vocabularyId,
        halfLife,
        lastReviewedAt,
        nextReviewAt,
      },
      update: {
        halfLife,
        lastReviewedAt,
        nextReviewAt,
      },
      include: {
        vocabulary: {
          select: { topicId: true },
        },
      },
    });

    // Cập nhật UserTopicProgress
    const topicId = result.vocabulary.topicId;
    await this.updateTopicProgress(userId, topicId);

    return result;
  }

  /**
   * Cập nhật learningWords và learnedWords trong UserTopicProgress
   */
  private async updateTopicProgress(userId: string, topicId: string) {
    // Đếm số từ đang học và đã học thuộc trong topic này
    const [learningWords, learnedWords] = await Promise.all([
      // learningWords: tổng số từ đã có progress trong topic
      this.prisma.userVocabularyProgress.count({
        where: {
          userId,
          vocabulary: { topicId },
        },
      }),
      // learnedWords: số từ có halfLife >= threshold (đã học thuộc)
      this.prisma.userVocabularyProgress.count({
        where: {
          userId,
          vocabulary: { topicId },
          halfLife: { gte: LEARNED_HALF_LIFE_THRESHOLD },
        },
      }),
    ]);

    // Upsert UserTopicProgress
    await this.prisma.userTopicProgress.upsert({
      where: { userId_topicId: { userId, topicId } },
      create: {
        userId,
        topicId,
        learningWords,
        learnedWords,
      },
      update: {
        learningWords,
        learnedWords,
      },
    });
  }

  async getDueReviews(userId: string, query: QueryDueReviews) {
    const { page = 1, limit = 20, topicId } = query;
    const now = new Date();
    const todayStart = new Date(now.toDateString()); // 00:00:00 hôm nay

    const where: any = {
      userId,
      OR: [
        { nextReviewAt: { lte: now } }, // Đến lúc ôn
        { lastReviewedAt: { gte: todayStart } }, // Mới học hôm nay
      ],
    };
    if (topicId) {
      where.vocabulary = { topicId };
    }

    const [items, total] = await Promise.all([
      this.prisma.userVocabularyProgress.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { nextReviewAt: 'asc' },
        include: {
          vocabulary: {
            include: { topic: { select: { id: true, name: true } } },
          },
        },
      }),
      this.prisma.userVocabularyProgress.count({ where }),
    ]);

    return {
      data: items.map((p) => ({
        ...p,
        retention: calculateRetention(p.lastReviewedAt, p.halfLife),
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
