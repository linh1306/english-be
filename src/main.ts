import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';

import cookie from '@fastify/cookie';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );
  await app.register(cookie);
  await app.register(import('@fastify/cors'), {
    origin: [process.env.FRONTEND_URL || '*'],
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 8000);
}

bootstrap();
