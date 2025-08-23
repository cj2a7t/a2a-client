pub mod a2a_db;
pub mod model_db;
pub mod rusqlite;

use anyhow::Result;
use tauri::AppHandle;

/// Initialize all database tables
pub fn init_all_tables(handle: &AppHandle) -> Result<()> {
    // Initialize A2A server table
    let a2a_manager = a2a_db::SettingA2AServerDbManager::new();
    a2a_manager.init(handle)?;
    
    // Initialize model table
    let model_manager = model_db::SettingModelDbManager::new();
    model_manager.init(handle)?;
    
    Ok(())
}