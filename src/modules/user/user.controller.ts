import {
    Controller,
    Get,
    Put,
    Param,
    Body,
} from '@nestjs/common';
import { TypedQuery } from '@nestia/core';
import { UserService } from './user.service';
import {
    QueryFindAllUser,
    ResFindAllUser,
    BodyUpdateUserStatus,
    ResFindOneUserPublic,
    ResUpdateUser,
} from './dto/user.dto';
import { Roles } from '../../core/firebase/decorators/roles.decorator';

@Controller('users')
export class UserController {
    constructor(private readonly userService: UserService) { }

    @Get()
    @Roles('ADMIN')
    async getUsers(@TypedQuery() query: QueryFindAllUser): Promise<ResFindAllUser> {
        return this.userService.getUsers(query);
    }

    @Get(':id')
    async getUser(@Param('id') id: string): Promise<ResFindOneUserPublic> {
        const user = await this.userService.getUser(id);
        // Manually map to public response
        return this.userService.mapToPublicResponse(user as any); // Type assertion if needed or just object
    }

    @Put(':id')
    @Roles('ADMIN')
    async updateUser(
        @Param('id') id: string,
        @Body() dto: BodyUpdateUserStatus,
    ): Promise<ResUpdateUser> {
        return this.userService.updateUser(id, dto);
    }
}
