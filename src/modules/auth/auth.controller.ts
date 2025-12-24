import { Controller, Post, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  CurrentUser,
  FirebaseUser,
} from '../../core/firebase/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('profile')
  async getProfile(@CurrentUser() user: FirebaseUser) {
    return this.authService.getProfile(user.uid);
  }

  @Post('refresh-consumed')
  async refreshConsumed(@CurrentUser() user: FirebaseUser) {
    return this.authService.revokeRefreshToken(user.uid);
  }
}
