import { Controller, Get, Post, Delete, Patch } from '@nestjs/common';
import { ConversationService } from './conversation.service';
import {
    BodyCreateConversation,
    BodyGenerateConversation,
    BodyUpdateConversation,
    QueryGetConversations,
} from './dto/conversation.dto';
import { TypedBody, TypedQuery, TypedParam } from '@nestia/core';
import { Roles, Public } from '@/core/firebase';

@Controller('conversations')
export class ConversationController {
    constructor(private readonly conversationService: ConversationService) { }

    @Get()
    @Public()
    async getConversations(@TypedQuery() query: QueryGetConversations) {
        return this.conversationService.getConversations(query);
    }

    @Get(':id')
    @Public()
    async getConversation(@TypedParam('id') id: string) {
        return this.conversationService.getConversation(id);
    }

    @Post()
    @Roles('ADMIN')
    async createConversation(@TypedBody() dto: BodyCreateConversation) {
        return this.conversationService.createConversation(dto);
    }

    @Patch(':id')
    @Roles('ADMIN')
    async updateConversation(
        @TypedParam('id') id: string,
        @TypedBody() dto: BodyUpdateConversation,
    ) {
        return this.conversationService.updateConversation(id, dto);
    }

    @Post('generate')
    @Roles('ADMIN')
    async generateConversation(@TypedBody() dto: BodyGenerateConversation) {
        return this.conversationService.generateConversation(dto);
    }

    @Delete()
    @Roles('ADMIN')
    async deleteConversations(@TypedBody() body: { ids: string[] }) {
        return this.conversationService.deleteConversations(body.ids);
    }
}
