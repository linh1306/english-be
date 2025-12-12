import { UserRole } from '../../../generated/prisma/enums';
import { User } from '../../../generated/prisma/client';

// ==================== CREATE ====================
// Often users are created via Auth, but admin might create users
// ==================== CREATE ====================
// Often users are created via Auth, but admin might create users
export class BodyCreateUser {
    name!: string;
    email!: string;
    password!: string; // Only if we manage password locally
    role?: UserRole;
    avatar?: string;
    isVerified?: boolean;
}

// ==================== UPDATE ====================
export class BodyUpdateUser {
    isActive?: boolean;
    role?: UserRole; // Typically admin only
}

// ==================== RESPONSE ====================
export interface ResUser {
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

export interface ResFindAllUser {
    data: ResUser[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface ResFindOneUserPublic {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
}

export class BodyUpdateUserStatus {
    isActive?: boolean;
    role?: UserRole;
}

// ==================== QUERY ====================
export class QueryFindAllUser {
    search?: string;
    role?: UserRole;
    isActive?: boolean;
    page?: number;
    limit?: number;
    sortBy?: 'name' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
}

export type ResCreateUser = ResUser;
export type ResUpdateUser = ResUser;
export type ResFindOneUser = ResUser;
export type ResFindByEmailUser = User;
export type ResRemoveUser = ResUser; // Returning the deleted user
