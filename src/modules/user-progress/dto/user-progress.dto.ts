// ==================== UPDATE PROGRESS ====================
export type BodyUpdateProgress = {
    isCorrect: boolean;
};

// ==================== QUERY DUE REVIEWS ====================
export type QueryDueReviews = {
    page?: number;
    limit?: number;
    topicId?: string;
};
