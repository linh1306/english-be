import { Controller, Get, Post, Put, Patch, Delete, Param, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { TypedQuery } from '@nestia/core';
import { TopicService } from './topic.service';
import {
    BodyCreateTopic,
    BodyUpdateTopic,
    QueryFindAllTopic,
    BodyDeleteTopics,
    BodyUpdateTopics,
} from './dto/topic.dto';
import { CurrentUser, Roles } from '@/core';
import { UserRole } from '@/generated/prisma/enums';

@Controller('topics')
export class TopicController {
    constructor(private readonly topicService: TopicService) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async createTopic(@Body() dto: BodyCreateTopic) {
        return this.topicService.createTopic(dto);
    }

    @Get()
    async getTopics(
        @TypedQuery() query: QueryFindAllTopic,
        @CurrentUser('role') role: UserRole,
    ) {
        return this.topicService.getTopics(query, role);
    }

    @Patch()
    @Roles(UserRole.ADMIN)
    async updateTopics(@Body() dto: BodyUpdateTopics) {
        return this.topicService.updateTopics(dto.ids, dto.isActive);
    }

    @Get(':id')
    async getTopic(@Param('id') id: string) {
        return this.topicService.getTopic(id);
    }

    @Put(':id')
    async updateTopic(
        @Param('id') id: string,
        @Body() dto: BodyUpdateTopic,
    ) {
        return this.topicService.updateTopic(id, dto);
    }

    @Delete()
    async deleteTopics(@Body() dto: BodyDeleteTopics) {
        return this.topicService.deleteTopics(dto.ids);
    }
}
