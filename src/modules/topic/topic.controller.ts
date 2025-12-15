import { Controller, Get, Post, Put, Delete, Param, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { TypedQuery } from '@nestia/core';
import { TopicService } from './topic.service';
import {
    BodyCreateTopic,
    BodyUpdateTopic,
    QueryFindAllTopic,
} from './dto/topic.dto';

@Controller('topics')
export class TopicController {
    constructor(private readonly topicService: TopicService) { }

    /**
     * Tạo danh mục từ vựng mới
     * POST /topics
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async createTopic(@Body() dto: BodyCreateTopic) {
        return this.topicService.createTopic(dto);
    }

    /**
     * Lấy danh sách danh mục với phân trang
     * GET /topics
     */
    @Get()
    async getTopics(@TypedQuery() query: QueryFindAllTopic) {
        return this.topicService.getTopics(query);
    }

    /**
     * Lấy chi tiết một danh mục
     * GET /topics/:id
     */
    @Get(':id')
    async getTopic(@Param('id') id: string) {
        return this.topicService.getTopic(id);
    }

    /**
     * Cập nhật danh mục
     * PUT /topics/:id
     */
    @Put(':id')
    async updateTopic(
        @Param('id') id: string,
        @Body() dto: BodyUpdateTopic,
    ) {
        return this.topicService.updateTopic(id, dto);
    }

    /**
     * Xóa danh mục (soft delete)
     * DELETE /topics/:id
     */
    @Delete(':id')
    async deleteTopic(@Param('id') id: string) {
        return this.topicService.deleteTopic(id);
    }

    /**
     * Xóa vĩnh viễn danh mục
     * DELETE /topics/:id/hard
     */
    @Delete(':id/hard')
    async hardDeleteTopic(@Param('id') id: string) {
        return this.topicService.hardDeleteTopic(id);
    }
}
