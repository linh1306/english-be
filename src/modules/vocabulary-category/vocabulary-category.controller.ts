import { Controller, Get, Post, Put, Delete, Param, Query, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { TypedQuery } from '@nestia/core';
import { VocabularyCategoryService } from './vocabulary-category.service';
import {
    BodyCreateVocabularyCategory,
    BodyUpdateVocabularyCategory,
    QueryFindAllVocabularyCategory,
    ResVocabularyCategory,
    ResFindAllVocabularyCategory,
    ResCreateVocabularyCategory,
    ResUpdateVocabularyCategory,
    ResFindOneVocabularyCategory,
    ResRemoveVocabularyCategory,
    ResHardDeleteVocabularyCategory,
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
    async create(@Body() dto: BodyCreateVocabularyCategory): Promise<ResCreateVocabularyCategory> {
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
    async findOne(@Param('id') id: string): Promise<ResFindOneVocabularyCategory> {
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
    ): Promise<ResUpdateVocabularyCategory> {
        return this.vocabularyCategoryService.update(id, dto);
    }

    /**
     * Xóa danh mục (soft delete)
     * DELETE /vocabulary-categories/:id
     */
    @Delete(':id')
    async remove(@Param('id') id: string): Promise<ResRemoveVocabularyCategory> {
        return this.vocabularyCategoryService.remove(id);
    }

    /**
     * Xóa vĩnh viễn danh mục
     * DELETE /vocabulary-categories/:id/hard
     */
    @Delete(':id/hard')
    async hardDelete(@Param('id') id: string): Promise<ResHardDeleteVocabularyCategory> {
        return this.vocabularyCategoryService.hardDelete(id);
    }
}
