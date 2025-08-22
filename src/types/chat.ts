export interface StreamChunk {
    content: string;
    is_complete: boolean;
    error?: string;
    // Status information (streaming_started, progress, completed)
    status?: string;
    status_message?: string;
}