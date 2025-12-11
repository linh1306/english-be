import { Controller, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { FirebaseAuthGuard } from '../../core/firebase/guards/firebase-auth.guard';
import { CurrentUser, FirebaseUser } from '../../core/firebase/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('register')
    @UseGuards(FirebaseAuthGuard)
    async register(@CurrentUser() user: FirebaseUser) {
        return this.authService.register(user);
    }
}
