export const toPrettyJsonString = (obj: unknown): string => {
    try {
        return JSON.stringify(obj, null, 4);
    } catch {
        return "Failed to stringify JSON";
    }
};

/**
 * Clean raw response string, remove possible Markdown wrapping
 * 
 * @param rawInput Raw response string
 * @returns Cleaned JSON string
 */
export const cleanRawJson = (rawInput: string): string => {
    if (!rawInput) return '';

    // Remove possible Markdown code block markers
    let cleaned = rawInput.trim();

    // Remove ```json and ``` wrapping
    if (cleaned.startsWith('```json')) {
        cleaned = cleaned.substring(7);
    } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.substring(3);
    }

    if (cleaned.endsWith('```')) {
        cleaned = cleaned.substring(0, cleaned.length - 3);
    }

    return cleaned.trim();
};

/**
 * Clean raw response (may have Markdown wrapping) and deserialize to Map.
 *
 * @param rawInput Raw response string
 * @return Map<string, any>
 * @throws Error if parsing fails
 */
export const parseToMap = (rawInput: string): Record<string, any> => {
    try {
        const json = cleanRawJson(rawInput);
        return JSON.parse(json);
    } catch (error) {
        throw new Error(`Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};
