import { Controller, Get, Post, Param, Query, Body, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { UserProgressService } from './user-progress.service';
import {
    ReviewAnswerDto,
    QueryUserProgressDto,
    UserVocabularyProgressResponse,
    PaginatedUserProgressResponse,
    UserLearningStatistics,
    StartStudySessionDto,
    StudySessionResponse,
    SubmitStudyResultDto,
    StudyResultSummary,
} from './dto/user-progress.dto';

@Controller('user-progress')
export class UserProgressController {
    constructor(private readonly userProgressService: UserProgressService) { }

    /**
     * Lấy thống kê học tập của user
     * GET /user-progress/statistics/:userId
     */
    @Get('statistics/:userId')
    async getStatistics(@Param('userId') userId: string): Promise<UserLearningStatistics> {
        return this.userProgressService.getStatistics(userId);
    }

    /**
     * Lấy các từ cần ôn tập hôm nay
     * GET /user-progress/due-review/:userId
     */
    @Get('due-review/:userId')
    async getDueForReview(
        @Param('userId') userId: string,
        @Query('limit') limit?: number,
    ): Promise<UserVocabularyProgressResponse[]> {
        return this.userProgressService.getDueForReview(userId, limit ?? 20);
    }

    /**
     * Lấy tiến trình theo category
     * GET /user-progress/categories/:userId
     */
    @Get('categories/:userId')
    async getCategoryProgress(@Param('userId') userId: string) {
        return this.userProgressService.getCategoryProgress(userId);
    }

    /**
     * Bắt đầu phiên học mới
     * POST /user-progress/study-session/:userId
     */
    @Post('study-session/:userId')
    @HttpCode(HttpStatus.OK)
    async startStudySession(
        @Param('userId') userId: string,
        @Body() dto: StartStudySessionDto,
    ): Promise<StudySessionResponse> {
        return this.userProgressService.startStudySession(userId, dto);
    }

    /**
     * Submit kết quả học tập
     * POST /user-progress/submit-result/:userId
     */
    @Post('submit-result/:userId')
    @HttpCode(HttpStatus.OK)
    async submitStudyResult(
        @Param('userId') userId: string,
        @Body() dto: SubmitStudyResultDto,
    ): Promise<StudyResultSummary> {
        return this.userProgressService.submitStudyResult(userId, dto);
    }

    /**
     * Ghi nhận kết quả ôn tập một từ
     * POST /user-progress/review/:userId
     */
    @Post('review/:userId')
    @HttpCode(HttpStatus.OK)
    async recordReview(
        @Param('userId') userId: string,
        @Body() dto: ReviewAnswerDto,
    ): Promise<UserVocabularyProgressResponse> {
        return this.userProgressService.recordReview(userId, dto);
    }

    /**
     * Lấy danh sách tiến trình của user
     * GET /user-progress/:userId
     */
    @Get(':userId')
    async findAll(
        @Param('userId') userId: string,
        @Query() query: QueryUserProgressDto,
    ): Promise<PaginatedUserProgressResponse> {
        return this.userProgressService.findAll(userId, query);
    }

    /**
     * Lấy hoặc tạo progress cho một từ
     * GET /user-progress/:userId/vocabulary/:vocabularyId
     */
    @Get(':userId/vocabulary/:vocabularyId')
    async getOrCreateProgress(
        @Param('userId') userId: string,
        @Param('vocabularyId') vocabularyId: string,
    ): Promise<UserVocabularyProgressResponse> {
        return this.userProgressService.getOrCreateProgress(userId, vocabularyId);
    }
}
