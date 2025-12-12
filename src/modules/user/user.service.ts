import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import {
    BodyCreateUser,
    BodyUpdateUser,
    QueryFindAllUser,
    ResUser,
    ResFindAllUser,
    ResFindOneUserPublic,
    ResCreateUser,
    ResUpdateUser,
    ResFindOneUser,
    ResRemoveUser,
    ResFindByEmailUser,
} from './dto/user.dto';
import { User, Prisma } from '../../generated/prisma/client';

@Injectable()
export class UserService {
    constructor(private readonly prisma: PrismaService) { }

    async create(dto: BodyCreateUser): Promise<ResCreateUser> {
        const user = await this.prisma.user.create({
            data: {
                ...dto,
                role: dto.role ?? 'USER',
            },
        });
        return this.mapToResponse(user);
    }

    async findAll(query: QueryFindAllUser): Promise<ResFindAllUser> {
        const {
            search,
            role,
            isActive,
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = 'desc',
        } = query;

        const where: Prisma.UserWhereInput = {
            AND: [
                search
                    ? {
                        OR: [
                            { name: { contains: search, mode: 'insensitive' } },
                            { email: { contains: search, mode: 'insensitive' } },
                        ],
                    }
                    : {},
                role ? { role } : {},
                isActive !== undefined ? { isActive } : {},
            ],
        };

        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
            }),
            this.prisma.user.count({ where }),
        ]);

        return {
            data: users.map(this.mapToResponse),
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findOne(id: string): Promise<ResFindOneUser> {
        const user = await this.prisma.user.findUnique({
            where: { id },
        });

        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }

        return this.mapToResponse(user);
    }

    async update(id: string, dto: BodyUpdateUser): Promise<ResUpdateUser> {
        await this.findOne(id); // Ensure exists

        const updatedUser = await this.prisma.user.update({
            where: { id },
            data: dto,
        });

        return this.mapToResponse(updatedUser);
    }

    async remove(id: string): Promise<ResRemoveUser> {
        await this.findOne(id); // Ensure exists

        const deletedUser = await this.prisma.user.delete({
            where: { id },
        });

        return this.mapToResponse(deletedUser);
    }

    private mapToResponse(user: User): ResUser {
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            role: user.role,
            isActive: user.isActive,
            canRefreshToken: user.canRefreshToken,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }

    mapToPublicResponse(user: User): ResFindOneUserPublic {
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
        };
    }

    async findByEmail(email: string): Promise<ResFindByEmailUser | null> {
        return this.prisma.user.findUnique({
            where: { email },
        });
    }
}
