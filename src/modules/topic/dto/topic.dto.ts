import { DifficultyLevel } from '../../../generated/prisma/enums';

// ==================== CREATE ====================
// ==================== CREATE ====================
export class BodyCreateTopic {
    name!: string;
    nameVi?: string;
    description?: string;
    thumbnail?: string;
    difficulty?: DifficultyLevel;
    order?: number;
}

// ==================== UPDATE ====================
// ==================== UPDATE ====================
export class BodyUpdateTopic {
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
export class QueryFindAllTopic {
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
export interface ResTopic {
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

export interface ResFindAllTopic {
    data: ResTopic[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export type ResCreateTopic = ResTopic;
export type ResUpdateTopic = ResTopic;
export type ResFindOneTopic = ResTopic;
export type ResRemoveTopic = ResTopic;
export type ResHardDeleteTopic = ResTopic;
