import { Module } from '@nestjs/common';
import { PictureDescriptionController } from './picture-description.controller';
import { PictureDescriptionService } from './picture-description.service';
import { ImageModule } from '../image/image.module';

@Module({
    imports: [ImageModule],
    controllers: [PictureDescriptionController],
    providers: [PictureDescriptionService],
    exports: [PictureDescriptionService],
})
export class PictureDescriptionModule { }

