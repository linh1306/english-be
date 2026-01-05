import { tags } from 'typia';

/**
 * Type cho mỗi câu thoại
 */
export type DialogueLine = {
    speaker: string; // Tên người nói (ví dụ: "John", "Sarah")
    partsEn: string[];
    timestamps?: string[]; // Timestamps cho mỗi part (ví dụ: ["00:00", "00:03", "00:06"])
};

/**
 * Body để tạo conversation mới
 */
export type BodyCreateConversation = {
    topic: string & tags.MinLength<1>;
    context: string & tags.MinLength<1>;
    dialogues: DialogueLine[];
};

/**
 * Body để generate conversation bằng AI
 */
export type BodyGenerateConversation = {
    topic?: string;
    count?: number & tags.Minimum<1> & tags.Maximum<10>;
    dialogueLength?: number & tags.Minimum<6> & tags.Maximum<12>;
};

/**
 * Body để generate audio cho conversation
 */
export type BodyGenerateAudio = {
    voiceMap?: Record<string, string>; // Map từ tên người nói -> giọng đọc
    defaultVoice?: string; // Giọng mặc định
};

/**
 * Body để update conversation
 */
export type BodyUpdateConversation = {
    topic?: string & tags.MinLength<1>;
    context?: string & tags.MinLength<1>;
    dialogues?: DialogueLine[];
    isActive?: boolean;
};

/**
 * Query để lấy danh sách conversations
 */
export type QueryGetConversations = {
    page?: number & tags.Minimum<1>;
    limit?: number & tags.Minimum<1> & tags.Maximum<100>;
    search?: string;
    isActive?: boolean;
};

