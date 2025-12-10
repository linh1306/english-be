import { DifficultyLevel } from '../../../generated/prisma/enums';

// ==================== CREATE ====================
export class CreateVocabularyDto {
    word!: string;
    meaning!: string;
    categoryId!: string;
    pronunciation?: string;
    audioUrl?: string;
    partOfSpeech?: string;
    exampleEn?: string;
    exampleVi?: string;
    imageUrl?: string;
    synonyms?: string[];
    antonyms?: string[];
    difficulty?: DifficultyLevel;
}

// ==================== UPDATE ====================
export class UpdateVocabularyDto {
    word?: string;
    meaning?: string;
    categoryId?: string;
    pronunciation?: string;
    audioUrl?: string;
    partOfSpeech?: string;
    exampleEn?: string;
    exampleVi?: string;
    imageUrl?: string;
    synonyms?: string[];
    antonyms?: string[];
    difficulty?: DifficultyLevel;
    isActive?: boolean;
}

// ==================== QUERY ====================
export class QueryVocabularyDto {
    search?: string;
    categoryId?: string;
    difficulty?: DifficultyLevel;
    partOfSpeech?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
    sortBy?: 'word' | 'createdAt' | 'difficulty';
    sortOrder?: 'asc' | 'desc';
}

// ==================== RESPONSE ====================
export interface VocabularyResponse {
    id: string;
    word: string;
    pronunciation: string | null;
    audioUrl: string | null;
    meaning: string;
    partOfSpeech: string | null;
    exampleEn: string | null;
    exampleVi: string | null;
    imageUrl: string | null;
    synonyms: string[];
    antonyms: string[];
    difficulty: DifficultyLevel;
    categoryId: string;
    category?: {
        id: string;
        name: string;
        nameVi: string | null;
    };
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface PaginatedVocabularyResponse {
    data: VocabularyResponse[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

// ==================== BULK OPERATIONS ====================
export class BulkCreateVocabularyDto {
    vocabularies!: CreateVocabularyDto[];
}

export interface BulkCreateResult {
    created: number;
    failed: number;
    errors: Array<{
        word: string;
        error: string;
    }>;
}
