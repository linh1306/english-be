import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { FastifyRequest } from 'fastify';

/**
 * Type for Firebase decoded token user
 */
export type FirebaseUser = admin.auth.DecodedIdToken;

/**
 * Decorator to get the current authenticated user from the request
 * The user is set by FirebaseAuthGuard after token verification
 *
 * @example
 * ```typescript
 * @Get('profile')
 * getProfile(@CurrentUser() user: FirebaseUser) {
 *   return { uid: user.uid, email: user.email };
 * }
 * ```
 *
 * @example
 * // Get specific property
 * ```typescript
 * @Get('my-id')
 * getMyId(@CurrentUser('uid') uid: string) {
 *   return { uid };
 * }
 * ```
 */
export const CurrentUser = createParamDecorator(
  (
    data: keyof FirebaseUser | undefined,
    ctx: ExecutionContext,
  ): FirebaseUser | unknown => {
    const request = ctx.switchToHttp().getRequest<FastifyRequest>();
    const user = (request as FastifyRequest & { user?: FirebaseUser }).user;

    if (!user) {
      return null;
    }

    return data ? user[data] : user;
  },
);
