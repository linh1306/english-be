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

        let token = this.extractTokenFromHeader(request);

        // If no bearer token, check cookie
        if (!token && request.cookies && request.cookies['token']) {
            token = request.cookies['token'];
        }

        if (!token) {
            throw new UnauthorizedException('No authorization token provided');
        }

        try {
            const decodedToken = await this.firebaseService.verifyIdToken(token);

            if (!decodedToken.email) {
                throw new UnauthorizedException('Token does not contain email');
            }

            // Attach user info to request for later use
            // We map uid to id to maintain compatibility with minimal user interface
            // @ts-ignore
            request['user'] = {
                id: decodedToken.uid,
                email: decodedToken.email,
                name: decodedToken.name || decodedToken.email.split('@')[0],
                avatar: decodedToken.picture || null,
                isVerified: decodedToken.email_verified || false,
                role: 'USER', // Default role assumption since we don't query DB
                ...decodedToken
            };

            return true;
        } catch (error) {
            console.error('Auth Error:', error);
            throw new UnauthorizedException(
                `Invalid or expired token: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }

    private extractTokenFromHeader(request: FastifyRequest): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }
}
