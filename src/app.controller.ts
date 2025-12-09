import { Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { TypedBody } from '@nestia/core';

interface ICreateUser {
  /**
   * User name
   * @minLength 3
   */
  name: string;

  /**
   * User age
   * @type int
   * @minimum 18
   */
  age: number;

  /**
   * User email
   * @format email
   */
  email: string;
}

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('users')
  createUser(@TypedBody() body: ICreateUser): ICreateUser {
    return body;
  }
}
