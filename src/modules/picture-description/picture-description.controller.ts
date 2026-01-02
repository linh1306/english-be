import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Param,
    Body,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { TypedQuery } from '@nestia/core';
import { PictureDescriptionService } from './picture-description.service';
import {
    BodyCreatePictureDescription,
    BodyUpdatePictureDescription,
    QueryGetPicturesDescription,
    BodyGeneratePictureDescription,
    BodySubmitAnswer,
    BodyDeletePictureDescriptions,
} from './dto/picture-description.dto';
import { CurrentUser } from '@/core';

@Controller('picture-descriptions')
export class PictureDescriptionController {
    constructor(
        private readonly pictureDescriptionService: PictureDescriptionService,
    ) { }

    /**
     * Tạo picture description mới
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() dto: BodyCreatePictureDescription) {
        return this.pictureDescriptionService.create(dto);
    }

    /**
     * Lấy danh sách picture descriptions
     */
    @Get()
    async findAll(@TypedQuery() query: QueryGetPicturesDescription) {
        return this.pictureDescriptionService.findAll(query);
    }

    /**
     * Lấy chi tiết một picture description
     */
    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.pictureDescriptionService.findOne(id);
    }

    /**
     * Cập nhật picture description
     */
    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body() dto: BodyUpdatePictureDescription,
    ) {
        return this.pictureDescriptionService.update(id, dto);
    }

    /**
     * Xóa nhiều picture descriptions
     */
    @Delete()
    async delete(@Body() dto: BodyDeletePictureDescriptions) {
        return this.pictureDescriptionService.delete(dto.ids);
    }

    /**
     * Generate picture descriptions bằng AI
     */
    @Post('generate')
    @HttpCode(HttpStatus.OK)
    async generate(@Body() dto: BodyGeneratePictureDescription) {
        return this.pictureDescriptionService.generate(dto);
    }

    /**
     * Submit câu trả lời và chấm điểm
     */
    @Post(':id/submit')
    @HttpCode(HttpStatus.OK)
    async submitAnswer(
        @CurrentUser('id') userId: string,
        @Param('id') pictureDescriptionId: string,
        @Body() dto: BodySubmitAnswer,
    ) {
        return this.pictureDescriptionService.submitAnswer(
            userId,
            pictureDescriptionId,
            dto,
        );
    }

    /**
     * Lấy lịch sử câu trả lời của user cho một picture description
     */
    @Get(':id/my-answers')
    async getMyAnswers(
        @CurrentUser('id') userId: string,
        @Param('id') pictureDescriptionId: string,
    ) {
        return this.pictureDescriptionService.getUserAnswers(
            userId,
            pictureDescriptionId,
        );
    }

    /**
     * Lấy tất cả câu trả lời của user
     */
    @Get('my-answers/all')
    async getAllMyAnswers(
        @CurrentUser('id') userId: string,
        @TypedQuery() query: { page?: number; limit?: number },
    ) {
        return this.pictureDescriptionService.getAllUserAnswers(
            userId,
            query.page,
            query.limit,
        );
    }
}
