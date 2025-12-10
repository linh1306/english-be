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
import { User } from '../../../generated/prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
    constructor(
        private readonly firebaseService: FirebaseService,
        private readonly prismaService: PrismaService,
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

            if (!decodedToken.email) {
                throw new UnauthorizedException('Token does not contain email');
            }

            // Check if user exists in DB
            let user = await this.prismaService.user.findUnique({
                where: { email: decodedToken.email },
            });

            if (!user) {
                // Create user if not exists
                // Use default CUID or Firebase UID? 
                // Let's rely on default CUID for ID consistency with other tables if needed, 
                // OR use uid if we want strong link. 
                // Given "check firebase id", maybe linking is good. 
                // But schema has @default(cuid()). 
                // Let's create with default CUID to accept current Schema, 
                // but we might want to store firebase UID. 
                // Since schema doesn't have firebaseUid, we rely on email. 

                // Wait, if I change logic to user finding by email, 
                // I am technically checking if "email is valid".
                // The prompt says "check firebase id". 
                // If I rely ONLY on email, I might have issues if email changes.
                // But without schema change, email is the only unique key I have besides ID. 
                // If I create new user, I can set ID = UID? 
                // Cuid is a string format. UID is alphanumeric. It might fit.
                // Let's try setting ID = UID.

                try {
                    user = await this.prismaService.user.create({
                        data: {
                            // id: decodedToken.uid, // Optionally force ID to be UID. Let's try to match UID for easier debugging? 
                            // Actually, Prisma might complain if it doesn't look like CUID if verified? No, string is string.
                            // But let's stick to generating ID to avoid potential collision or format issues if any. 
                            // Actually, auto-generation is safer unless explicitly asked.
                            // But user said "check firebase id". 
                            // I will stick to query by email 
                            email: decodedToken.email,
                            name: decodedToken.name || decodedToken.email.split('@')[0],
                            avatar: decodedToken.picture,
                            password: crypto.randomUUID(), // Dummy password
                            isVerified: decodedToken.email_verified || false,
                            role: 'USER',
                        },
                    });
                } catch (e) {
                    // Hande race condition or unique constraint
                    // Retry find
                    user = await this.prismaService.user.findUnique({
                        where: { email: decodedToken.email },
                    });
                    if (!user) throw e;
                }
            }

            // Attach user info to request for later use
            // @ts-ignore
            request['user'] = user;

            return true;
        } catch (error) {
            console.error('Auth Error:', error);
            throw new UnauthorizedException(
                `Invalid or expired token: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }
}
