import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { ProficiencyLevel } from '../../generated/prisma/enums';
import {
    ReviewAnswerDto,
    QueryUserProgressDto,
    UserVocabularyProgressResponse,
    PaginatedUserProgressResponse,
    UserLearningStatistics,
    CategoryProgressItem,
    StartStudySessionDto,
    StudySessionResponse,
    StudyWordItem,
    SubmitStudyResultDto,
    StudyResultSummary,
} from './dto/user-progress.dto';

@Injectable()
export class UserProgressService {
    constructor(private readonly prisma: PrismaService) { }

    // ==================== SM-2 ALGORITHM ====================
    /**
     * Tính toán Spaced Repetition theo thuật toán SM-2
     * @param quality - Chất lượng trả lời (0-5), 3+ là đúng
     * @param easeFactor - Hệ số dễ hiện tại
     * @param interval - Khoảng cách ôn tập hiện tại (ngày)
     * @param repetitions - Số lần ôn tập thành công liên tiếp
     */
    private calculateSM2(
        quality: number,
        easeFactor: number,
        interval: number,
        repetitions: number,
    ): { newEaseFactor: number; newInterval: number; newRepetitions: number } {
        // Clamp quality between 0 and 5
        quality = Math.max(0, Math.min(5, quality));

        let newEaseFactor = easeFactor;
        let newInterval = interval;
        let newRepetitions = repetitions;

        if (quality >= 3) {
            // Correct answer
            if (repetitions === 0) {
                newInterval = 1;
            } else if (repetitions === 1) {
                newInterval = 6;
            } else {
                newInterval = Math.round(interval * easeFactor);
            }
            newRepetitions = repetitions + 1;
        } else {
            // Incorrect answer - reset
            newRepetitions = 0;
            newInterval = 1;
        }

        // Update ease factor
        newEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
        newEaseFactor = Math.max(1.3, newEaseFactor); // Minimum ease factor

        return { newEaseFactor, newInterval, newRepetitions };
    }

    /**
     * Xác định proficiency level dựa trên repetitions và interval
     */
    private determineProficiency(repetitions: number, interval: number): ProficiencyLevel {
        if (repetitions === 0) return 'NEW';
        if (interval >= 21 && repetitions >= 5) return 'MASTERED';
        if (interval >= 7) return 'REVIEWING';
        return 'LEARNING';
    }

    // ==================== PROGRESS MANAGEMENT ====================

    /**
     * Lấy hoặc tạo progress cho một từ vựng
     */
    async getOrCreateProgress(userId: string, vocabularyId: string): Promise<UserVocabularyProgressResponse> {
        let progress = await this.prisma.userVocabularyProgress.findUnique({
            where: {
                userId_vocabularyId: { userId, vocabularyId },
            },
            include: {
                vocabulary: {
                    select: {
                        id: true,
                        word: true,
                        meaning: true,
                        pronunciation: true,
                        imageUrl: true,
                        audioUrl: true,
                    },
                },
            },
        });

        if (!progress) {
            // Kiểm tra vocabulary tồn tại
            const vocabulary = await this.prisma.vocabulary.findUnique({
                where: { id: vocabularyId },
            });

            if (!vocabulary) {
                throw new NotFoundException(`Vocabulary with id "${vocabularyId}" not found`);
            }

            progress = await this.prisma.userVocabularyProgress.create({
                data: {
                    userId,
                    vocabularyId,
                    proficiency: 'NEW',
                },
                include: {
                    vocabulary: {
                        select: {
                            id: true,
                            word: true,
                            meaning: true,
                            pronunciation: true,
                            imageUrl: true,
                            audioUrl: true,
                        },
                    },
                },
            });

            // Update category progress
            await this.updateCategoryProgress(userId, vocabulary.categoryId);
        }

        return this.toProgressResponse(progress);
    }

