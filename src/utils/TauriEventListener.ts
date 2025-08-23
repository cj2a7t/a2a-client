import { listen, UnlistenFn } from '@tauri-apps/api/event';

export interface StreamChunk {
    content: string;
    is_complete: boolean;
    error?: string;
    status?: string;
    message?: string;
}

export interface EventCallbacks {
    onChunk?: (chunk: string) => void;
    onComplete?: (fullContent: string) => void;
    onError?: (error: string) => void;
    onStatus?: (status: string, message: string) => void;
}

export type EventType =
    | 'chat_stream_chunk'
    | 'a2a_stream_chunk';

class TauriEventListener {
    private static instance: TauriEventListener;
    private listeners: Map<EventType, {
        isListening: boolean;
        unlistenFn?: UnlistenFn;
        callbacks?: EventCallbacks;
        fullContent: string;
        requestId?: string;
    }> = new Map();

    private constructor() { }

    public static getInstance(): TauriEventListener {
        if (!TauriEventListener.instance) {
            TauriEventListener.instance = new TauriEventListener();
        }
        return TauriEventListener.instance;
    }

    /**
     * Start event listening for specific event type
     * @param eventType Type of event to listen for
     * @param callbacks Event callbacks
     * @param requestId Optional request ID for tracking
     */
    public async startListening(
        eventType: EventType,
        callbacks: EventCallbacks,
        requestId?: string
    ): Promise<void> {
        const listener = this.listeners.get(eventType);

        // If already listening, update callbacks
        if (listener?.isListening) {
            listener.callbacks = callbacks;
            listener.requestId = requestId;
            console.log(`Event listener for ${eventType} already active, callbacks updated`);
            return;
        }

        // Initialize new listener
        this.listeners.set(eventType, {
            isListening: true,
            callbacks,
            fullContent: '',
            requestId
        });

        console.log(`Starting Tauri event listener for ${eventType}...`);

        const unlistenFn = await listen<StreamChunk>(eventType, (event) => {
            this.handleStreamEvent(eventType, event.payload);
        });

        this.listeners.get(eventType)!.unlistenFn = unlistenFn;
        console.log(`Tauri event listener for ${eventType} started successfully`);
    }

    /**
     * Update callbacks for specific event type
     * @param eventType Type of event
     * @param callbacks New event callbacks
     */
    public updateCallbacks(eventType: EventType, callbacks: EventCallbacks): void {
        const listener = this.listeners.get(eventType);
        if (listener) {
            listener.callbacks = callbacks;
            console.log(`Event callbacks updated for ${eventType}`);
        } else {
            console.warn(`No active listener found for event type: ${eventType}`);
        }
    }

    /**
     * Stop event listening for specific event type
     * @param eventType Type of event to stop listening for
     */
    public stopListening(eventType: EventType): void {
        const listener = this.listeners.get(eventType);
        if (listener?.isListening && listener.unlistenFn) {
            listener.unlistenFn();
            listener.isListening = false;
            listener.unlistenFn = undefined;
            listener.callbacks = undefined;
            listener.fullContent = '';
            listener.requestId = undefined;
            console.log(`Tauri event listener for ${eventType} stopped`);
        }
    }

    /**
     * Stop all event listeners
     */
    public stopAllListeners(): void {
        for (const [eventType, listener] of this.listeners.entries()) {
            if (listener.isListening && listener.unlistenFn) {
                listener.unlistenFn();
                listener.isListening = false;
                listener.unlistenFn = undefined;
                listener.callbacks = undefined;
                listener.fullContent = '';
                listener.requestId = undefined;
            }
        }
        console.log('All Tauri event listeners stopped');
    }

    /**
     * Handle streaming event for specific event type
     * @param eventType Type of event
     * @param chunk Stream chunk data
     */
    private handleStreamEvent(eventType: EventType, chunk: StreamChunk): void {
        const listener = this.listeners.get(eventType);
        if (!listener?.callbacks) {
            console.warn(`No callbacks found for event type: ${eventType}`);
            return;
        }

        const { content, is_complete, error, status, message } = chunk;

        if (is_complete) {
            if (error) {
                console.error(`Streaming error for ${eventType}:`, error);
                listener.callbacks.onError?.(error);
            } else {
                console.log(`Streaming completed for ${eventType}, content length:`, listener.fullContent.length);
                listener.callbacks.onComplete?.(listener.fullContent);
            }
            this.stopListening(eventType);
            return;
        }

        if (status && message) {
            console.log(`Streaming status for ${eventType}: ${status} - ${message}`);
            listener.callbacks.onStatus?.(status, message);
        }

        if (content) {
            listener.fullContent += content;
            listener.callbacks.onChunk?.(content);
        }
    }

    /**
     * Get current full content for specific event type
     * @param eventType Type of event
     */
    public getFullContent(eventType: EventType): string {
        return this.listeners.get(eventType)?.fullContent || '';
    }

    /**
     * Check if currently listening for specific event type
     * @param eventType Type of event
     */
    public isCurrentlyListening(eventType: EventType): boolean {
        return this.listeners.get(eventType)?.isListening || false;
    }

    /**
     * Get current request ID for specific event type
     * @param eventType Type of event
     */
    public getCurrentRequestId(eventType: EventType): string | undefined {
        return this.listeners.get(eventType)?.requestId;
    }

    /**
     * Get all active event types
     */
    public getActiveEventTypes(): EventType[] {
        return Array.from(this.listeners.entries())
            .filter(([_, listener]) => listener.isListening)
            .map(([eventType, _]) => eventType);
    }
}

// Export singleton instance
export const tauriEventListener = TauriEventListener.getInstance();

// Export convenience functions for chat stream
export const startChatStreamListening = (callbacks: EventCallbacks, requestId?: string) =>
    tauriEventListener.startListening('chat_stream_chunk', callbacks, requestId);

export const stopChatStreamListening = () =>
    tauriEventListener.stopListening('chat_stream_chunk');

export const updateChatStreamCallbacks = (callbacks: EventCallbacks) =>
    tauriEventListener.updateCallbacks('chat_stream_chunk', callbacks);

// Export convenience functions for A2A stream
export const startA2AStreamListening = (callbacks: EventCallbacks, requestId?: string) =>
    tauriEventListener.startListening('a2a_stream_chunk', callbacks, requestId);

export const stopA2AStreamListening = () =>
    tauriEventListener.stopListening('a2a_stream_chunk');

export const updateA2AStreamCallbacks = (callbacks: EventCallbacks) =>
    tauriEventListener.updateCallbacks('a2a_stream_chunk', callbacks);
