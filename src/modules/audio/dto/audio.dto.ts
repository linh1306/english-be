/**
 * Body để sinh audio cho conversation
 */
export type BodyGenerateConversationAudio = {
    conversationId: string;
    dialogues: {
        speaker: string; // Tên người nói (ví dụ: "John", "Sarah")
        partsEn: string[];
    }[];
    voiceMap?: Record<string, string>; // Map từ tên người nói -> giọng đọc (ví dụ: { "John": "Kore", "Sarah": "Charon" })
    defaultVoice?: string; // Giọng mặc định nếu không có trong voiceMap
};

