import { Controller, Get, Post, Put, Delete, Param, Query, Body, HttpCode, HttpStatus, ParseIntPipe } from '@nestjs/common';
import { TypedQuery } from '@nestia/core';
import { VocabularyService } from './vocabulary.service';
import {
    BodyCreateVocabulary,
    BodyUpdateVocabulary,
    QueryFindAllVocabulary,
    BodyGenerateVocabulary,
    BodyDeleteVocabularies,
} from './dto/vocabulary.dto';
import { CurrentUser } from '@/core';

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
    async getVocabularies(@CurrentUser('id') userId: string, @TypedQuery() query: QueryFindAllVocabulary) {
        return this.vocabularyService.getVocabularies(userId, query);
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

    @Delete()
    async deleteVocabularies(@Body() dto: BodyDeleteVocabularies) {
        return this.vocabularyService.deleteVocabularies(dto.ids);
    }
}