    /**
     * Ghi nhận kết quả ôn tập một từ
     */
    async recordReview(userId: string, dto: ReviewAnswerDto): Promise<UserVocabularyProgressResponse> {
        const progress = await this.getOrCreateProgress(userId, dto.vocabularyId);

        // Tính quality score (0-5)
        const quality = dto.isCorrect ? 4 : 1;

        // Áp dụng SM-2
        const { newEaseFactor, newInterval, newRepetitions } = this.calculateSM2(
            quality,
            progress.easeFactor,
            progress.interval,
            progress.repetitions,
        );

        // Xác định proficiency mới
        const newProficiency = this.determineProficiency(newRepetitions, newInterval);

        // Tính nextReviewAt
        const nextReviewAt = new Date();
        nextReviewAt.setDate(nextReviewAt.getDate() + newInterval);

        // Update progress
        const updated = await this.prisma.userVocabularyProgress.update({
            where: {
                userId_vocabularyId: { userId, vocabularyId: dto.vocabularyId },
            },
            data: {
                easeFactor: newEaseFactor,
                interval: newInterval,
                repetitions: newRepetitions,
                proficiency: newProficiency,
                correctCount: dto.isCorrect ? { increment: 1 } : undefined,
                incorrectCount: !dto.isCorrect ? { increment: 1 } : undefined,
                streak: dto.isCorrect ? { increment: 1 } : 0,
                bestStreak: dto.isCorrect && progress.streak + 1 > progress.bestStreak
                    ? progress.streak + 1
                    : undefined,
                lastReviewedAt: new Date(),
                nextReviewAt,
                masteredAt: newProficiency === 'MASTERED' && progress.proficiency !== 'MASTERED'
                    ? new Date()
                    : undefined,
            },
            include: {
                vocabulary: {
                    select: {
                        id: true,
                        word: true,
                        meaning: true,
                        pronunciation: true,
                        imageUrl: true,
                        audioUrl: true,
                        categoryId: true,
                    },
                },
            },
        });

        // Update category progress
        await this.updateCategoryProgress(userId, (updated.vocabulary as any).categoryId);

        return this.toProgressResponse(updated);
    }

