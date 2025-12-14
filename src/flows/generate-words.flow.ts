import { genkit, z } from 'genkit';
import { googleAI, gemini } from '@genkit-ai/googleai';

const ai = genkit({
    plugins: [googleAI()],
    model: gemini("gemini-2.5-flash"),
});

export const generateWordsFlow = ai.defineFlow(
    {
        name: 'generateWords',
        inputSchema: z.object({
            count: z.number().describe('Number of words to generate'),
            topics: z.string().describe('Topics description'),
            description: z.string().describe('Context or description for generation'),
            excludedWords: z.array(z.string()).optional().describe('List of words to exclude'),
        }),
        outputSchema: z.array(z.object({
            word: z.string(),
            meaning: z.string().describe('Vietnamese meaning'),
            pronunciation: z.string().optional().describe('IPA pronunciation'),
            partOfSpeech: z.string().optional(),
            exampleEn: z.string().optional().describe('English example sentence'),
            exampleVi: z.string().optional().describe('Vietnamese translation of example'),
            synonyms: z.array(z.string()).optional(),
            antonyms: z.array(z.string()).optional(),
            difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional().describe('Difficulty level'),
        })),
    },
    async (input) => {
        const { count, topics, description, excludedWords = [] } = input;

        const prompt = `
      Generate ${count} English vocabulary words related to the topic: "${topics}".
      Context/Description: ${description}.
      
      Constraints:
      - The output must be a valid JSON array of objects.
      - Do NOT include any of these words: ${excludedWords.join(', ')}.
      - Ensure words are relevant to the provided topics and description.
      - "meaning" must be in Vietnamese.
      - "difficulty" must be one of: BEGINNER, INTERMEDIATE, ADVANCED.
    `;

        const { output } = await ai.generate({
            prompt,
            output: {
                format: 'json',
                schema: z.array(z.object({
                    word: z.string(),
                    meaning: z.string(),
                    pronunciation: z.string().optional(),
                    partOfSpeech: z.string().optional(),
                    exampleEn: z.string().optional(),
                    exampleVi: z.string().optional(),
                    synonyms: z.array(z.string()).optional(),
                    antonyms: z.array(z.string()).optional(),
                    difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
                }))
            },
        });

        if (!output) {
            throw new Error('Failed to generate words');
        }

        return output;
    }
);
