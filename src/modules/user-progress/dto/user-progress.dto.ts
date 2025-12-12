import { ProficiencyLevel } from '../../../generated/prisma/enums';

// ==================== REVIEW ANSWER ====================
// ==================== REVIEW ANSWER ====================
export class BodyReviewAnswer {
    vocabularyId!: string;
    isCorrect!: boolean;
    responseTimeMs?: number;
}

// ==================== QUERY ====================
// ==================== QUERY ====================
export class QueryFindAllUserProgress {
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
// ==================== RESPONSE ====================
export interface ResUserVocabularyProgress {
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

export interface ResFindAllUserProgress {
    data: ResUserVocabularyProgress[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

// ==================== STATISTICS ====================
// ==================== STATISTICS ====================
export interface ResGetStatistics {
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
    categoryProgress: ResCategoryProgressItem[];
}

export interface ResCategoryProgressItem {
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
// ==================== STUDY SESSION ====================
export class BodyStartStudySession {
    categoryId?: string;
    mode!: 'new' | 'review' | 'mixed';
    wordCount?: number; // Số từ muốn học, default 10
}

export interface ResStartStudySession {
    sessionId: string;
    words: ResStudyWordItem[];
    mode: 'new' | 'review' | 'mixed';
    totalWords: number;
}

export interface ResStudyWordItem {
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

export class BodySubmitStudyResult {
    results!: BodyReviewAnswer[];
}

export interface ResSubmitStudyResult {
    totalWords: number;
    correctCount: number;
    incorrectCount: number;
    accuracy: number;
    newWordsMastered: number;
    xpEarned: number;
}

export type ResGetOrCreateProgress = ResUserVocabularyProgress;
export type ResRecordReview = ResUserVocabularyProgress;
export type ResGetDueForReview = ResUserVocabularyProgress[];
export type ResGetCategoryProgress = ResCategoryProgressItem[];