    /**
     * Lấy danh sách progress của user
     */
    async findAll(userId: string, query: QueryUserProgressDto): Promise<PaginatedUserProgressResponse> {
        const {
            categoryId,
            proficiency,
            dueForReview,
            page = 1,
            limit = 20,
            sortBy = 'nextReviewAt',
            sortOrder = 'asc',
        } = query;

        const where: any = { userId };

        if (categoryId) {
            where.vocabulary = { categoryId };
        }

        if (proficiency) {
            where.proficiency = proficiency;
        }

        if (dueForReview) {
            where.nextReviewAt = { lte: new Date() };
            where.proficiency = { not: 'NEW' };
        }

        const [progresses, total] = await Promise.all([
            this.prisma.userVocabularyProgress.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
                include: {
                    vocabulary: {
                        select: {
                            id: true,
                            word: true,
                            meaning: true,
                            pronunciation: true,
                            imageUrl: true,
                            audioUrl: true,
                        },
                    },
                },
            }),
            this.prisma.userVocabularyProgress.count({ where }),
        ]);

        return {
            data: progresses.map((p) => this.toProgressResponse(p)),
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Lấy các từ cần ôn tập hôm nay
     */
    async getDueForReview(userId: string, limit: number = 20): Promise<UserVocabularyProgressResponse[]> {
        const progresses = await this.prisma.userVocabularyProgress.findMany({
            where: {
                userId,
                nextReviewAt: { lte: new Date() },
                proficiency: { not: 'NEW' },
            },
            take: limit,
            orderBy: { nextReviewAt: 'asc' },
            include: {
                vocabulary: {
                    select: {
                        id: true,
                        word: true,
                        meaning: true,
                        pronunciation: true,
                        imageUrl: true,
                        audioUrl: true,
                    },
                },
            },
        });

        return progresses.map((p) => this.toProgressResponse(p));
    }

    // ==================== STATISTICS ====================

    /**
     * Lấy thống kê học tập của user
     */
    async getStatistics(userId: string): Promise<UserLearningStatistics> {
        const [progressStats, categoryProgress, dueCount] = await Promise.all([
            this.prisma.userVocabularyProgress.groupBy({
                by: ['proficiency'],
                where: { userId },
                _count: true,
            }),
            this.getCategoryProgress(userId),
            this.prisma.userVocabularyProgress.count({
                where: {
                    userId,
                    nextReviewAt: { lte: new Date() },
                    proficiency: { not: 'NEW' },
                },
            }),
        ]);

        // Aggregate stats
        const aggregated = await this.prisma.userVocabularyProgress.aggregate({
            where: { userId },
            _sum: {
                correctCount: true,
                incorrectCount: true,
            },
            _max: {
                bestStreak: true,
                streak: true,
            },
        });

        const totalCorrect = aggregated._sum.correctCount ?? 0;
        const totalIncorrect = aggregated._sum.incorrectCount ?? 0;
        const totalReviews = totalCorrect + totalIncorrect;
        const accuracy = totalReviews > 0 ? (totalCorrect / totalReviews) * 100 : 0;

        // Count by proficiency
        const proficiencyCounts: Record<ProficiencyLevel, number> = {
            NEW: 0,
            LEARNING: 0,
            REVIEWING: 0,
            MASTERED: 0,
        };

        progressStats.forEach((stat) => {
            proficiencyCounts[stat.proficiency] = stat._count;
        });

        const totalLearned = proficiencyCounts.LEARNING + proficiencyCounts.REVIEWING + proficiencyCounts.MASTERED;

        return {
            userId,
            totalWordsLearned: totalLearned,
            totalWordsMastered: proficiencyCounts.MASTERED,
            totalWordsInProgress: proficiencyCounts.LEARNING + proficiencyCounts.REVIEWING,
            totalWordsNew: proficiencyCounts.NEW,
            dueForReviewCount: dueCount,
            overallAccuracy: Math.round(accuracy * 100) / 100,
            totalReviews,
            currentStreak: aggregated._max.streak ?? 0,
            longestStreak: aggregated._max.bestStreak ?? 0,
            categoryProgress,
        };
    }

    /**
     * Lấy tiến trình theo từng category
     */
    async getCategoryProgress(userId: string): Promise<CategoryProgressItem[]> {
        const categoryProgresses = await this.prisma.userCategoryProgress.findMany({
            where: { userId },
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                        nameVi: true,
                        _count: {
                            select: { vocabularies: { where: { isActive: true } } },
                        },
                    },
                },
            },
        });

        return categoryProgresses.map((cp) => ({
            categoryId: cp.categoryId,
            categoryName: cp.category.name,
            categoryNameVi: cp.category.nameVi,
            totalWords: cp.category._count.vocabularies,
            learnedWords: cp.learnedWords,
            masteredWords: cp.masteredWords,
            progressPercent: cp.category._count.vocabularies > 0
                ? Math.round((cp.learnedWords / cp.category._count.vocabularies) * 100)
                : 0,
            lastStudiedAt: cp.lastStudiedAt,
        }));
    }

    /**
     * Cập nhật tiến trình category của user
     */
    private async updateCategoryProgress(userId: string, categoryId: string): Promise<void> {
        const stats = await this.prisma.userVocabularyProgress.groupBy({
            by: ['proficiency'],
            where: {
                userId,
                vocabulary: { categoryId },
            },
            _count: true,
        });

        let learnedWords = 0;
        let masteredWords = 0;

        stats.forEach((stat) => {
            if (stat.proficiency !== 'NEW') {
                learnedWords += stat._count;
            }
            if (stat.proficiency === 'MASTERED') {
                masteredWords += stat._count;
            }
        });

        const totalWords = await this.prisma.vocabulary.count({
            where: { categoryId, isActive: true },
        });

        await this.prisma.userCategoryProgress.upsert({
            where: {
                userId_categoryId: { userId, categoryId },
            },
            create: {
                userId,
                categoryId,
                totalWords,
                learnedWords,
                masteredWords,
                lastStudiedAt: new Date(),
            },
            update: {
                totalWords,
                learnedWords,
                masteredWords,
                lastStudiedAt: new Date(),
                completedAt: learnedWords >= totalWords ? new Date() : null,
            },
        });
    }

    // ==================== STUDY SESSION ====================

    /**
     * Bắt đầu phiên học mới
     */
    async startStudySession(userId: string, dto: StartStudySessionDto): Promise<StudySessionResponse> {
        const { categoryId, mode, wordCount = 10 } = dto;

        let words: any[] = [];

        if (mode === 'new' || mode === 'mixed') {
            // Lấy từ mới chưa học
            const newWords = await this.getNewWords(userId, categoryId, mode === 'new' ? wordCount : Math.ceil(wordCount / 2));
            words = words.concat(newWords);
        }

        if (mode === 'review' || mode === 'mixed') {
            // Lấy từ cần ôn tập
            const reviewWords = await this.getReviewWords(userId, categoryId, mode === 'review' ? wordCount : Math.floor(wordCount / 2));
            words = words.concat(reviewWords);
        }

        // Shuffle words
        words = this.shuffleArray(words);

        // Tạo StudySession ID (không lưu DB vì đã bỏ LearningSession)
        const sessionId = `session_${Date.now()}_${userId}`;

        return {
            sessionId,
            words: words.map((w) => ({
                vocabularyId: w.id,
                word: w.word,
                meaning: w.meaning,
                pronunciation: w.pronunciation,
                audioUrl: w.audioUrl,
                imageUrl: w.imageUrl,
                exampleEn: w.exampleEn,
                exampleVi: w.exampleVi,
                partOfSpeech: w.partOfSpeech,
                isNew: w.isNew ?? true,
                proficiency: w.proficiency ?? 'NEW',
            })),
            mode,
            totalWords: words.length,
        };
    }

    /**
     * Lấy từ mới chưa học
     */
    private async getNewWords(userId: string, categoryId?: string, limit: number = 10): Promise<any[]> {
        const where: any = {
            isActive: true,
            NOT: {
                userProgress: {
                    some: { userId },
                },
            },
        };

        if (categoryId) {
            where.categoryId = categoryId;
        }

        const words = await this.prisma.vocabulary.findMany({
            where,
            take: limit,
            select: {
                id: true,
                word: true,
                meaning: true,
                pronunciation: true,
                audioUrl: true,
                imageUrl: true,
                exampleEn: true,
                exampleVi: true,
                partOfSpeech: true,
            },
        });

        return words.map((w) => ({ ...w, isNew: true, proficiency: 'NEW' }));
    }

    /**
     * Lấy từ cần ôn tập
     */
    private async getReviewWords(userId: string, categoryId?: string, limit: number = 10): Promise<any[]> {
        const where: any = {
            userId,
            nextReviewAt: { lte: new Date() },
            proficiency: { not: 'NEW' },
        };

        if (categoryId) {
            where.vocabulary = { categoryId };
        }

        const progresses = await this.prisma.userVocabularyProgress.findMany({
            where,
            take: limit,
            orderBy: { nextReviewAt: 'asc' },
            include: {
                vocabulary: {
                    select: {
                        id: true,
                        word: true,
                        meaning: true,
                        pronunciation: true,
                        audioUrl: true,
                        imageUrl: true,
                        exampleEn: true,
                        exampleVi: true,
                        partOfSpeech: true,
                    },
                },
            },
        });

        return progresses.map((p) => ({
            ...p.vocabulary,
            isNew: false,
            proficiency: p.proficiency,
        }));
    }

    /**
     * Submit kết quả học tập
     */
    async submitStudyResult(userId: string, dto: SubmitStudyResultDto): Promise<StudyResultSummary> {
        let correctCount = 0;
        let incorrectCount = 0;
        let newWordsMastered = 0;

        for (const result of dto.results) {
            const before = await this.prisma.userVocabularyProgress.findUnique({
                where: { userId_vocabularyId: { userId, vocabularyId: result.vocabularyId } },
            });

            await this.recordReview(userId, result);

            if (result.isCorrect) {
                correctCount++;
            } else {
                incorrectCount++;
            }

            // Check if word was just mastered
            const after = await this.prisma.userVocabularyProgress.findUnique({
                where: { userId_vocabularyId: { userId, vocabularyId: result.vocabularyId } },
            });

            if (after?.proficiency === 'MASTERED' && before?.proficiency !== 'MASTERED') {
                newWordsMastered++;
            }
        }

        const totalWords = dto.results.length;
        const accuracy = totalWords > 0 ? (correctCount / totalWords) * 100 : 0;

        // Calculate XP: 10 XP per correct, 50 XP per mastered
        const xpEarned = correctCount * 10 + newWordsMastered * 50;

        return {
            totalWords,
            correctCount,
            incorrectCount,
            accuracy: Math.round(accuracy * 100) / 100,
            newWordsMastered,
            xpEarned,
        };
    }

    /**
     * Fisher-Yates shuffle
     */
    private shuffleArray<T>(array: T[]): T[] {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    /**
     * Convert entity to response
     */
    private toProgressResponse(progress: any): UserVocabularyProgressResponse {
        return {
            id: progress.id,
            userId: progress.userId,
            vocabularyId: progress.vocabularyId,
            vocabulary: progress.vocabulary,
            proficiency: progress.proficiency,
            easeFactor: progress.easeFactor,
            interval: progress.interval,
            repetitions: progress.repetitions,
            correctCount: progress.correctCount,
            incorrectCount: progress.incorrectCount,
            streak: progress.streak,
            bestStreak: progress.bestStreak,
            lastReviewedAt: progress.lastReviewedAt,
            nextReviewAt: progress.nextReviewAt,
            firstLearnedAt: progress.firstLearnedAt,
            masteredAt: progress.masteredAt,
        };
    }
}
