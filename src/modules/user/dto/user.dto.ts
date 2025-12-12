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
    canRefreshToken: boolean;
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

export interface UserPublicResponse {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
}

export class UpdateUserStatusDto {
    isActive?: boolean;
    role?: UserRole;
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
