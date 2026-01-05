import { Module } from '@nestjs/common';
import { AudioService } from './audio.service';
import { CloudinaryModule } from '@/core/cloudinary/cloudinary.module';

@Module({
    imports: [CloudinaryModule],
    providers: [AudioService],
    exports: [AudioService],
})
export class AudioModule { }
