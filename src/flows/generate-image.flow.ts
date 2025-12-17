import { GoogleGenAI } from '@google/genai';
import "dotenv/config";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

console.log(process.env.GEMINI_API_KEY);


export type AspectRatio =
    | '16:9'
    | '3:4'
    | '1:1'
    | '9:16'
    | '4:3'
    | '3:2'
    | '2:3';

export interface GenerateImageInput {
    prompt: string;
    aspectRatio: AspectRatio;
}

export async function generateGhibliImage(
    input: GenerateImageInput,
): Promise<Buffer> {
    const { prompt, aspectRatio } = input;

    const fullPrompt = `Studio Ghibli inspired realistic illustration of ${prompt}.
Soft watercolor tones, natural lighting, detailed and grounded in reality.
NO text, logos, or watermarks.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [{ text: fullPrompt }],
        },
        config: {
            imageConfig: {
                aspectRatio,
            },
        },
    });
    console.log(response);

    if (!response.candidates || response.candidates.length === 0) {
        throw new Error('No candidates returned from Gemini API');
    }

    const content = response.candidates[0].content;
    if (!content?.parts) {
        throw new Error('No content parts in response');
    }

    for (const part of content.parts) {
        if (part.inlineData?.data) {
            return Buffer.from(part.inlineData.data, 'base64');
        }
    }

    throw new Error('No image data found in the response');
}
