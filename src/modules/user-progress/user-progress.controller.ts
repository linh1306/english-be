import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { TypedQuery } from '@nestia/core';
import { UserProgressService } from './user-progress.service';
import { BodyUpdateProgress, QueryDueReviews } from './dto/user-progress.dto';
import { FirebaseId } from '../../core/firebase/decorators/firebase-id.decorator';

@Controller('user-progress')
export class UserProgressController {
  constructor(private readonly userProgressService: UserProgressService) { }

  /**
   * Cập nhật tiến trình ôn tập từ vựng
   */
  @Post(':vocabularyId')
  @HttpCode(HttpStatus.OK)
  async updateProgress(
    @FirebaseId() userId: string,
    @Param('vocabularyId') vocabularyId: string,
    @Body() dto: BodyUpdateProgress,
  ) {
    return this.userProgressService.updateProgress(userId, vocabularyId, dto);
  }

  /**
   * Lấy danh sách từ vựng cần ôn tập hôm nay
   */
  @Get('due-reviews')
  async getDueReviews(
    @FirebaseId() userId: string,
    @TypedQuery() query: QueryDueReviews,
  ) {
    return this.userProgressService.getDueReviews(userId, query);
  }
}
