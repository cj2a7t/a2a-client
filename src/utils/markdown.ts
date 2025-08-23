import { toPrettyJsonString } from "./json";

export const toJsonString = (obj: unknown): string => {
    try {
        const jsonString = JSON.stringify(obj, null, 2);
        return `\`\`\`json\n${jsonString}\n\`\`\``;
    } catch {
        return "Failed to stringify JSON";
    }
};

export const toJsonStringWithPrefix = (prefix: string, obj: unknown): string => {
    try {
        const jsonString = toPrettyJsonString(obj);
        return prefix + "\n" + `\`\`\`json\n${jsonString}\n\`\`\``;
    } catch {
        return "Failed to stringify JSON";
    }
};

export const toExtractJsonString = (jsonString: string): string => {
    const jsonMatch = jsonString.match(/{.*}/s);
    if (jsonMatch) {
        const matchStr = jsonMatch[0];
        const jsonPart = toPrettyJsonString(JSON.parse(matchStr));
        return `${jsonString.replace(matchStr, '').trim()} \n\`\`\`json\n${jsonPart}\n\`\`\``;
    }
    return jsonString;
};

export const toXmlStringWithPrefix = (prefix: string, xml: string): string => {
    return prefix + "\n" + `\`\`\`xml\n${xml}\n\`\`\`` + "\n";
};


export const toDetailsMarkdown = (
    prefix: string,
    title: string,
    detail: string,
    obj: unknown
): string => {
    try {
        const jsonString = toPrettyJsonString(obj);
        return `
  ${prefix}
  
  <details>

    <summary>${title}</summary>

    ${detail}

    \`\`\`json
    ${jsonString}\n
    \`\`\`

  </details>
  `.trim();
    } catch {
        return "Failed to stringify JSON";
    }
};

/**
 * 检测内容是否应该渲染为 markdown
 * @param content 要检测的内容
 * @returns 是否应该渲染为 markdown
 */
export const shouldRenderAsMarkdown = (content: string): boolean => {
    // Check if it's a direct model call result
    if (content.includes('✅ Direct model call completed!') ||
        content.includes('📝 Note: This was a direct model call since no agent was configured.')) {
        return true;
    }

    // Check if content contains markdown format
    const markdownPatterns = [
        /^#+\s/,           // Headings
        /\*\*.*\*\*/,      // Bold
        /\*.*\*/,          // Italic
        /`.*`/,            // Inline code
        /```[\s\S]*```/,   // Code blocks
        /\[.*\]\(.*\)/,    // Links
        /^\s*[-*+]\s/,     // Lists
        /^\s*\d+\.\s/,     // Ordered lists
        />\s/,             // Quotes
    ];

    // Enhanced HTML pattern detection for details, summary, and other HTML tags
    const htmlPattern = /<\/?[a-z][\s\S]*>/i;
    const hasHtmlTags = htmlPattern.test(content);

    // Specific check for details/summary tags
    const hasDetailsTags = /<\/?details/i.test(content) || /<\/?summary/i.test(content);

    return markdownPatterns.some(pattern => pattern.test(content)) || hasHtmlTags || hasDetailsTags;
};

