import { Module } from '@nestjs/common';
import { FirebaseModule, FirebaseAuthGuard } from './firebase';
import { PrismaService } from './prisma/prisma.service';

@Module({
  imports: [FirebaseModule],
  controllers: [],
  providers: [
    PrismaService,
    // Uncomment the following to enable global authentication
    // All routes will require Firebase authentication by default
    // Use @Public() decorator to make specific routes public
    // {
    //   provide: APP_GUARD,
    //   useClass: FirebaseAuthGuard,
    // },
  ],
})
export class AppModule { }
