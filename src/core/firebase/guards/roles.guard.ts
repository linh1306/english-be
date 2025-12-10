import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FastifyRequest } from 'fastify';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PrismaService } from '../../database/prisma.service';
import { UserRole } from '../../../generated/prisma/enums';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly prisma: PrismaService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
            ROLES_KEY,
            [context.getHandler(), context.getClass()],
        );

        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }

        const request = context.switchToHttp().getRequest<FastifyRequest>();
        const user = (request as FastifyRequest & { user?: any }).user;

        if (!user || !user.id || !user.email) {
            throw new ForbiddenException('User not authenticated');
        }

        let dbUser = await this.prisma.user.findUnique({
            where: { id: user.id },
        });

        if (!dbUser) {
            dbUser = await this.prisma.user.findUnique({
                where: { email: user.email },
            });
        }

        if (!dbUser) {
            throw new ForbiddenException('User not found in system');
        }

        const hasRole = requiredRoles.includes(dbUser.role);

        if (!hasRole) {
            throw new ForbiddenException(
                `Access denied. Required roles: ${requiredRoles.join(', ')}`,
            );
        }

        return true;
    }
}
