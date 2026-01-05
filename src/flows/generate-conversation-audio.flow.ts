import { genkit, z } from 'genkit';
import { googleAI, gemini } from '@genkit-ai/googleai';

const ai = genkit({
    plugins: [googleAI()],
    model: gemini('gemini-2.5-flash-preview-tts'),
});

/**
 * Schema cho input của flow
 */
const ConversationDialogueSchema = z.object({
    speaker: z.string().describe('Tên người nói (ví dụ: "John", "Sarah")'),
    partsEn: z
        .array(z.string())
        .describe('Các cụm từ tiếng Anh tạo thành câu thoại'),
});

const GenerateAudioInputSchema = z.object({
    conversationId: z.string().describe('ID của conversation trong database'),
    dialogues: z
        .array(ConversationDialogueSchema)
        .describe('Mảng các câu thoại cần sinh audio'),
    voiceMap: z
        .record(z.string())
        .default({})
        .describe(
            'Map từ tên người nói -> giọng đọc (ví dụ: { "John": "Kore", "Sarah": "Charon" })',
        ),
    defaultVoice: z
        .string()
        .default('Kore')
        .describe('Giọng mặc định nếu không có trong voiceMap'),
});

/**
 * Schema cho output của flow
 */
const AudioOutputSchema = z.object({
    conversationId: z.string(),
    base64Audio: z.string().describe('Base64 encoded audio data'),
    mimeType: z.string().describe('MIME type của audio (ví dụ: audio/wav)'),
    segments: z
        .array(
            z.object({
                speaker: z.string(),
                partsEn: z.array(z.string()),
            }),
        )
        .describe('Thông tin các đoạn audio'),
});

/**
 * Flow sinh audio từ đoạn hội thoại sử dụng Gemini 2.5 Flash TTS
 */
export const generateConversationAudioFlow = ai.defineFlow(
    {
        name: 'generateConversationAudio',
        inputSchema: GenerateAudioInputSchema,
        outputSchema: AudioOutputSchema,
    },
    async (input) => {
        const { conversationId, dialogues, voiceMap, defaultVoice } = input;

        // Tạo script cho conversation với đánh dấu người nói
        const conversationScript = dialogues
            .map((line) => {
                const voice = voiceMap[line.speaker] ?? defaultVoice;
                const text = line.partsEn.join(' ');
                return `[${voice}]: ${text}`;
            })
            .join('\n\n');

        const prompt = `
      Read the following conversation naturally with appropriate pauses between speakers.
      Use different voices for each speaker as indicated.
      Make the conversation sound natural and engaging.
      
      ${conversationScript}
    `;

        // Lấy giọng đầu tiên làm voice config mặc định
        const firstVoice = Object.values(voiceMap)[0] ?? defaultVoice;

        // Sử dụng Gemini TTS để sinh audio
        const response = await ai.generate({
            model: gemini('gemini-2.5-flash-preview-tts'),
            prompt,
            config: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: {
                            voiceName: firstVoice,
                        },
                    },
                },
            },
        });

        // Xử lý audio response
        const audioData = response.media;
        if (!audioData || !audioData.url) {
            throw new Error('Failed to generate audio from TTS');
        }

        // Log để debug format
        console.log('Audio data URL prefix:', audioData.url.substring(0, 100));

        // Extract base64 và mime type - support nhiều format
        let mimeType = 'audio/wav';
        let base64Audio = '';

        if (audioData.url.startsWith('data:')) {
            // Format: data:audio/xxx;base64,xxx
            const commaIndex = audioData.url.indexOf(',');
            if (commaIndex === -1) {
                throw new Error('Invalid data URL format: no comma found');
            }

            const header = audioData.url.substring(0, commaIndex);
            base64Audio = audioData.url.substring(commaIndex + 1);

            // Extract mime type from header (e.g., "data:audio/wav;base64")
            const mimeMatch = header.match(/data:([^;]+)/);
            if (mimeMatch) {
                mimeType = mimeMatch[1];
            }
        } else {
            // Fallback: treat entire URL as base64
            base64Audio = audioData.url;
        }

        if (!base64Audio) {
            throw new Error('Failed to extract base64 audio data');
        }

        // Tạo segments thông tin
        const segments = dialogues.map((line) => ({
            speaker: line.speaker,
            partsEn: line.partsEn,
        }));

        return {
            conversationId,
            base64Audio,
            mimeType,
            segments,
        };
    },
);

export type GenerateAudioInput = z.infer<typeof GenerateAudioInputSchema>;
export type AudioOutput = z.infer<typeof AudioOutputSchema>;



