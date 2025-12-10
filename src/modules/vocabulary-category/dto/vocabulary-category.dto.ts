import { DifficultyLevel } from '../../../generated/prisma/enums';

// ==================== CREATE ====================
export class CreateVocabularyCategoryDto {
    name!: string;
    nameVi?: string;
    description?: string;
    thumbnail?: string;
    difficulty?: DifficultyLevel;
    order?: number;
}

// ==================== UPDATE ====================
export class UpdateVocabularyCategoryDto {
    name?: string;
    nameVi?: string;
    description?: string;
    thumbnail?: string;
    difficulty?: DifficultyLevel;
    order?: number;
    isActive?: boolean;
}

// ==================== QUERY ====================
export class QueryVocabularyCategoryDto {
    search?: string;
    difficulty?: DifficultyLevel;
    isActive?: boolean;
    page?: number;
    limit?: number;
    sortBy?: 'name' | 'order' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
}

// ==================== RESPONSE ====================
export interface VocabularyCategoryResponse {
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

export interface PaginatedVocabularyCategoryResponse {
    data: VocabularyCategoryResponse[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}
