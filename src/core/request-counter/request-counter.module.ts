import { Global, Module } from '@nestjs/common';
import { RequestCounterService } from './request-counter.service';
import { RequestCounterMiddleware } from './request-counter.middleware';

@Global()
@Module({
    providers: [RequestCounterService, RequestCounterMiddleware],
    exports: [RequestCounterService, RequestCounterMiddleware],
})
export class RequestCounterModule { }
