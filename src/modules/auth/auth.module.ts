import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { FirebaseModule } from '../../core/firebase/firebase.module';
import { UserModule } from '../user/user.module';

@Module({
    imports: [FirebaseModule, UserModule],
    controllers: [AuthController],
    providers: [AuthService],
    exports: [AuthService],
})
export class AuthModule { }
