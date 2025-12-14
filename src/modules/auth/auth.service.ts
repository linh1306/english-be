import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';

@Injectable()
export class AuthService {
    constructor(private readonly prisma: PrismaService) { }

    async getProfile(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
                name: true,
                email: true,
                avatar: true,
                role: true,
                isActive: true,
                canRefreshToken: true,
            },
        });

        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }

        return user;
    }

    async revokeRefreshToken(id: string) {
        const user = await this.prisma.user.update({
            where: { id },
            data: { canRefreshToken: false },
        });

        return {
            message: "oke"
        };
    }
}
