import { Controller, Get, Post, Put, Delete, Param, Query, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { TypedQuery } from '@nestia/core';
import { VocabularyCategoryService } from './vocabulary-category.service';
import {
    BodyCreateVocabularyCategory,
    BodyUpdateVocabularyCategory,
    QueryFindAllVocabularyCategory,
    ResVocabularyCategory,
    ResFindAllVocabularyCategory,
} from './dto/vocabulary-category.dto';

@Controller('vocabulary-categories')
export class VocabularyCategoryController {
    constructor(private readonly vocabularyCategoryService: VocabularyCategoryService) { }

    /**
     * Tạo danh mục từ vựng mới
     * POST /vocabulary-categories
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() dto: BodyCreateVocabularyCategory): Promise<ResVocabularyCategory> {
        return this.vocabularyCategoryService.create(dto);
    }

    /**
     * Lấy danh sách danh mục với phân trang
     * GET /vocabulary-categories
     */
    @Get()
    async findAll(@TypedQuery() query: QueryFindAllVocabularyCategory): Promise<ResFindAllVocabularyCategory> {
        return this.vocabularyCategoryService.findAll(query);
    }

    /**
     * Lấy chi tiết một danh mục
     * GET /vocabulary-categories/:id
     */
    @Get(':id')
    async findOne(@Param('id') id: string): Promise<ResVocabularyCategory> {
        return this.vocabularyCategoryService.findOne(id);
    }

    /**
     * Cập nhật danh mục
     * PUT /vocabulary-categories/:id
     */
    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body() dto: BodyUpdateVocabularyCategory,
    ): Promise<ResVocabularyCategory> {
        return this.vocabularyCategoryService.update(id, dto);
    }

    /**
     * Xóa danh mục (soft delete)
     * DELETE /vocabulary-categories/:id
     */
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('id') id: string): Promise<void> {
        return this.vocabularyCategoryService.remove(id);
    }

    /**
     * Xóa vĩnh viễn danh mục
     * DELETE /vocabulary-categories/:id/hard
     */
    @Delete(':id/hard')
    @HttpCode(HttpStatus.NO_CONTENT)
    async hardDelete(@Param('id') id: string): Promise<void> {
        return this.vocabularyCategoryService.hardDelete(id);
    }
}
