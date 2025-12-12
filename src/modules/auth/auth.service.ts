import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { ResGetProfile, ResRevokeRefreshToken } from './dto';

@Injectable()
export class AuthService {
    constructor(private readonly prisma: PrismaService) { }

    async getProfile(id: string): Promise<ResGetProfile | null> {
        return this.prisma.user.findUnique({
            where: { id },
        });
    }

    async revokeRefreshToken(id: string): Promise<ResRevokeRefreshToken> {
        return this.prisma.user.update({
            where: { id },
            data: { canRefreshToken: false },
        });
    }
}
