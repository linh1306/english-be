import { Controller, Get, Put, Param, Body } from '@nestjs/common';
import { TypedQuery } from '@nestia/core';
import { UserService } from './user.service';
import { QueryFindAllUser, BodyUpdateUserStatus } from './dto/user.dto';
import { Roles } from '../../core/firebase/decorators/roles.decorator';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @Roles('ADMIN')
  async getUsers(@TypedQuery() query: QueryFindAllUser) {
    return this.userService.getUsers(query);
  }

  @Put(':id')
  @Roles('ADMIN')
  async updateUser(@Param('id') id: string, @Body() dto: BodyUpdateUserStatus) {
    return this.userService.updateUser(id, dto);
  }
}
