import { Module } from '@nestjs/common';
import { PictureDescriptionController } from './picture-description.controller';
import { PictureDescriptionService } from './picture-description.service';

@Module({
    controllers: [PictureDescriptionController],
    providers: [PictureDescriptionService],
    exports: [PictureDescriptionService],
})
export class PictureDescriptionModule { }
