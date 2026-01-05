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
  ) {}

  /**
   * Tạo picture description mới
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createPictureDescription(@Body() dto: BodyCreatePictureDescription) {
    return this.pictureDescriptionService.createPictureDescription(dto);
  }

  /**
   * Lấy danh sách picture descriptions
   */
  @Get()
  async getPictureDescriptions(
    @TypedQuery() query: QueryGetPicturesDescription,
  ) {
    return this.pictureDescriptionService.getPictureDescriptions(query);
  }

  /**
   * Lấy chi tiết một picture description
   */
  @Get(':id')
  async getPictureDescription(@Param('id') id: string) {
    return this.pictureDescriptionService.getPictureDescription(id);
  }

  /**
   * Cập nhật picture description
   */
  @Put(':id')
  async updatePictureDescription(
    @Param('id') id: string,
    @Body() dto: BodyUpdatePictureDescription,
  ) {
    return this.pictureDescriptionService.updatePictureDescription(id, dto);
  }

  /**
   * Xóa nhiều picture descriptions
   */
  @Delete()
  async deletePictureDescriptions(@Body() dto: BodyDeletePictureDescriptions) {
    return this.pictureDescriptionService.deletePictureDescriptions(dto.ids);
  }

  /**
   * Generate picture descriptions bằng AI
   */
  @Post('generate')
  @HttpCode(HttpStatus.OK)
  async generatePictureDescription(
    @Body() dto: BodyGeneratePictureDescription,
  ) {
    return this.pictureDescriptionService.generatePictureDescription(dto);
  }

  /**
   * Submit câu trả lời và chấm điểm
   */
  @Post(':id/submit')
  @HttpCode(HttpStatus.OK)
  async submitPictureDescriptionAnswer(
    @CurrentUser('id') userId: string,
    @Param('id') pictureDescriptionId: string,
    @Body() dto: BodySubmitAnswer,
  ) {
    return this.pictureDescriptionService.submitPictureDescriptionAnswer(
      userId,
      pictureDescriptionId,
      dto,
    );
  }

  /**
   * Lấy lịch sử câu trả lời của user cho một picture description
   */
  @Get(':id/my-answers')
  async getMyPictureDescriptionAnswers(
    @CurrentUser('id') userId: string,
    @Param('id') pictureDescriptionId: string,
  ) {
    return this.pictureDescriptionService.getPictureDescriptionUserAnswers(
      userId,
      pictureDescriptionId,
    );
  }

  /**
   * Lấy tất cả câu trả lời của user
   */
  @Get('my-answers/all')
  async getAllMyPictureDescriptionAnswers(
    @CurrentUser('id') userId: string,
    @TypedQuery() query: { page?: number; limit?: number },
  ) {
    return this.pictureDescriptionService.getAllPictureDescriptionUserAnswers(
      userId,
      query.page,
      query.limit,
    );
  }
}
