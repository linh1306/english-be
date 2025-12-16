import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({});

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

    const fullPrompt = `${prompt}

STRICT STYLE REQUIREMENTS - Studio Ghibli art style:
- Soft, watercolor-like backgrounds with gentle gradients
- Vibrant but natural, earthy color palette
- Detailed hand-drawn textures and organic linework
- Dreamy, nostalgic, and peaceful atmosphere
- Warm, inviting natural lighting
- Whimsical details and magical realism
- NO text, logos, or watermarks`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-05-20',
        contents: fullPrompt,
        config: {
            responseModalities: ['image', 'text'],
            imageConfig: {
                aspectRatio,
            },
        },
    });

    for (const part of response.candidates![0].content!.parts!) {
        if (part.inlineData) {
            const imageData = part.inlineData.data!;
            return Buffer.from(imageData, 'base64');
        }
    }

    throw new Error('Failed to generate image');
}
