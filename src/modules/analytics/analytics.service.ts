import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview() {
    const [totalUsers, totalTopics, totalVocabularies, totalLogins] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.topic.count(),
        this.prisma.vocabulary.count(),
        this.prisma.loginLog.count(),
      ]);

    return {
      totalUsers,
      totalTopics,
      totalVocabularies,
      totalLogins,
    };
  }

  async getLoginStats(startDate?: Date, endDate?: Date) {
    const where: any = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    // Group by date
    const logins = await this.prisma.loginLog.groupBy({
      by: ['createdAt'],
      where,
      _count: { id: true },
      orderBy: { createdAt: 'asc' },
    });

    // Aggregate by day
    const dailyLogins = logins.reduce(
      (acc, login) => {
        const date = login.createdAt.toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + login._count.id;
        return acc;
      },
      {} as Record<string, number>,
    );

    return Object.entries(dailyLogins).map(([date, count]) => ({
      date,
      count,
    }));
  }

  async getRequestStats(startDate?: Date, endDate?: Date) {
    const where: any = {};
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    const stats = await this.prisma.dailyStats.findMany({
      where,
      include: { slots: true },
      orderBy: { date: 'asc' },
    });

    return stats.map((stat) => ({
      date: stat.date.toISOString().split('T')[0],
      totalRequests: stat.totalRequests,
      slots: stat.slots
        .sort((a, b) => a.slot - b.slot)
        .map((slot) => ({
          slot: slot.slot,
          time: `${Math.floor(slot.slot / 2)
            .toString()
            .padStart(2, '0')}:${slot.slot % 2 === 0 ? '00' : '30'}`,
          count: slot.count,
        })),
    }));
  }

  async getLearningStats() {
    const [totalProgress, totalLearning, totalLearned] = await Promise.all([
      this.prisma.userVocabularyProgress.count(),
      this.prisma.userTopicProgress.aggregate({
        _sum: { learningWords: true },
      }),
      this.prisma.userTopicProgress.aggregate({
        _sum: { learnedWords: true },
      }),
    ]);

    return {
      totalVocabularyProgress: totalProgress,
      totalLearningWords: totalLearning._sum.learningWords || 0,
      totalLearnedWords: totalLearned._sum.learnedWords || 0,
    };
  }
}
