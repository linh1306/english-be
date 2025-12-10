import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FastifyRequest } from 'fastify';
import { FirebaseService } from '../firebase.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
    constructor(
        private readonly firebaseService: FirebaseService,
        private readonly reflector: Reflector,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        // Check if route is marked as public
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (isPublic) {
            return true;
        }

        const request = context.switchToHttp().getRequest<FastifyRequest>();
        const authHeader = request.headers.authorization;

        if (!authHeader) {
            throw new UnauthorizedException('No authorization header provided');
        }

        const [type, token] = authHeader.split(' ');

        if (type !== 'Bearer' || !token) {
            throw new UnauthorizedException('Invalid authorization header format');
        }

        try {
            const decodedToken = await this.firebaseService.verifyIdToken(token);

            // Attach user info to request for later use
            (request as FastifyRequest & { user: typeof decodedToken }).user =
                decodedToken;

            return true;
        } catch (error) {
            throw new UnauthorizedException(
                `Invalid or expired token: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }
}
