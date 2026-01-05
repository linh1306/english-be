import { Injectable, Logger } from '@nestjs/common';
import { Queued } from '@/core/queue/queued.decorator';
import { PrismaService } from '@/core/database/prisma.service';
import { CloudinaryService } from '@/core/cloudinary/cloudinary.service';
import { generateConversationAudioFlow } from '@/flows/generate-conversation-audio.flow';
import { BodyGenerateConversationAudio } from './dto/audio.dto';

/**
 * Convert PCM L16 raw audio to WAV format
 * @param pcmBuffer - Raw PCM buffer (16-bit signed, little-endian)
 * @param sampleRate - Sample rate (default 24000 for Gemini TTS)
 * @param numChannels - Number of channels (default 1 for mono)
 */
function pcmToWav(
    pcmBuffer: Buffer,
    sampleRate = 24000,
    numChannels = 1,
): Buffer {
    const byteRate = sampleRate * numChannels * 2; // 16-bit = 2 bytes
    const blockAlign = numChannels * 2;
    const dataSize = pcmBuffer.length;
    const headerSize = 44;
    const fileSize = headerSize + dataSize - 8;

    const wavBuffer = Buffer.alloc(headerSize + dataSize);

    // RIFF header
    wavBuffer.write('RIFF', 0);
    wavBuffer.writeUInt32LE(fileSize, 4);
    wavBuffer.write('WAVE', 8);

    // fmt sub-chunk
    wavBuffer.write('fmt ', 12);
    wavBuffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
    wavBuffer.writeUInt16LE(1, 20); // AudioFormat (1 for PCM)
    wavBuffer.writeUInt16LE(numChannels, 22);
    wavBuffer.writeUInt32LE(sampleRate, 24);
    wavBuffer.writeUInt32LE(byteRate, 28);
    wavBuffer.writeUInt16LE(blockAlign, 32);
    wavBuffer.writeUInt16LE(16, 34); // BitsPerSample

    // data sub-chunk
    wavBuffer.write('data', 36);
    wavBuffer.writeUInt32LE(dataSize, 40);

    // Copy PCM data
    pcmBuffer.copy(wavBuffer, 44);

    return wavBuffer;
}

@Injectable()
export class AudioService {
    private readonly logger = new Logger(AudioService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly cloudinaryService: CloudinaryService,
    ) { }

    /**
     * Sinh audio cho conversation và upload lên Cloudinary
     */
    async generateConversationAudio(dto: BodyGenerateConversationAudio) {
        this.processConversationAudio(
            dto.conversationId,
            dto.dialogues,
            dto.voiceMap,
            dto.defaultVoice,
        );

        return {
            message: 'Conversation audio generation started in background',
        };
    }

    @Queued({ maxRetries: 2, retryDelay: 2000 })
    async processConversationAudio(
        conversationId: string,
        dialogues: { speaker: string; partsEn: string[] }[],
        voiceMap?: Record<string, string>,
        defaultVoice?: string,
    ) {
        this.logger.log(
            `Starting audio generation for conversation ${conversationId}`,
        );

        try {
            // Sinh audio từ Gemini TTS
            const result = await generateConversationAudioFlow({
                conversationId,
                dialogues,
                voiceMap: voiceMap ?? {},
                defaultVoice: defaultVoice ?? 'Kore',
            });

            this.logger.log(`Audio generated for conversation ${conversationId}`);

            // Convert base64 PCM sang buffer
            const pcmBuffer = Buffer.from(result.base64Audio, 'base64');

            // Convert PCM L16 sang WAV (Gemini TTS trả về PCM 24kHz mono)
            const wavBuffer = pcmToWav(pcmBuffer, 24000, 1);

            this.logger.log(
                `Converted PCM to WAV (${pcmBuffer.length} -> ${wavBuffer.length} bytes)`,
            );

            // Upload lên Cloudinary
            const audioUrl = await this.cloudinaryService.uploadAudio(
                wavBuffer,
                'conversations',
            );

            this.logger.log(
                `Audio uploaded to Cloudinary for conversation ${conversationId}: ${audioUrl}`,
            );

            // Cập nhật URL vào database
            await this.prisma.conversation.update({
                where: { id: conversationId },
                data: { audioUrl },
            });

            this.logger.log(`Database updated for conversation ${conversationId}`);

            return { audioUrl };
        } catch (error) {
            this.logger.error(
                `Failed to generate audio for conversation ${conversationId}`,
                error,
            );
            throw error;
        }
    }
}


