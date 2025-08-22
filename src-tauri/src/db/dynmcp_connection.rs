use anyhow::{anyhow, Result};
use tauri::AppHandle;

use crate::{db::rusqlite::DB, model::DyncmcpConnection};

pub fn upsert(apisix_connection: &DyncmcpConnection, handle: &AppHandle) -> Result<i64> {
    let db = DB.lock().map_err(|e| anyhow!("failed to lock DB: {e}"))?;
    let id = db.upsert(apisix_connection, handle)?;
    Ok(id)
}

pub fn query_all(handle: &AppHandle) -> Result<Vec<DyncmcpConnection>> {
    let db = DB.lock().map_err(|e| anyhow!("failed to lock DB: {e}"))?;
    db.query_all(handle)
}
