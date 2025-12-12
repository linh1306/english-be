import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { ResGetProfile, ResRevokeRefreshToken } from './dto';
import { User } from '../../generated/prisma/client';

@Injectable()
export class AuthService {
    constructor(private readonly prisma: PrismaService) { }

    async getProfile(id: string): Promise<ResGetProfile> {
        const user = await this.prisma.user.findUnique({
            where: { id },
        });

        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }

        return user;
    }

    async revokeRefreshToken(id: string): Promise<ResRevokeRefreshToken> {
        const user = await this.prisma.user.update({
            where: { id },
            data: { canRefreshToken: false },
        });

        return user;
    }
}
