import { UserVocabularyProgress } from '../../../generated/prisma/client';
import { Query } from '../../../core/types';

// ==================== REVIEW ANSWER ====================
export type BodyReviewAnswer = {
    vocabularyId: string;
    isCorrect: boolean;
    responseTimeMs?: number;
};

// ==================== QUERY ====================
export type QueryFindAllUserProgress = Query<
    UserVocabularyProgress,
    'userId',
    'nextReviewAt' | 'lastReviewedAt' | 'createdAt'
> & {
    topicId?: string;
    dueForReview?: boolean;
};

// ==================== STUDY SESSION ====================
export type BodyStartStudySession = {
    topicId?: string;
    mode: 'new' | 'review' | 'mixed';
    wordCount?: number;
};

export type BodySubmitStudyResult = {
    results: BodyReviewAnswer[];
};
