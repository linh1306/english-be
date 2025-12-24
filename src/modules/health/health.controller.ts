import { Controller, Get } from '@nestjs/common';
import { Public } from '@/core/firebase';

@Controller('health')
export class HealthController {
    @Get()
    @Public()
    check() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
        };
    }
}
