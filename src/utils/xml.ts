import { SettingA2AServer } from '@/types/a2a';
import { AgentCard } from '@a2a-js/sdk';
import xmlFormatter from 'xml-formatter';


export class XmlUtils {
    private static readonly RETURN_JSON = '{"skillId": "$skill_id","skillName": "$skill_name","skillDescription": "$skill_description","agentUrl": "$agent_url","agentName": "$agent_name","userPrompts": "$user_prompts"}';

    /**
     * Build A2A servers XML document from SettingA2AServer array
     * 
     * @example
     * ```typescript
     * const a2aServers: SettingA2AServer[] = [
     *   { name: "Local Server", agentCardUrl: "http://localhost:8080", enabled: true },
     *   { name: "Production Server", agentCardUrl: "https://prod.example.com", enabled: true }
     * ];
     * 
     * const xml = XmlUtils.buildA2AServersXml(a2aServers);
     * // Output: formatted XML with system_prompt and skills structure
     * ```
     */
    public static buildA2AServersXml(a2aServers: SettingA2AServer[]): string {
        try {
            const doc = document.implementation.createDocument(null, 'system_prompt', null);
            const root = doc.documentElement;


            const skillsElement = doc.createElement('skills');

            for (const server of a2aServers) {

                if (!server.enabled) {
                    continue;
                }

                const agentCard = JSON.parse(server.agentCardJson || '{}') as AgentCard;
                const agentCardSkills = agentCard.skills;
                for (const skill of agentCardSkills) {
                    const skillElement = doc.createElement('skill');

                    const idElement = doc.createElement('id');
                    idElement.textContent = skill.id;

                    const nameElement = doc.createElement('name');
                    nameElement.textContent = skill.name;

                    const descriptionElement = doc.createElement('description');
                    descriptionElement.textContent = skill.description;

                    const agentUrlElement = doc.createElement('agent_url');
                    agentUrlElement.textContent = agentCard.url;

                    const agentNameElement = doc.createElement('agent_name');
                    agentNameElement.textContent = agentCard.url;

                    const responseJsonElement = doc.createElement('response_json');
                    const responseJson = XmlUtils.RETURN_JSON
                        .replace('$skill_id', skill.id)
                        .replace('$skill_name', skill.name)
                        .replace('$skill_description', skill.description)
                        .replace('$agent_url', agentCard.url)
                        .replace('$agent_name', agentCard.name);
                    responseJsonElement.textContent = responseJson;

                    skillElement.appendChild(idElement);
                    skillElement.appendChild(nameElement);
                    skillElement.appendChild(descriptionElement);
                    skillElement.appendChild(agentUrlElement);
                    skillElement.appendChild(agentNameElement);
                    skillElement.appendChild(responseJsonElement);

                    skillsElement.appendChild(skillElement);
                }
            }
            root.appendChild(skillsElement);
            return XmlUtils.formatXml(doc);
        } catch (error) {
            throw new Error(`Failed to build A2A servers XML: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private static formatXml(doc: Document): string {
        try {
            const serializer = new XMLSerializer();
            const xmlString = serializer.serializeToString(doc);

            // Use professional xml-formatter library to format XML
            return xmlFormatter(xmlString, {
                indentation: '  ', // Use 2 spaces for indentation
                collapseContent: false, // Don't collapse content
                lineSeparator: '\n' // Use newline as separator
            });
        } catch (error) {
            // If formatting fails, return the original XML string
            const serializer = new XMLSerializer();
            return serializer.serializeToString(doc);
        }
    }

} 