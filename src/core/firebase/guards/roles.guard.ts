import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FastifyRequest } from 'fastify';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { FirebaseUser } from '../decorators/current-user.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<string[]>(
            ROLES_KEY,
            [context.getHandler(), context.getClass()],
        );

        // If no roles are required, allow access
        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }

        const request = context.switchToHttp().getRequest<FastifyRequest>();
        const user = (request as FastifyRequest & { user?: FirebaseUser }).user;

        if (!user) {
            throw new ForbiddenException('User not authenticated');
        }

        // Check if user has any of the required roles in their custom claims
        const userRoles = (user as FirebaseUser & { role?: string }).role;
        const hasRole = requiredRoles.some((role) => {
            // Check in custom claims
            if (userRoles === role) {
                return true;
            }
            // Also check if role exists as a custom claim key with truthy value
            if ((user as Record<string, unknown>)[role]) {
                return true;
            }
            return false;
        });

        if (!hasRole) {
            throw new ForbiddenException(
                `Access denied. Required roles: ${requiredRoles.join(', ')}`,
            );
        }

        return true;
    }
}
