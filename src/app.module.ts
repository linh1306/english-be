import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { FirebaseModule, FirebaseAuthGuard, RolesGuard } from './core/firebase';
import { PrismaModule } from './core/database/prisma.module';
import { CloudinaryModule } from './core/cloudinary';
import {
  RequestCounterModule,
  RequestCounterMiddleware,
} from './core/request-counter';
import { TopicModule } from './modules/topic';
import { VocabularyModule } from './modules/vocabulary';
import { UserProgressModule } from './modules/user-progress';
import { HealthModule } from './modules/health';
import { AnalyticsModule } from './modules/analytics';
import { PictureDescriptionModule } from './modules/picture-description';

import { UserModule } from './modules/user';
import { AuthModule } from './modules/auth/auth.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    FirebaseModule,
    PrismaModule,
    CloudinaryModule,
    RequestCounterModule,
    TopicModule,
    VocabularyModule,
    UserProgressModule,
    HealthModule,
    AnalyticsModule,
    PictureDescriptionModule,

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
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestCounterMiddleware).forRoutes('*');
  }
}

