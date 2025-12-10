import { Module } from '@nestjs/common';
import { FirebaseModule, FirebaseAuthGuard } from './core/firebase';
import { PrismaModule } from './core/database/prisma.module';
import { VocabularyCategoryModule } from './modules/vocabulary-category';
import { VocabularyModule } from './modules/vocabulary';
import { UserProgressModule } from './modules/user-progress';
import { AuthModule } from './modules/auth';
import { UserModule } from './modules/user';

@Module({
  imports: [
    FirebaseModule,
    PrismaModule,
    VocabularyCategoryModule,
    VocabularyModule,
    UserProgressModule,
    AuthModule,
    UserModule,
  ],
  controllers: [],
  providers: [
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
