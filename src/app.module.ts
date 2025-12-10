import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { FirebaseModule, FirebaseAuthGuard } from './core/firebase';
import { PrismaModule } from './core/database/prisma.module';
import { VocabularyCategoryModule } from './modules/vocabulary-category';
import { VocabularyModule } from './modules/vocabulary';
import { UserProgressModule } from './modules/user-progress';

import { UserModule } from './modules/user';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    FirebaseModule,
    PrismaModule,
    VocabularyCategoryModule,
    VocabularyModule,
    UserProgressModule,

    UserModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }
