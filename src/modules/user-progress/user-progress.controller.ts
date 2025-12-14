import { Controller, Get, Post, Param, Query, Body, HttpCode, HttpStatus, UseGuards, ParseIntPipe } from '@nestjs/common';
import { TypedQuery } from '@nestia/core';
import { UserProgressService } from './user-progress.service';
import {
    BodyReviewAnswer,
    QueryFindAllUserProgress,
    ResUserVocabularyProgress,
    ResFindAllUserProgress,
    ResGetStatistics,
    BodyStartStudySession,
    ResStartStudySession,
    BodySubmitStudyResult,
    ResSubmitStudyResult,
    ResGetDueForReview,
    ResGetTopicProgress,
    ResRecordReview,
    ResGetOrCreateProgress,
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
     * GET /user-progress/statistics
     */
    @Get('statistics')
    async getUserStatistics(@FirebaseId() userId: string): Promise<ResGetStatistics> {
        return this.userProgressService.getUserStatistics(userId);
    }

    /**
     * Lấy các từ cần ôn tập hôm nay
     * GET /user-progress/due-review
     */
    @Get('due-review')
    async getDueForReview(
        @FirebaseId() userId: string,
        @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    ): Promise<ResGetDueForReview> {
        return this.userProgressService.getDueForReview(userId, limit ?? 20);
    }

    /**
     * Lấy tiến trình theo topic
     * GET /user-progress/topics
     */
    @Get('topics')
    async getUserTopicProgress(@FirebaseId() userId: string): Promise<ResGetTopicProgress> {
        return this.userProgressService.getUserTopicProgress(userId);
    }

    /**
     * Bắt đầu phiên học mới
     * POST /user-progress/study-session
     */
    @Post('study-session')
    @HttpCode(HttpStatus.OK)
    async startStudySession(
        @FirebaseId() userId: string,
        @Body() dto: BodyStartStudySession,
    ): Promise<ResStartStudySession> {
        return this.userProgressService.startStudySession(userId, dto);
    }

    /**
     * Submit kết quả học tập
     * POST /user-progress/submit-result
     */
    @Post('submit-result')
    @HttpCode(HttpStatus.OK)
    async submitStudyResult(
        @FirebaseId() userId: string,
        @Body() dto: BodySubmitStudyResult,
    ): Promise<ResSubmitStudyResult> {
        return this.userProgressService.submitStudyResult(userId, dto);
    }

    /**
     * Ghi nhận kết quả ôn tập một từ
     * POST /user-progress/review
     */
    @Post('review')
    @HttpCode(HttpStatus.OK)
    async recordReview(
        @FirebaseId() userId: string,
        @Body() dto: BodyReviewAnswer,
    ): Promise<ResRecordReview> {
        return this.userProgressService.recordReview(userId, dto);
    }

    /**
     * Lấy danh sách tiến trình của user
     * GET /user-progress
     */
    @Get()
    async getUserProgresses(
        @FirebaseId() userId: string,
        @TypedQuery() query: QueryFindAllUserProgress,
    ): Promise<ResFindAllUserProgress> {
        return this.userProgressService.getUserProgresses(userId, query);
    }

    /**
     * Lấy hoặc tạo progress cho một từ
     * GET /user-progress/vocabulary/:vocabularyId
     */
    @Get('vocabulary/:vocabularyId')
    async getOrCreateProgress(
        @FirebaseId() userId: string,
        @Param('vocabularyId') vocabularyId: string,
    ): Promise<ResGetOrCreateProgress> {
        return this.userProgressService.getOrCreateProgress(userId, vocabularyId);
    }
}
