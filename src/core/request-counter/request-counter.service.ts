import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class RequestCounterService {
    private counter = 0;

    constructor(private readonly prisma: PrismaService) { }

    increment() {
        this.counter++;
    }

    // Helper: lấy slot number (0-47)
    private getSlotNumber(): number {
        const now = new Date();
        return now.getHours() * 2 + (now.getMinutes() >= 30 ? 1 : 0);
    }

    // Chạy mỗi 30 phút: 0, 30
    @Cron('0,30 * * * *')
    async flushToDatabase() {
        if (this.counter === 0) return;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const slot = this.getSlotNumber();

        // Upsert DailyStats
        const dailyStats = await this.prisma.dailyStats.upsert({
            where: { date: today },
            update: { totalRequests: { increment: this.counter } },
            create: { date: today, totalRequests: this.counter },
        });

        // Upsert DailyStatSlot
        await this.prisma.dailyStatSlot.upsert({
            where: { dailyStatsId_slot: { dailyStatsId: dailyStats.id, slot } },
            update: { count: { increment: this.counter } },
            create: { dailyStatsId: dailyStats.id, slot, count: this.counter },
        });

        this.counter = 0;
    }

    // Flush khi shutdown
    async onModuleDestroy() {
        await this.flushToDatabase();
    }
}
