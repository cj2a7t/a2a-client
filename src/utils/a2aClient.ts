import { invokeGetAgentCard, invokeSendA2AMessage } from "@/request/ipc/invoke";
import type {
    AgentCard,
    SendMessageResponse,
} from "@a2a-js/sdk";
import { v4 as uuidv4 } from "uuid";

/**
 * A2A client utility class
 * Wraps official SDK for simplified A2A communication
 */
export class A2AClientUtil {
    private wellKnownUrl: string;

    constructor(wellKnownUrl: string) {
        this.wellKnownUrl = wellKnownUrl;
    }

    /**
     * Get Agent Card information
     * @returns Agent Card data
     */
    async getAgentCard(): Promise<AgentCard> {
        try {
            return await invokeGetAgentCard(this.wellKnownUrl);
        } catch (error) {
            console.error("Failed to get Agent Card:", error);
            throw error;
        }
    }

    /**
     * Send message to A2A server
     * @param text Message text
     * @param a2aUrl A2A send task URL
     * @returns Send response
     */
    async sendMessage(
        text: string,
        a2aUrl: string,
        headerSkillId: string
    ): Promise<SendMessageResponse> {
        const messageId = "msg_id:" + uuidv4();
        const taskId = "task_id:" + uuidv4();
        try {
            return await invokeSendA2AMessage(a2aUrl, taskId, messageId, headerSkillId, text);
        } catch (error) {
            console.error("Failed to send message:", error);
            throw error;
        }
    }

}

/**
 * Create A2A client utility instance
 * @param wellKnownUrl A2A server well-known URL
 * @returns A2AClientUtil instance
 */
export const createA2AClient = (wellKnownUrl: string): A2AClientUtil => {
    return new A2AClientUtil(wellKnownUrl);
};
