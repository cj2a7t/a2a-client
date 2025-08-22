import { SettingA2AServer, SettingA2AServerParams, UpdateSettingA2AServerParams } from '@/types/a2a';
import { invoke } from '@tauri-apps/api/core';

/**
 * Save A2A server
 * @param params Server parameters
 * @returns Saved server ID
 */
export const saveSettingA2AServer = async (params: SettingA2AServerParams): Promise<number> => {
    try {
        // Get agent card and fill agentCardJson if agentCardUrl is provided
        const updatedParams = { ...params };
        if (params.agentCardUrl && params.agentCardUrl.trim().length > 0) {
            try {
                const agentCardResult = await invoke<{ code: number; message: string; data?: any }>('get_agent_card', {
                    params: { url: params.agentCardUrl }
                });
                if (agentCardResult.code === 0 && agentCardResult.data) {
                    updatedParams.agentCardJson = JSON.stringify(agentCardResult.data);
                    updatedParams.name = agentCardResult.data.name;
                } else {
                    throw new Error(agentCardResult.message || 'Failed to get agent card');
                }
            } catch (error) {
                console.error('Failed to get agent card:', error);
                throw error;
            }
        }

        const result = await invoke<{ code: number; message: string; data?: number }>('save_setting_a2a_server', { params: updatedParams });
        if (result.code === 0 && result.data !== undefined) {
            return result.data;
        } else {
            throw new Error(result.message || 'Failed to save A2A server');
        }
    } catch (error) {
        console.error('Failed to save A2A server:', error);
        throw error;
    }
};

/**
 * Update A2A server
 * @param params Update parameters
 * @returns Number of rows updated
 */
export const updateSettingA2AServer = async (params: UpdateSettingA2AServerParams): Promise<number> => {
    try {
        // Get agent card and fill agentCardJson if agentCardUrl is provided
        const updatedParams = { ...params };
        if (params.agentCardUrl && params.agentCardUrl.trim().length > 0) {
            try {
                const agentCardResult = await invoke<{ code: number; message: string; data?: any }>('get_agent_card', {
                    params: { url: params.agentCardUrl }
                });
                if (agentCardResult.code === 0 && agentCardResult.data) {
                    updatedParams.agentCardJson = JSON.stringify(agentCardResult.data);
                    updatedParams.name = agentCardResult.data.name;
                } else {
                    throw new Error(agentCardResult.message || 'Failed to get agent card');
                }
            } catch (error) {
                console.error('Failed to get agent card:', error);
                throw error;
            }
        }

        const result = await invoke<{ code: number; message: string; data?: number }>('update_setting_a2a_server', { params: updatedParams });
        if (result.code === 0 && result.data !== undefined) {
            return result.data;
        } else {
            throw new Error(result.message || 'Failed to update A2A server');
        }
    } catch (error) {
        console.error('Failed to update A2A server:', error);
        throw error;
    }
};

/**
 * Get all A2A servers
 * @returns List of all A2A servers
 */
export const getAllSettingA2AServers = async (): Promise<SettingA2AServer[]> => {
    try {
        const result = await invoke<{ code: number; message: string; data?: SettingA2AServer[] }>('get_all_setting_a2a_servers');
        if (result.code === 0 && result.data !== undefined) {
            return result.data;
        } else {
            throw new Error(result.message || 'Failed to get all A2A servers');
        }
    } catch (error) {
        console.error('Failed to get all A2A servers:', error);
        throw error;
    }
};

/**
 * Get enabled A2A servers
 * @returns List of enabled A2A servers
 */
export const getEnabledSettingA2AServers = async (): Promise<SettingA2AServer[]> => {
    try {
        const result = await invoke<{ code: number; message: string; data?: SettingA2AServer[] }>('get_enabled_setting_a2a_servers');
        if (result.code === 0 && result.data !== undefined) {
            return result.data;
        } else {
            throw new Error(result.message || 'Failed to get enabled A2A servers');
        }
    } catch (error) {
        console.error('Failed to get enabled A2A servers:', error);
        throw error;
    }
};

/**
 * Get A2A server by ID
 * @param id Server ID
 * @returns Server information
 */
export const getSettingA2AServerById = async (id: number): Promise<SettingA2AServer | null> => {
    try {
        const result = await invoke<{ code: number; message: string; data?: SettingA2AServer | null }>('get_setting_a2a_server_by_id', { id });
        if (result.code === 0) {
            return result.data || null;
        } else {
            throw new Error(result.message || 'Failed to get A2A server by ID');
        }
    } catch (error) {
        console.error('Failed to get A2A server by ID:', error);
        throw error;
    }
};

/**
 * Get A2A server by name
 * @param name Server name
 * @returns Server information
 */
export const getSettingA2AServerByName = async (name: string): Promise<SettingA2AServer | null> => {
    try {
        const result = await invoke<{ code: number; message: string; data?: SettingA2AServer | null }>('get_setting_a2a_server_by_name', { name });
        if (result.code === 0) {
            return result.data || null;
        } else {
            throw new Error(result.message || 'Failed to get A2A server by name');
        }
    } catch (error) {
        console.error('Failed to get A2A server by name:', error);
        throw error;
    }
};

/**
 * Toggle A2A server enabled status
 * @param id Server ID
 * @returns Number of rows updated
 */
