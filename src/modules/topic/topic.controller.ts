import { Controller, Get, Post, Put, Delete, Param, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { TypedQuery } from '@nestia/core';
import { TopicService } from './topic.service';
import {
    BodyCreateTopic,
    BodyUpdateTopic,
    QueryFindAllTopic,
} from './dto/topic.dto';
import { Roles } from '@/core';
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
    async getTopics(@TypedQuery() query: QueryFindAllTopic) {
        return this.topicService.getTopics(query);
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

    @Delete(':id')
    async deleteTopic(@Param('id') id: string) {
        return this.topicService.deleteTopic(id);
    }
}
