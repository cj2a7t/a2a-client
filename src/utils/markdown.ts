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

