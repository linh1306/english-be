import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Decorator to specify required roles for a route
 * Use with RolesGuard to restrict access based on Firebase custom claims
 *
 * @example
 * ```typescript
 * @Roles('admin')
 * @Get('admin/users')
 * getUsers() {
 *   return this.userService.findAll();
 * }
 * ```
 *
 * @example
 * // Multiple roles (OR logic - user needs at least one)
 * ```typescript
 * @Roles('admin', 'moderator')
 * @Delete('posts/:id')
 * deletePost(@Param('id') id: string) {
 *   return this.postService.delete(id);
 * }
 * ```
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
