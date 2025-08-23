use std::sync::atomic::AtomicBool;

use crate::{
    db::{init_all_tables, rusqlite::SqlState},
    handler::{
        a2a_server::{
            delete_setting_a2a_server, delete_setting_a2a_server_by_name,
            ensure_single_setting_a2a_server_enabled, get_all_setting_a2a_servers,
            get_enabled_setting_a2a_servers, get_setting_a2a_server_by_id,
            get_setting_a2a_server_by_name, save_setting_a2a_server,
            toggle_setting_a2a_server_enabled, update_setting_a2a_server,
        },
        chat::stream_chat,
        chat_completion, chat_completion_stream, delete_setting_model,
        ensure_single_setting_model_enabled, get_agent_card, get_all_setting_models,
        get_enabled_setting_models, save_setting_model, send_a2a_message,
        toggle_setting_model_enabled, update_setting_model,
    },
    webview::native::window_design,
};
use anyhow::Result;

pub mod db;
pub mod handler;
pub mod model;
pub mod webview;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() -> Result<()> {
    tauri::Builder::default()
        .manage(SqlState(AtomicBool::new(false)))
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            window_design(app)?;
            db::rusqlite::init_db_conn(&app.handle())?;
            
            // Initialize all database tables
            init_all_tables(&app.handle())?;
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            stream_chat,
            chat_completion,
            chat_completion_stream,
            get_agent_card,
            send_a2a_message,
            // Model commands
            save_setting_model,
            update_setting_model,
            get_all_setting_models,
            get_enabled_setting_models,
            toggle_setting_model_enabled,
            delete_setting_model,
            ensure_single_setting_model_enabled,
            // A2A Server commands
            save_setting_a2a_server,
            update_setting_a2a_server,
            get_all_setting_a2a_servers,
            get_enabled_setting_a2a_servers,
            get_setting_a2a_server_by_id,
            get_setting_a2a_server_by_name,
            toggle_setting_a2a_server_enabled,
            delete_setting_a2a_server,
            delete_setting_a2a_server_by_name,
            ensure_single_setting_a2a_server_enabled,
        ])
        .run(tauri::generate_context!())?;

    Ok(())
}
