use crate::{
    db::a2a_db::SettingA2AServerDbManager,
    model::{
        InvokeResponse, SettingA2AServer, SettingA2AServerParams, UpdateSettingA2AServerParams,
        to_invoke_response,
    },
};

#[tauri::command]
pub async fn save_setting_a2a_server(params: SettingA2AServerParams) -> InvokeResponse<i64> {
    let db_manager = SettingA2AServerDbManager::new();

    db_manager
        .insert(&params)
        .map(InvokeResponse::success)
        .unwrap_or_else(|e| to_invoke_response(e))
}

#[tauri::command]
pub async fn update_setting_a2a_server(
    params: UpdateSettingA2AServerParams,
) -> InvokeResponse<usize> {
    let db_manager = SettingA2AServerDbManager::new();

    db_manager
        .update(&params)
        .map(InvokeResponse::success)
        .unwrap_or_else(|e| to_invoke_response(e))
}

#[tauri::command]
pub async fn get_all_setting_a2a_servers() -> InvokeResponse<Vec<SettingA2AServer>> {
    let db_manager = SettingA2AServerDbManager::new();

    db_manager
        .get_all()
        .map(InvokeResponse::success)
        .unwrap_or_else(|e| to_invoke_response(e))
}

#[tauri::command]
pub async fn get_enabled_setting_a2a_servers() -> InvokeResponse<Vec<SettingA2AServer>> {
    let db_manager = SettingA2AServerDbManager::new();

    db_manager
        .get_enabled()
        .map(InvokeResponse::success)
        .unwrap_or_else(|e| to_invoke_response(e))
}

#[tauri::command]
pub async fn get_setting_a2a_server_by_id(id: i32) -> InvokeResponse<Option<SettingA2AServer>> {
    let db_manager = SettingA2AServerDbManager::new();

    db_manager
        .get_by_id(id)
        .map(InvokeResponse::success)
        .unwrap_or_else(|e| to_invoke_response(e))
}

#[tauri::command]
pub async fn get_setting_a2a_server_by_name(
    name: String,
) -> InvokeResponse<Option<SettingA2AServer>> {
    let db_manager = SettingA2AServerDbManager::new();

    db_manager
        .get_by_name(&name)
        .map(InvokeResponse::success)
        .unwrap_or_else(|e| to_invoke_response(e))
}

#[tauri::command]
pub async fn toggle_setting_a2a_server_enabled(id: i32) -> InvokeResponse<usize> {
    let db_manager = SettingA2AServerDbManager::new();

    db_manager
        .toggle_enabled(id)
        .map(InvokeResponse::success)
        .unwrap_or_else(|e| to_invoke_response(e))
}

#[tauri::command]
pub async fn delete_setting_a2a_server(id: i32) -> InvokeResponse<usize> {
    let db_manager = SettingA2AServerDbManager::new();

    db_manager
        .delete_by_id(id)
        .map(InvokeResponse::success)
        .unwrap_or_else(|e| to_invoke_response(e))
}

#[tauri::command]
pub async fn delete_setting_a2a_server_by_name(name: String) -> InvokeResponse<usize> {
    let db_manager = SettingA2AServerDbManager::new();

    db_manager
        .delete_by_name(&name)
        .map(InvokeResponse::success)
        .unwrap_or_else(|e| to_invoke_response(e))
}

#[tauri::command]
pub async fn ensure_single_setting_a2a_server_enabled(enabled_id: i32) -> InvokeResponse<usize> {
    let db_manager = SettingA2AServerDbManager::new();

    db_manager
        .ensure_single_enabled(enabled_id)
        .map(InvokeResponse::success)
        .unwrap_or_else(|e| to_invoke_response(e))
}
