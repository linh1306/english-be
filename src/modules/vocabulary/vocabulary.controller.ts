import { Controller, Get, Post, Put, Delete, Param, Query, Body, HttpCode, HttpStatus, ParseIntPipe } from '@nestjs/common';
import { TypedQuery } from '@nestia/core';
import { VocabularyService } from './vocabulary.service';
import {
    BodyCreateVocabulary,
    BodyUpdateVocabulary,
    QueryFindAllVocabulary,
    ResVocabulary,
    ResFindAllVocabulary,
    BodyBulkCreateVocabulary,
    ResBulkCreateVocabulary,
    ResCreateVocabulary,
    ResUpdateVocabulary,
    ResFindOneVocabulary,
    ResGetRandomByTopic,
    ResRemoveVocabulary,
    ResHardDeleteVocabulary,
    BodyGenerateVocabulary,
    ResGenerateVocabulary,
} from './dto/vocabulary.dto';

@Controller('vocabularies')
export class VocabularyController {
    constructor(private readonly vocabularyService: VocabularyService) { }

    /**
     * Tạo từ vựng mới
     * POST /vocabularies
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async createVocabulary(@Body() dto: BodyCreateVocabulary): Promise<ResCreateVocabulary> {
        return this.vocabularyService.createVocabulary(dto);
    }

    /**
     * Tạo nhiều từ vựng cùng lúc
     * POST /vocabularies/bulk
     */
    @Post('bulk')
    @HttpCode(HttpStatus.CREATED)
    async bulkCreateVocabularies(@Body() dto: BodyBulkCreateVocabulary): Promise<ResBulkCreateVocabulary> {
        return this.vocabularyService.bulkCreateVocabularies(dto);
    }

    /**
     * Generate vocabularies using AI
     * POST /vocabularies/generate/:topicId
     */
    @Post('generate/:topicId')
    @HttpCode(HttpStatus.OK)
    async generateVocabularies(@Param('topicId') topicId: string, @Body() dto: BodyGenerateVocabulary): Promise<ResGenerateVocabulary> {
        return this.vocabularyService.generateVocabularies(topicId, dto);
    }

    /**
     * Lấy danh sách từ vựng với phân trang
     * GET /vocabularies
     */
    @Get()
    async getVocabularies(@TypedQuery() query: QueryFindAllVocabulary): Promise<ResFindAllVocabulary> {
        return this.vocabularyService.getVocabularies(query);
    }

    /**
     * Lấy từ vựng ngẫu nhiên theo topic
     * GET /vocabularies/random/:topicId
     */
    @Get('random/:topicId')
    async getRandomVocabulariesByTopic(
        @Param('topicId') topicId: string,
        @Query('count', new ParseIntPipe({ optional: true })) count?: number,
    ): Promise<ResGetRandomByTopic> {
        return this.vocabularyService.getRandomVocabulariesByTopic(topicId, count ?? 10);
    }

    /**
     * Lấy chi tiết một từ vựng
     * GET /vocabularies/:id
     */
    @Get(':id')
    async getVocabulary(@Param('id') id: string): Promise<ResFindOneVocabulary> {
        return this.vocabularyService.getVocabulary(id);
    }

    /**
     * Cập nhật từ vựng
     * PUT /vocabularies/:id
     */
    @Put(':id')
    async updateVocabulary(
        @Param('id') id: string,
        @Body() dto: BodyUpdateVocabulary,
    ): Promise<ResUpdateVocabulary> {
        return this.vocabularyService.updateVocabulary(id, dto);
    }

    /**
     * Xóa từ vựng (soft delete)
     * DELETE /vocabularies/:id
     */
    @Delete(':id')
    async deleteVocabulary(@Param('id') id: string): Promise<ResRemoveVocabulary> {
        return this.vocabularyService.deleteVocabulary(id);
    }

    /**
     * Xóa vĩnh viễn từ vựng
     * DELETE /vocabularies/:id/hard
     */
    @Delete(':id/hard')
    async hardDeleteVocabulary(@Param('id') id: string): Promise<ResHardDeleteVocabulary> {
        return this.vocabularyService.hardDeleteVocabulary(id);
    }
}
