import { Injectable, NestMiddleware } from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';
import { RequestCounterService } from './request-counter.service';

@Injectable()
export class RequestCounterMiddleware implements NestMiddleware {
  constructor(private readonly requestCounterService: RequestCounterService) {}

  use(req: FastifyRequest['raw'], res: FastifyReply['raw'], next: () => void) {
    this.requestCounterService.increment();
    next();
  }
}
