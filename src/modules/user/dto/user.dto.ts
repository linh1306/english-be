import { User } from '../../../generated/prisma/client';
import { Body, BodyPartial, Query } from '../../../core/types';

export type BodyCreateUser = Body<User, 'name' | 'email' | 'avatar' | 'role' | 'isActive'>;

export type BodyUpdateUser = BodyPartial<User, 'isActive' | 'role'>;
export type BodyUpdateUserStatus = BodyPartial<User, 'isActive' | 'role'>;

export type QueryFindAllUser = Query<User, 'role' | 'isActive', 'name' | 'createdAt'>;
