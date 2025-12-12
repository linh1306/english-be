import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Param,
    Query,
    Body,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { TypedQuery } from '@nestia/core';
import { UserService } from './user.service';
import {
    CreateUserDto,
    UpdateUserDto,
    QueryUserDto,
    UserResponse,
    PaginatedUserResponse,
} from './dto/user.dto';

@Controller('users')
export class UserController {
    constructor(private readonly userService: UserService) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() dto: CreateUserDto): Promise<UserResponse> {
        return this.userService.create(dto);
    }

    @Get()
    async findAll(@TypedQuery() query: QueryUserDto): Promise<PaginatedUserResponse> {
        return this.userService.findAll(query);
    }

    @Get(':id')
    async findOne(@Param('id') id: string): Promise<UserResponse> {
        return this.userService.findOne(id);
    }

    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body() dto: UpdateUserDto,
    ): Promise<UserResponse> {
        return this.userService.update(id, dto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('id') id: string): Promise<void> {
        return this.userService.remove(id);
    }
}
