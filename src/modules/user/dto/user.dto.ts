import { UserRole } from '../../../generated/prisma/enums';

// ==================== CREATE ====================
// Often users are created via Auth, but admin might create users
export class CreateUserDto {
    name!: string;
    email!: string;
    password!: string; // Only if we manage password locally
    role?: UserRole;
    avatar?: string;
    isVerified?: boolean;
}

// ==================== UPDATE ====================
export class UpdateUserDto {
    name?: string;
    avatar?: string;
    isActive?: boolean;
    role?: UserRole; // Typically admin only
}

// ==================== RESPONSE ====================
export interface UserResponse {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    role: UserRole;
    isActive: boolean;
    isVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface PaginatedUserResponse {
    data: UserResponse[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

// ==================== QUERY ====================
export class QueryUserDto {
    search?: string;
    role?: UserRole;
    isActive?: boolean;
    page?: number;
    limit?: number;
    sortBy?: 'name' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
}
