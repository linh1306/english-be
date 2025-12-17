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
import { PrismaService } from '../../database/prisma.service';
import { UserRole } from '../../../generated/prisma/client';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
    constructor(
        private readonly firebaseService: FirebaseService,
        private readonly reflector: Reflector,
        private readonly prismaService: PrismaService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
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
        const cookies = (request as any).cookies;
        if (!token && cookies && cookies['token']) {
            token = cookies['token'];
        }

        if (!token) {
            throw new UnauthorizedException('No authorization token provided');
        }

        try {
            const decodedToken = await this.firebaseService.verifyIdToken(token);

            // console.log('Decoded token:', decodedToken);
            if (!decodedToken.email) {
                throw new UnauthorizedException('Token does not contain email');
            }

            if (!decodedToken.role) {

                try {
                    await this.prismaService.user.create({
                        data: {
                            id: decodedToken.uid,
                            email: decodedToken.email,
                            name: decodedToken.name || decodedToken.email.split('@')[0],
                            avatar: decodedToken.picture || null,
                            role: UserRole.USER,
                            canRefreshToken: true,
                        },
                    });
                } catch (error) {

                    if ((error as any).code !== 'P2002') {
                        console.error('Auto-create user failed:', error);
                    }
                }

                await this.firebaseService.setCustomClaims(decodedToken.uid, {
                    role: 'USER',
                });

                decodedToken.role = 'USER';
            }

            request['user'] = {
                id: decodedToken.uid,
                email: decodedToken.email,
                name: decodedToken.name || decodedToken.email.split('@')[0],
                avatar: decodedToken.picture || null,
                isVerified: decodedToken.email_verified || false,
                role: decodedToken.role || 'USER',
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
