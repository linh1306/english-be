import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';

@Injectable()
export class AuthService {
    constructor(private readonly prisma: PrismaService) { }

    async getProfile(id: string) {
        return this.prisma.user.findUnique({
            where: { id },
        });
    }

    async revokeRefreshToken(id: string) {
        return this.prisma.user.update({
            where: { id },
            data: { canRefreshToken: false },
        });
    }
}
