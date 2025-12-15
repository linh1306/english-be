import { Controller, Get, Post, Param, Query, Body, HttpCode, HttpStatus, UseGuards, ParseIntPipe } from '@nestjs/common';
import { TypedQuery } from '@nestia/core';
import { UserProgressService } from './user-progress.service';
import {
    BodyReviewAnswer,
    QueryFindAllUserProgress,
    BodyStartStudySession,
    BodySubmitStudyResult,
} from './dto/user-progress.dto';
import { FirebaseAuthGuard } from '../../core/firebase/guards/firebase-auth.guard';
import { RolesGuard } from '../../core/firebase/guards/roles.guard';
import { FirebaseId } from '../../core/firebase/decorators/firebase-id.decorator';
import { Roles } from '../../core/firebase/decorators/roles.decorator';
import { UserRole } from '../../generated/prisma/enums';

@UseGuards(FirebaseAuthGuard, RolesGuard)
@Roles(UserRole.USER)
@Controller('user-progress')
export class UserProgressController {
    constructor(private readonly userProgressService: UserProgressService) { }

    /**
     * Lấy thống kê học tập của user
     */
    @Get('statistics')
    async getUserStatistics(@FirebaseId() userId: string) {
        return this.userProgressService.getUserStatistics(userId);
    }

    /**
     * Lấy các từ cần ôn tập hôm nay
     */
    @Get('due-review')
    async getDueForReview(
        @FirebaseId() userId: string,
        @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    ) {
        return this.userProgressService.getDueForReview(userId, limit ?? 20);
    }

    /**
     * Lấy tiến trình theo topic
     */
    @Get('topics')
    async getUserTopicProgress(@FirebaseId() userId: string) {
        return this.userProgressService.getUserTopicProgress(userId);
    }

    /**
     * Bắt đầu phiên học mới
     */
    @Post('study-session')
    @HttpCode(HttpStatus.OK)
    async startStudySession(
        @FirebaseId() userId: string,
        @Body() dto: BodyStartStudySession,
    ) {
        return this.userProgressService.startStudySession(userId, dto);
    }

    /**
     * Submit kết quả học tập
     */
    @Post('submit-result')
    @HttpCode(HttpStatus.OK)
    async submitStudyResult(
        @FirebaseId() userId: string,
        @Body() dto: BodySubmitStudyResult,
    ) {
        return this.userProgressService.submitStudyResult(userId, dto);
    }

    /**
     * Ghi nhận kết quả ôn tập một từ
     */
    @Post('review')
    @HttpCode(HttpStatus.OK)
    async recordReview(
        @FirebaseId() userId: string,
        @Body() dto: BodyReviewAnswer,
    ) {
        return this.userProgressService.recordReview(userId, dto);
    }

    /**
     * Lấy danh sách tiến trình của user
     */
    @Get()
    async getUserProgresses(
        @FirebaseId() userId: string,
        @TypedQuery() query: QueryFindAllUserProgress,
    ) {
        return this.userProgressService.getUserProgresses(userId, query);
    }

    /**
     * Lấy hoặc tạo progress cho một từ
     */
    @Get('vocabulary/:vocabularyId')
    async getOrCreateProgress(
        @FirebaseId() userId: string,
        @Param('vocabularyId') vocabularyId: string,
    ) {
        return this.userProgressService.getOrCreateProgress(userId, vocabularyId);
    }
}