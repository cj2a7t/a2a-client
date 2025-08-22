import { listen } from '@tauri-apps/api/event';

export interface StreamChunk {
    content: string;
    is_complete: boolean;
    error?: string;
    status?: string; // Status information (streaming_started, progress, completed)
    message?: string; // New: Status message
}

export class StreamingChatHandler {
    private isListening = false;
    private onChunk?: (chunk: string) => void;
    private onComplete?: (fullContent: string) => void;
    private onError?: (error: string) => void;
    private onStatus?: (status: string, message: string) => void;
    private fullContent = '';
    private unlistenFn?: () => void;

    constructor(
        onChunk?: (chunk: string) => void,
        onComplete?: (fullContent: string) => void,
        onError?: (error: string) => void,
        onStatus?: (status: string, message: string) => void
    ) {
        this.onChunk = onChunk;
        this.onComplete = onComplete;
        this.onError = onError;
        this.onStatus = onStatus;
    }

    // New: Method to update callbacks
    setOnComplete(callback: (fullContent: string) => void): void {
        this.onComplete = callback;
        console.log('onComplete callback updated');
    }

    setOnError(callback: (error: string) => void): void {
        this.onError = callback;
        console.log('onError callback updated');
    }

    setOnChunk(callback: (chunk: string) => void): void {
        this.onChunk = callback;
        console.log('onChunk callback updated');
    }

    setOnStatus(callback: (status: string, message: string) => void): void {
        this.onStatus = callback;
        console.log('onStatus callback updated');
    }

    async startListening(): Promise<void> {
        if (this.isListening) {
            return;
        }

        this.isListening = true;
        this.fullContent = '';

        this.unlistenFn = await listen<StreamChunk>('chat_stream_chunk', (event) => {
            const { content, is_complete, error, status, message } = event.payload;

            // console.log('Received streaming event:', { content: content ? content : '', is_complete, error, status, message });

            if (is_complete) {
                if (error) {
                    console.error('Streaming error:', error);
                    if (this.onError) {
                        console.log('Calling onError callback with error:', error);
                        this.onError(error);
                    } else {
                        console.warn('onError callback is not set');
                    }
                } else {
                    if (this.onComplete) {
                        console.log('Calling onComplete callback with content length:', this.fullContent.length);
                        this.onComplete(this.fullContent);
                        console.log('onComplete callback executed successfully');
                    } else {
                        console.warn('onComplete callback is not set');
                    }
                }
                this.stopListening();
                return;
            } else {
                if (status && message) {
                    console.log(`Streaming status: ${status} - ${message}`);
                    if (this.onStatus) {
                        this.onStatus(status, message);
                    }
                }

                if (content) {
                    this.fullContent += content;
                    if (this.onChunk) {
                        this.onChunk(content);
                    }
                }
            }
        });
    }

    stopListening(): void {
        if (this.isListening) {
            this.isListening = false;
            if (this.unlistenFn) {
                this.unlistenFn();
                this.unlistenFn = undefined;
                console.log('Streaming event listener removed');
            }
        }
    }

    getFullContent(): string {
        return this.fullContent;
    }
}

export const createStreamingChatHandler = (
    onChunk?: (chunk: string) => void,
    onComplete?: (fullContent: string) => void,
    onError?: (error: string) => void,
    onStatus?: (status: string, message: string) => void
): StreamingChatHandler => {
    return new StreamingChatHandler(onChunk, onComplete, onError, onStatus);
};
