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
    QueryUserDto,
    UserResponse,
    PaginatedUserResponse,
    UpdateUserStatusDto,
    UserPublicResponse,
} from './dto/user.dto';
import { Roles } from '../../core/firebase/decorators/roles.decorator';

@Controller('users')
export class UserController {
    constructor(private readonly userService: UserService) { }

    @Get()
    @Roles('ADMIN')
    async findAll(@TypedQuery() query: QueryUserDto): Promise<PaginatedUserResponse> {
        return this.userService.findAll(query);
    }

    @Get(':id')
    async findOne(@Param('id') id: string): Promise<UserPublicResponse> {
        const user = await this.userService.findOne(id);
        // Manually map to public response
        return this.userService.mapToPublicResponse(user as any); // Type assertion if needed or just object
    }

    @Put(':id')
    @Roles('ADMIN')
    async update(
        @Param('id') id: string,
        @Body() dto: UpdateUserStatusDto,
    ): Promise<UserResponse> {
        return this.userService.update(id, dto);
    }
}
