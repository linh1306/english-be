import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { FirebaseUser } from './current-user.decorator';

export const FirebaseId = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): string | undefined => {
        const request = ctx.switchToHttp().getRequest<FastifyRequest>();
        const user = (request as FastifyRequest & { user?: FirebaseUser }).user;
        return user?.uid;
    },
);
