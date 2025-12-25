import { Global, Module } from '@nestjs/common';
import { FirebaseService } from './firebase.service';
import { FirebaseAuthGuard } from './guards/firebase-auth.guard';
import { PrismaModule } from '../database/prisma.module';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [FirebaseService, FirebaseAuthGuard],
  exports: [FirebaseService, FirebaseAuthGuard],
})
export class FirebaseModule {}
