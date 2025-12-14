import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { FirebaseModule, FirebaseAuthGuard, RolesGuard } from './core/firebase';
import { PrismaModule } from './core/database/prisma.module';
import { TopicModule } from './modules/topic';
import { VocabularyModule } from './modules/vocabulary';
import { UserProgressModule } from './modules/user-progress';

import { UserModule } from './modules/user';
import { AuthModule } from './modules/auth/auth.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    FirebaseModule,
    PrismaModule,
    TopicModule,
    VocabularyModule,
    UserProgressModule,

    UserModule,
    AuthModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: FirebaseAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule { }
