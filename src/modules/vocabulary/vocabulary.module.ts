import { Module } from '@nestjs/common';
import { VocabularyController } from './vocabulary.controller';
import { VocabularyService } from './vocabulary.service';
import { CloudinaryModule } from '@/core/cloudinary/cloudinary.module';

@Module({
    imports: [CloudinaryModule],
    controllers: [VocabularyController],
    providers: [VocabularyService],
    exports: [VocabularyService],
})
export class VocabularyModule { }