export const toggleSettingA2AServerEnabled = async (id: number): Promise<number> => {
    try {
        const result = await invoke<{ code: number; message: string; data?: number }>('toggle_setting_a2a_server_enabled', { id });
        if (result.code === 0 && result.data !== undefined) {
            return result.data;
        } else {
            throw new Error(result.message || 'Failed to toggle A2A server enabled');
        }
    } catch (error) {
        console.error('Failed to toggle A2A server enabled:', error);
        throw error;
    }
};

/**
 * Delete A2A server
 * @param id Server ID
 * @returns Number of rows deleted
 */
export const deleteSettingA2AServer = async (id: number): Promise<number> => {
    try {
        const result = await invoke<{ code: number; message: string; data?: number }>('delete_setting_a2a_server', { id });
        if (result.code === 0 && result.data !== undefined) {
            return result.data;
        } else {
            throw new Error(result.message || 'Failed to delete A2A server');
        }
    } catch (error) {
        console.error('Failed to delete A2A server:', error);
        throw error;
    }
};

/**
 * Delete A2A server by name
 * @param name Server name
 * @returns Number of rows deleted
 */
export const deleteSettingA2AServerByName = async (name: string): Promise<number> => {
    try {
        const result = await invoke<{ code: number; message: string; data?: number }>('delete_setting_a2a_server_by_name', { name });
        if (result.code === 0 && result.data !== undefined) {
            return result.data;
        } else {
            throw new Error(result.message || 'Failed to delete A2A server by name');
        }
    } catch (error) {
        console.error('Failed to delete A2A server by name:', error);
        throw error;
    }
};

/**
 * Ensure only one A2A server is enabled
 * @param enabledId Server ID to enable
 * @returns Number of rows updated
 */
export const ensureSingleSettingA2AServerEnabled = async (enabledId: number): Promise<number> => {
    try {
        const result = await invoke<{ code: number; message: string; data?: number }>('ensure_single_setting_a2a_server_enabled', { enabledId });
        if (result.code === 0 && result.data !== undefined) {
            return result.data;
        } else {
            throw new Error(result.message || 'Failed to ensure single A2A server enabled');
        }
    } catch (error) {
        console.error('Failed to ensure single A2A server enabled:', error);
        throw error;
    }
};

/**
 * Convenience method: Toggle server enabled status and ensure only one is enabled
 * @param id Server ID
 * @returns Operation result
 */
export const toggleAndEnsureSingleEnabled = async (id: number): Promise<number> => {
    try {
        // First toggle the enabled status
        await toggleSettingA2AServerEnabled(id);

        // Ensure only one is enabled
        const result = await ensureSingleSettingA2AServerEnabled(id);
        return result;
    } catch (error) {
        console.error('Failed to toggle and ensure single enabled:', error);
        throw error;
    }
};

/**
 * Convenience method: Save server and ensure only one is enabled
 * @param params Server parameters
 * @returns Operation result
 */
export const saveAndEnsureSingleEnabled = async (params: SettingA2AServerParams): Promise<number> => {
    try {
        // First save the server
        const saveResult = await saveSettingA2AServer(params);

        // If the newly saved server is enabled, ensure only one is enabled
        if (params.enabled) {
            const ensureResult = await ensureSingleSettingA2AServerEnabled(saveResult);
            return ensureResult;
        }

        return saveResult;
    } catch (error) {
        console.error('Failed to save and ensure single enabled:', error);
        throw error;
    }
};

/**
 * Convenience method: Get current enabled server
 * @returns Current enabled server, or null if none
 */
export const getCurrentEnabledServer = async (): Promise<SettingA2AServer | null> => {
    try {
        const servers = await getEnabledSettingA2AServers();

        // Return the first enabled server (should be only one)
        const enabledServer = servers.length > 0 ? servers[0] : null;
        return enabledServer;
    } catch (error) {
        console.error('Failed to get current enabled server:', error);
        throw error;
    }
};

/**
 * Convenience method: Check if server exists
 * @param name Server name
 * @returns Whether server exists
 */
export const checkServerExists = async (name: string): Promise<boolean> => {
    try {
        const servers = await getAllSettingA2AServers();

        const exists = servers.some(server => server.name === name);
        return exists;
    } catch (error) {
        console.error('Failed to check server exists:', error);
        throw error;
    }
};

/**
 * Convenience method: Get server by name
 * @param name Server name
 * @returns Server information
 */
export const getServerByName = async (name: string): Promise<SettingA2AServer | null> => {
    try {
        const servers = await getAllSettingA2AServers();

        const server = servers.find(server => server.name === name) || null;
        return server;
    } catch (error) {
        console.error('Failed to get server by name:', error);
        throw error;
    }
};

// Default export all methods
export default {
    saveSettingA2AServer,
    updateSettingA2AServer,
    getAllSettingA2AServers,
    getEnabledSettingA2AServers,
    getSettingA2AServerById,
    getSettingA2AServerByName,
    toggleSettingA2AServerEnabled,
    deleteSettingA2AServer,
    deleteSettingA2AServerByName,
    ensureSingleSettingA2AServerEnabled,
    toggleAndEnsureSingleEnabled,
    saveAndEnsureSingleEnabled,
    getCurrentEnabledServer,
    checkServerExists,
    getServerByName,
}; 