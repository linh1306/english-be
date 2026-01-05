import { genkit, z } from 'genkit';
import { googleAI, gemini } from '@genkit-ai/googleai';

const ai = genkit({
  plugins: [googleAI()],
  model: gemini('gemini-2.5-flash'),
});

export const generatePictureDescriptionFlow = ai.defineFlow(
  {
    name: 'generatePictureDescription',
    inputSchema: z.object({
      context: z
        .string()
        .optional()
        .describe(
          'Chủ đề hoặc ngữ cảnh cho bức tranh. Nếu bỏ trống, AI sẽ tự động chọn một cảnh sinh hoạt đời thường (APTIS style).',
        ),
      count: z.number().default(1).describe('Số lượng descriptions cần tạo'),
    }),
    outputSchema: z.array(
      z.object({
        description: z
          .string()
          .describe('Đoạn mô tả chi tiết đầy đủ về bức tranh bằng tiếng Anh'),
        partsEn: z
          .array(z.string())
          .describe(
            'Mảng các cụm từ/câu ngắn tiếng Anh, ghép lại thành đoạn mô tả hoàn chỉnh',
          ),
        partsVi: z
          .array(z.string())
          .describe('Bản dịch tiếng Việt của partsEn, giữ nguyên thứ tự'),
      }),
    ),
  },
  async (input) => {
    const { context, count } = input;

    const contextPrompt = context
      ? `Context/Theme: "${context}"`
      : `Context/Theme: Auto-generate a daily life scene typical for APTIS speaking test. The scene MUST have:
               - Multiple people doing different actions.
               - A clear setting (place and time).
               - Common daily activities (e.g., in a park, office, kitchen, street).`;

    const prompt = `
      Generate ${count} picture description(s) for English learning exercises.
      
      ${contextPrompt}
      
      For each description, create:
      1. A detailed description (3-5 sentences) of the imaginary scene.
      2. Break it into short phrases/clauses (partsEn) that when combined form the full description.
      3. Translate each part to Vietnamese (partsVi), maintaining the same order.
      
      Rules:
      - The description should be vivid and detailed but easy to understand (APTIS level).
      - Focus on OBSERVABLE actions using PRESENT CONTINUOUS tense (is/are doing).
      - Describe what people are doing, their location, and the general atmosphere.
      - Do not invent backstories or inner thoughts. Just describe what CAN BE SEEN.
      - Each part in partsEn should be a meaningful phrase (3-8 words).
      - partsVi must be accurate translations of partsEn.
      
      Example format for partsEn:
      ["In the picture", "there are three people", "sitting in a modern office", "A woman is typing on a laptop", "while a man is standing", "holding a cup of coffee", "They look busy", "and focused on their work"]
    `;

    const { output } = await ai.generate({
      prompt,
      output: {
        format: 'json',
        schema: z.array(
          z.object({
            description: z.string(),
            partsEn: z.array(z.string()),
            partsVi: z.array(z.string()),
          }),
        ),
      },
    });

    if (!output) {
      throw new Error('Failed to generate picture descriptions');
    }

    return output;
  },
);
