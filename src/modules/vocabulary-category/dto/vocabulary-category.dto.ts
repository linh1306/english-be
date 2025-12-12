import { DifficultyLevel } from '../../../generated/prisma/enums';

// ==================== CREATE ====================
// ==================== CREATE ====================
export class BodyCreateVocabularyCategory {
    name!: string;
    nameVi?: string;
    description?: string;
    thumbnail?: string;
    difficulty?: DifficultyLevel;
    order?: number;
}

// ==================== UPDATE ====================
// ==================== UPDATE ====================
export class BodyUpdateVocabularyCategory {
    name?: string;
    nameVi?: string;
    description?: string;
    thumbnail?: string;
    difficulty?: DifficultyLevel;
    order?: number;
    isActive?: boolean;
}

// ==================== QUERY ====================
// ==================== QUERY ====================
export class QueryFindAllVocabularyCategory {
    search?: string;
    difficulty?: DifficultyLevel;
    isActive?: boolean;
    page?: number;
    limit?: number;
    sortBy?: 'name' | 'order' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
}

// ==================== RESPONSE ====================
// ==================== RESPONSE ====================
export interface ResVocabularyCategory {
    id: string;
    name: string;
    nameVi: string | null;
    description: string | null;
    thumbnail: string | null;
    difficulty: DifficultyLevel;
    order: number;
    isActive: boolean;
    vocabularyCount?: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface ResFindAllVocabularyCategory {
    data: ResVocabularyCategory[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export type ResCreateVocabularyCategory = ResVocabularyCategory;
export type ResUpdateVocabularyCategory = ResVocabularyCategory;
export type ResFindOneVocabularyCategory = ResVocabularyCategory;
export type ResRemoveVocabularyCategory = ResVocabularyCategory;
export type ResHardDeleteVocabularyCategory = ResVocabularyCategory;
