import { genkit, z } from 'genkit';
import { googleAI, gemini } from '@genkit-ai/googleai';

const ai = genkit({
    plugins: [googleAI()],
    model: gemini('gemini-2.5-flash'),
});

/**
 * Schema cho mỗi câu thoại trong đoạn hội thoại
 */
const DialogueLineSchema = z.object({
    speaker: z.string().describe('Tên người nói (ví dụ: "John", "Sarah")'),
    partsEn: z
        .array(z.string())
        .describe('Các cụm từ/mệnh đề tiếng Anh, ghép lại thành câu thoại hoàn chỉnh'),
});

/**
 * Schema cho toàn bộ đoạn hội thoại
 */
const ConversationSchema = z.object({
    topic: z.string().describe('Chủ đề của đoạn hội thoại'),
    context: z
        .string()
        .describe('Mô tả ngữ cảnh/tình huống của đoạn hội thoại bằng tiếng Anh'),
    dialogues: z
        .array(DialogueLineSchema)
        .describe('Mảng các câu thoại trong đoạn hội thoại'),
});

/**
 * Các chủ đề APTIS Speaking phổ biến
 */
const APTIS_TOPICS = [
    'Ordering food at a restaurant',
    'Making a doctor appointment',
    'Booking a hotel room',
    'Asking for directions',
    'Shopping for clothes',
    'Discussing weekend plans',
    'Making travel arrangements',
    'Complaining about a product',
    'Job interview',
    'Talking about hobbies',
    'Discussing the weather',
    'Making a phone call to a company',
    'Planning a birthday party',
    'Discussing health and fitness',
    'Talking about family',
    'Discussing education and studying',
    'Making small talk with a neighbor',
    'Discussing work and career',
    'Talking about movies or TV shows',
    'Discussing environmental issues',
];

export const generateConversationFlow = ai.defineFlow(
    {
        name: 'generateConversation',
        inputSchema: z.object({
            topic: z
                .string()
                .optional()
                .describe(
                    'Chủ đề cho đoạn hội thoại. Nếu bỏ trống, AI sẽ tự động chọn một chủ đề APTIS phổ biến.',
                ),
            count: z.number().default(1).describe('Số lượng conversations cần tạo'),
            dialogueLength: z
                .number()
                .default(8)
                .describe('Số lượng câu thoại trong mỗi đoạn hội thoại (6-12)'),
        }),
        outputSchema: z.array(ConversationSchema),
    },
    async (input) => {
        const { topic, count, dialogueLength } = input;

        const topicPrompt = topic
            ? `Topic: "${topic}"`
            : `Topic: Auto-select from APTIS Speaking test topics. Examples: ${APTIS_TOPICS.slice(0, 5).join(', ')}, etc.`;

        const prompt = `
      Generate ${count} realistic conversation(s) for English learning exercises (APTIS Speaking test style).
      
      ${topicPrompt}
      
      For each conversation, create:
      1. A topic title
      2. A brief context/situation description (1-2 sentences in English)
      3. ${dialogueLength} dialogue lines alternating between two speakers (use real names like "John", "Sarah")
      
      For each dialogue line, provide:
      - speaker: The name of the speaker (e.g., "John", "Sarah")
      - partsEn: Array of LONGER, meaningful phrases (5-15 words each) that combine to form the full sentence. Each part should be a complete clause or meaningful unit.
      
      IMPORTANT RULES FOR partsEn:
      - Each part should be 5-15 words long (NOT 2-3 words)
      - Split sentences into 2-4 parts maximum (NOT 5-6 parts)
      - Each part should be a complete clause or phrase that makes sense on its own
      - DO NOT split in the middle of a phrase or clause
      - Short sentences (under 8 words) should be kept as a SINGLE part
      
      General Rules:
      - Use natural, everyday English suitable for APTIS level (B1-B2)
      - Include common phrases and expressions used in real conversations
      - Make the dialogue flow naturally with questions and responses
      - Use a mix of sentence structures (questions, statements, exclamations)
      - Include polite expressions and common conversational fillers
      - Use the SAME two speaker names consistently throughout each conversation
      
      GOOD example (longer, meaningful parts):
      {
        "speaker": "John",
        "partsEn": ["Excuse me, could you please tell me", "where the nearest bank is located?"]
      }
      
      BAD example (too short, choppy parts - DO NOT DO THIS):
      {
        "speaker": "John",
        "partsEn": ["Excuse me", "could you tell me", "where the nearest", "bank is?"]
      }
    `;

        const { output } = await ai.generate({
            prompt,
            output: {
                format: 'json',
                schema: z.array(ConversationSchema),
            },
        });

        if (!output) {
            throw new Error('Failed to generate conversations');
        }

        return output;
    },
);

export type Conversation = z.infer<typeof ConversationSchema>;
export type DialogueLine = z.infer<typeof DialogueLineSchema>;

