import { Controller, Get, Post, Put, Delete, Param, Query, Body, HttpCode, HttpStatus, ParseIntPipe } from '@nestjs/common';
import { TypedQuery } from '@nestia/core';
import { VocabularyService } from './vocabulary.service';
import {
    BodyCreateVocabulary,
    BodyUpdateVocabulary,
    QueryFindAllVocabulary,
    BodyGenerateVocabulary,
} from './dto/vocabulary.dto';

@Controller('vocabularies')
export class VocabularyController {
    constructor(private readonly vocabularyService: VocabularyService) { }

    /**
     * Tạo từ vựng mới
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async createVocabulary(@Body() dto: BodyCreateVocabulary) {
        return this.vocabularyService.createVocabulary(dto);
    }

    /**
     * Generate vocabularies using AI
     */
    @Post('generate/:topicId')
    @HttpCode(HttpStatus.OK)
    async generateVocabularies(@Param('topicId') topicId: string, @Body() dto: BodyGenerateVocabulary) {
        return this.vocabularyService.generateVocabularies(topicId, dto);
    }

    /**
     * Lấy danh sách từ vựng với phân trang
     */
    @Get()
    async getVocabularies(@TypedQuery() query: QueryFindAllVocabulary) {
        return this.vocabularyService.getVocabularies(query);
    }

    /**
     * Cập nhật từ vựng
     * PUT /vocabularies/:id
     */
    @Put(':id')
    async updateVocabulary(
        @Param('id') id: string,
        @Body() dto: BodyUpdateVocabulary,
    ) {
        return this.vocabularyService.updateVocabulary(id, dto);
    }

    /**
     * Xóa vĩnh viễn từ vựng
     */
    @Delete(':id/hard')
    async hardDeleteVocabulary(@Param('id') id: string) {
        return this.vocabularyService.hardDeleteVocabulary(id);
    }
}
