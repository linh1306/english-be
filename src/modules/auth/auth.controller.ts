import { Controller, Post, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { FirebaseAuthGuard } from '../../core/firebase/guards/firebase-auth.guard';
import { CurrentUser, FirebaseUser } from '../../core/firebase/decorators/current-user.decorator';
import { ResGetProfile, ResRevokeRefreshToken } from './dto';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Get('profile')
    async getProfile(@CurrentUser() user: FirebaseUser): Promise<ResGetProfile> {
        return this.authService.getProfile(user.uid);
    }

    @Post('refresh-consumed')
    async refreshConsumed(@CurrentUser() user: FirebaseUser): Promise<ResRevokeRefreshToken> {
        return this.authService.revokeRefreshToken(user.uid);
    }
}
