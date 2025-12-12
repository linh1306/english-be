import { DifficultyLevel } from '../../../generated/prisma/enums';

// ==================== CREATE ====================
// ==================== CREATE ====================
export class BodyCreateVocabulary {
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
// ==================== UPDATE ====================
export class BodyUpdateVocabulary {
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
// ==================== QUERY ====================
export class QueryFindAllVocabulary {
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
// ==================== RESPONSE ====================
export interface ResVocabulary {
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

export interface ResFindAllVocabulary {
    data: ResVocabulary[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

// ==================== BULK OPERATIONS ====================
export class BodyBulkCreateVocabulary {
    vocabularies!: BodyCreateVocabulary[];
}

export interface ResBulkCreateVocabulary {
    created: number;
    failed: number;
    errors: Array<{
        word: string;
        error: string;
    }>;
}
