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
    ResGetRandomByCategory,
    ResRemoveVocabulary,
    ResHardDeleteVocabulary,
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
    async create(@Body() dto: BodyCreateVocabulary): Promise<ResCreateVocabulary> {
        return this.vocabularyService.create(dto);
    }

    /**
     * Tạo nhiều từ vựng cùng lúc
     * POST /vocabularies/bulk
     */
    @Post('bulk')
    @HttpCode(HttpStatus.CREATED)
    async bulkCreate(@Body() dto: BodyBulkCreateVocabulary): Promise<ResBulkCreateVocabulary> {
        return this.vocabularyService.bulkCreate(dto);
    }

    /**
     * Lấy danh sách từ vựng với phân trang
     * GET /vocabularies
     */
    @Get()
    async findAll(@TypedQuery() query: QueryFindAllVocabulary): Promise<ResFindAllVocabulary> {
        return this.vocabularyService.findAll(query);
    }

    /**
     * Lấy từ vựng ngẫu nhiên theo category
     * GET /vocabularies/random/:categoryId
     */
    @Get('random/:categoryId')
    async getRandomByCategory(
        @Param('categoryId') categoryId: string,
        @Query('count', new ParseIntPipe({ optional: true })) count?: number,
    ): Promise<ResGetRandomByCategory> {
        return this.vocabularyService.getRandomByCategory(categoryId, count ?? 10);
    }

    /**
     * Lấy chi tiết một từ vựng
     * GET /vocabularies/:id
     */
    @Get(':id')
    async findOne(@Param('id') id: string): Promise<ResFindOneVocabulary> {
        return this.vocabularyService.findOne(id);
    }

    /**
     * Cập nhật từ vựng
     * PUT /vocabularies/:id
     */
    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body() dto: BodyUpdateVocabulary,
    ): Promise<ResUpdateVocabulary> {
        return this.vocabularyService.update(id, dto);
    }

    /**
     * Xóa từ vựng (soft delete)
     * DELETE /vocabularies/:id
     */
    @Delete(':id')
    async remove(@Param('id') id: string): Promise<ResRemoveVocabulary> {
        return this.vocabularyService.remove(id);
    }

    /**
     * Xóa vĩnh viễn từ vựng
     * DELETE /vocabularies/:id/hard
     */
    @Delete(':id/hard')
    async hardDelete(@Param('id') id: string): Promise<ResHardDeleteVocabulary> {
        return this.vocabularyService.hardDelete(id);
    }
}
