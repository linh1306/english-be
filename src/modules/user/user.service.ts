import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import {
  BodyCreateUser,
  BodyUpdateUser,
  QueryFindAllUser,
} from './dto/user.dto';
import { Prisma } from '../../generated/prisma/client';
import { UserSelect } from '@/generated/prisma/models';
import { parseQuery } from '@/core';

const selectUser: UserSelect = {
  id: true,
  name: true,
  email: true,
  avatar: true,
  role: true,
  isActive: true,
  canRefreshToken: true,
  createdAt: true,
};

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async getUsers(query: QueryFindAllUser) {
    const { search, role, isActive, page = 1, limit = 10, orderBy } = query;

    const options = parseQuery(query);

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
        ...options,
        select: selectUser,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateUser(id: string, dto: BodyUpdateUser) {
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: dto,
    });

    return updatedUser;
  }
}
