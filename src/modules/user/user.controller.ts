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
    ResUser,
    ResFindAllUser,
    BodyUpdateUserStatus,
    ResFindOneUserPublic,
} from './dto/user.dto';
import { Roles } from '../../core/firebase/decorators/roles.decorator';

@Controller('users')
export class UserController {
    constructor(private readonly userService: UserService) { }

    @Get()
    @Roles('ADMIN')
    async findAll(@TypedQuery() query: QueryFindAllUser): Promise<ResFindAllUser> {
        return this.userService.findAll(query);
    }

    @Get(':id')
    async findOne(@Param('id') id: string): Promise<ResFindOneUserPublic> {
        const user = await this.userService.findOne(id);
        // Manually map to public response
        return this.userService.mapToPublicResponse(user as any); // Type assertion if needed or just object
    }

    @Put(':id')
    @Roles('ADMIN')
    async update(
        @Param('id') id: string,
        @Body() dto: BodyUpdateUserStatus,
    ): Promise<ResUser> {
        return this.userService.update(id, dto);
    }
}
