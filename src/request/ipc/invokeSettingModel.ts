import { SettingModel, SettingModelParams, UpdateSettingModelParams } from '@/types/setting';
import { invoke } from '@tauri-apps/api/core';


/**
 * Save setting model
 * @param params Model parameters
 * @returns Saved model ID
 */
export const saveSettingModel = async (params: SettingModelParams): Promise<number> => {
    try {
        const result = await invoke<{ code: number; message: string; data?: number }>('save_setting_model', { params });
        if (result.code === 0 && result.data !== undefined) {
            return result.data;
        } else {
            throw new Error(result.message || 'Failed to save setting model');
        }
    } catch (error) {
        console.error('Failed to save setting model:', error);
        throw error;
    }
};

/**
 * Update setting model
 * @param params Update parameters
 * @returns Number of rows updated
 */
export const updateSettingModel = async (params: UpdateSettingModelParams): Promise<number> => {
    try {
        const result = await invoke<{ code: number; message: string; data?: number }>('update_setting_model', { params });
        if (result.code === 0 && result.data !== undefined) {
            return result.data;
        } else {
            throw new Error(result.message || 'Failed to update setting model');
        }
    } catch (error) {
        console.error('Failed to update setting model:', error);
        throw error;
    }
};

/**
 * Get all setting models
 * @returns List of all setting models
 */
export const getAllSettingModels = async (): Promise<SettingModel[]> => {
    try {
        const result = await invoke<{ code: number; message: string; data?: SettingModel[] }>('get_all_setting_models');
        if (result.code === 0 && result.data !== undefined) {
            return result.data;
        } else {
            throw new Error(result.message || 'Failed to get all setting models');
        }
    } catch (error) {
        console.error('Failed to get all setting models:', error);
        throw error;
    }
};

/**
 * Get enabled setting models
 * @returns List of enabled setting models
 */
export const getEnabledSettingModels = async (): Promise<SettingModel[]> => {
    try {
        const result = await invoke<{ code: number; message: string; data?: SettingModel[] }>('get_enabled_setting_models');
        if (result.code === 0 && result.data !== undefined) {
            return result.data;
        } else {
            throw new Error(result.message || 'Failed to get enabled setting models');
        }
    } catch (error) {
        console.error('Failed to get enabled setting models:', error);
        throw error;
    }
};

/**
 * Toggle setting model enabled status
 * @param id Model ID
 * @returns Number of rows updated
 */
export const toggleSettingModelEnabled = async (id: number): Promise<number> => {
    try {
        const result = await invoke<{ code: number; message: string; data?: number }>('toggle_setting_model_enabled', { id });
        if (result.code === 0 && result.data !== undefined) {
            return result.data;
        } else {
            throw new Error(result.message || 'Failed to toggle setting model enabled');
        }
    } catch (error) {
        console.error('Failed to toggle setting model enabled:', error);
        throw error;
    }
};

/**
 * Delete setting model
 * @param id Model ID
 * @returns Number of rows deleted
 */
export const deleteSettingModel = async (id: number): Promise<number> => {
    try {
        const result = await invoke<{ code: number; message: string; data?: number }>('delete_setting_model', { id });
        if (result.code === 0 && result.data !== undefined) {
            return result.data;
        } else {
            throw new Error(result.message || 'Failed to delete setting model');
        }
    } catch (error) {
        console.error('Failed to delete setting model:', error);
        throw error;
    }
};

/**
 * Ensure only one setting model is enabled
 * @param enabledId Model ID to enable
 * @returns Number of rows updated
 */
export const ensureSingleSettingModelEnabled = async (enabledId: number): Promise<number> => {
    try {
        const result = await invoke<{ code: number; message: string; data?: number }>('ensure_single_setting_model_enabled', { enabledId });
        if (result.code === 0 && result.data !== undefined) {
            return result.data;
        } else {
            throw new Error(result.message || 'Failed to ensure single setting model enabled');
        }
    } catch (error) {
        console.error('Failed to ensure single setting model enabled:', error);
        throw error;
    }
};

/**
 * Convenience method: Toggle model enabled status and ensure only one is enabled
 * @param id Model ID
 * @returns Operation result
 */
export const toggleAndEnsureSingleEnabled = async (id: number): Promise<number> => {
    try {
        // First toggle the enabled status
        await toggleSettingModelEnabled(id);

        // Ensure only one is enabled
        const result = await ensureSingleSettingModelEnabled(id);
        return result;
    } catch (error) {
        console.error('Failed to toggle and ensure single enabled:', error);
        throw error;
    }
};

/**
 * Convenience method: Save model and ensure only one is enabled
 * @param params Model parameters
 * @returns Operation result
 */
export const saveAndEnsureSingleEnabled = async (params: SettingModelParams): Promise<number> => {
    try {
        // First save the model
        const saveResult = await saveSettingModel(params);

        // If the newly saved model is enabled, ensure only one is enabled
        if (params.enabled) {
            const ensureResult = await ensureSingleSettingModelEnabled(saveResult);
            return ensureResult;
        }

        return saveResult;
    } catch (error) {
        console.error('Failed to save and ensure single enabled:', error);
        throw error;
    }
};

/**
 * Convenience method: Get current enabled model
 * @returns Current enabled model, or null if none
 */
export const getCurrentEnabledModel = async (): Promise<SettingModel | null> => {
    try {
        const models = await getEnabledSettingModels();

        // Return the first enabled model (should be only one)
        const enabledModel = models.length > 0 ? models[0] : null;
        return enabledModel;
    } catch (error) {
        console.error('Failed to get current enabled model:', error);
        throw error;
    }
};

/**
 * Convenience method: Check if model exists
 * @param modelKey Model key
 * @returns Whether model exists
 */
export const checkModelExists = async (modelKey: string): Promise<boolean> => {
    try {
        const models = await getAllSettingModels();

        const exists = models.some(model => model.modelKey === modelKey);
        return exists;
    } catch (error) {
        console.error('Failed to check model exists:', error);
        throw error;
    }
};

/**
 * Convenience method: Get model by key
 * @param modelKey Model key
 * @returns Model information
 */
export const getModelByKey = async (modelKey: string): Promise<SettingModel | null> => {
    try {
        const models = await getAllSettingModels();

        const model = models.find(model => model.modelKey === modelKey) || null;
        return model;
    } catch (error) {
        console.error('Failed to get model by key:', error);
        throw error;
    }
};

// Default export all methods
export default {
    saveSettingModel,
    updateSettingModel,
    getAllSettingModels,
    getEnabledSettingModels,
    toggleSettingModelEnabled,
    deleteSettingModel,
    ensureSingleSettingModelEnabled,
    toggleAndEnsureSingleEnabled,
    saveAndEnsureSingleEnabled,
    getCurrentEnabledModel,
    checkModelExists,
    getModelByKey,
}; 