import { genkit, z } from 'genkit';
import { googleAI, gemini } from '@genkit-ai/googleai';

const ai = genkit({
    plugins: [googleAI()],
    model: gemini('gemini-2.5-flash'),
});

export const gradePictureAnswerFlow = ai.defineFlow(
    {
        name: 'gradePictureAnswer',
        inputSchema: z.object({
            originalDescription: z
                .string()
                .describe('Đoạn mô tả gốc (đáp án mẫu)'),
            partsEn: z
                .array(z.string())
                .describe('Mảng các cụm từ/câu ngắn tiếng Anh (đáp án)'),
            userAnswer: z.string().describe('Câu trả lời của người dùng'),
        }),
        outputSchema: z.object({
            feedback: z.string().describe('Nhận xét chi tiết bằng tiếng Việt'),
            score: z.number().min(0).max(100).describe('Điểm số từ 0-100'),
            matchedParts: z
                .array(z.string())
                .describe('Các parts mà người dùng đã diễn đạt đúng/tương đương'),
            grammarErrors: z
                .array(z.string())
                .optional()
                .describe('Các lỗi ngữ pháp cần sửa'),
            suggestions: z
                .array(z.string())
                .optional()
                .describe('Gợi ý cải thiện'),
        }),
    },
    async (input) => {
        const { originalDescription, partsEn, userAnswer } = input;

        const prompt = `
      You are an English teacher grading a picture description exercise.
      
      ORIGINAL DESCRIPTION (Model Answer):
      "${originalDescription}"
      
      KEY PHRASES (partsEn):
      ${JSON.stringify(partsEn)}
      
      STUDENT'S ANSWER:
      "${userAnswer}"
      
      GRADING CRITERIA:
      1. Content Coverage (40%): How many key phrases/ideas did the student express?
      2. Grammar (30%): Is the grammar correct?
      3. Vocabulary (20%): Is the vocabulary appropriate and varied?
      4. Coherence (10%): Is the description well-organized and flows naturally?
      
      TASK:
      1. Calculate a score from 0-100 based on the criteria above
      2. Identify which partsEn the student expressed correctly or with equivalent meaning
      3. List any grammar errors with corrections
      4. Provide constructive feedback in Vietnamese
      5. Suggest improvements
      
      Be encouraging but honest. Focus on what the student did well before mentioning areas for improvement.
    `;

        const { output } = await ai.generate({
            prompt,
            output: {
                format: 'json',
                schema: z.object({
                    score: z.number(),
                    feedback: z.string(),
                    matchedParts: z.array(z.string()),
                    grammarErrors: z.array(z.string()).optional(),
                    suggestions: z.array(z.string()).optional(),
                }),
            },
        });

        if (!output) {
            throw new Error('Failed to grade answer');
        }

        return output;
    },
);
