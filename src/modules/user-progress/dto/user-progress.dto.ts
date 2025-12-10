import { ProficiencyLevel } from '../../../generated/prisma/enums';

// ==================== REVIEW ANSWER ====================
export class ReviewAnswerDto {
    vocabularyId!: string;
    isCorrect!: boolean;
    responseTimeMs?: number;
}

// ==================== QUERY ====================
export class QueryUserProgressDto {
    userId?: string;
    categoryId?: string;
    proficiency?: ProficiencyLevel;
    dueForReview?: boolean; // Lấy các từ cần ôn tập
    page?: number;
    limit?: number;
    sortBy?: 'nextReviewAt' | 'proficiency' | 'lastReviewedAt' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
}

// ==================== RESPONSE ====================
export interface UserVocabularyProgressResponse {
    id: string;
    userId: string;
    vocabularyId: string;
    vocabulary?: {
        id: string;
        word: string;
        meaning: string;
        pronunciation: string | null;
        imageUrl: string | null;
        audioUrl: string | null;
    };
    proficiency: ProficiencyLevel;
    easeFactor: number;
    interval: number;
    repetitions: number;
    correctCount: number;
    incorrectCount: number;
    streak: number;
    bestStreak: number;
    lastReviewedAt: Date | null;
    nextReviewAt: Date | null;
    firstLearnedAt: Date;
    masteredAt: Date | null;
}

export interface PaginatedUserProgressResponse {
    data: UserVocabularyProgressResponse[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

// ==================== STATISTICS ====================
export interface UserLearningStatistics {
    userId: string;
    totalWordsLearned: number;
    totalWordsMastered: number;
    totalWordsInProgress: number;
    totalWordsNew: number;
    dueForReviewCount: number;
    overallAccuracy: number; // Percentage
    totalReviews: number;
    currentStreak: number;
    longestStreak: number;
    categoryProgress: CategoryProgressItem[];
}

export interface CategoryProgressItem {
    categoryId: string;
    categoryName: string;
    categoryNameVi: string | null;
    totalWords: number;
    learnedWords: number;
    masteredWords: number;
    progressPercent: number;
    lastStudiedAt: Date | null;
}

// ==================== STUDY SESSION ====================
export class StartStudySessionDto {
    categoryId?: string;
    mode!: 'new' | 'review' | 'mixed';
    wordCount?: number; // Số từ muốn học, default 10
}

export interface StudySessionResponse {
    sessionId: string;
    words: StudyWordItem[];
    mode: 'new' | 'review' | 'mixed';
    totalWords: number;
}

export interface StudyWordItem {
    vocabularyId: string;
    word: string;
    meaning: string;
    pronunciation: string | null;
    audioUrl: string | null;
    imageUrl: string | null;
    exampleEn: string | null;
    exampleVi: string | null;
    partOfSpeech: string | null;
    isNew: boolean;
    proficiency: ProficiencyLevel;
}

export class SubmitStudyResultDto {
    results!: ReviewAnswerDto[];
}

export interface StudyResultSummary {
    totalWords: number;
    correctCount: number;
    incorrectCount: number;
    accuracy: number;
    newWordsMastered: number;
    xpEarned: number;
}
