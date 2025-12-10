import { Module } from '@nestjs/common';
import { VocabularyCategoryController } from './vocabulary-category.controller';
import { VocabularyCategoryService } from './vocabulary-category.service';

@Module({
    controllers: [VocabularyCategoryController],
    providers: [VocabularyCategoryService],
    exports: [VocabularyCategoryService],
})
export class VocabularyCategoryModule { }
