use std::{
    fs,
    sync::{Arc, Mutex, atomic::AtomicBool},
};

use anyhow::{Context, Result};
use lazy_static::lazy_static;
use log::info;
use rusqlite::Connection;
use tauri::{AppHandle, Manager};

#[derive(Debug)]
pub struct DbManager {
    pub name: String,
    pub connection: Connection,
}

#[derive(Default)]
pub struct SqlState(pub AtomicBool);

unsafe impl Sync for DbManager {}

lazy_static! {
    pub static ref DB: Arc<Mutex<DbManager>> = Arc::new(Mutex::new(DbManager::default()));
}

impl Default for DbManager {
    fn default() -> Self {
        let connect = Connection::open_in_memory().expect("in-memory db open failure");

        Self {
            name: Default::default(),
            connection: connect,
        }
    }
}

pub fn init_db_conn(handle: &AppHandle) -> Result<()> {
    let mut db_manager = DB
        .lock()
        .map_err(|e| anyhow::anyhow!("failed to acquire DB lock: {e}"))?;

    let mut db_dir = handle
        .path()
        .desktop_dir()
        .context("get desktop_dir failed")?;

    db_dir.push("a2a-client-db");
    if !db_dir.exists() {
        fs::create_dir(&db_dir).context("create db dir failed")?;
    }

    info!("Database directory: {:?}", db_dir);
    info!(
        "Database directory absolute path: {:?}",
        db_dir.canonicalize().unwrap_or(db_dir.clone())
    );

    let db_path = db_dir.join("index.db");
    if !db_path.exists() {
        fs::File::create_new(&db_path).context("create index.db failed")?;
    }

    info!("create index file success");
    info!("Database file path: {:?}", db_path);
    info!(
        "Database file absolute path: {:?}",
        db_path.canonicalize().unwrap_or(db_path.clone())
    );

    if let Ok(metadata) = fs::metadata(&db_path) {
        info!("Database file size: {} bytes", metadata.len());
        info!("Database file permissions: {:?}", metadata.permissions());
        info!("Database file created: {:?}", metadata.created());
        info!("Database file modified: {:?}", metadata.modified());
    }

    info!("SQLite database full path: {}", db_path.display());
    if let Ok(canonical_path) = db_path.canonicalize() {
        info!(
            "SQLite database canonical path: {}",
            canonical_path.display()
        );
    }

    db_manager.connection = Connection::open(&db_path).context("open db connection failed")?;

    if let Ok(version) = db_manager
        .connection
        .query_row("SELECT sqlite_version()", [], |row| row.get::<_, String>(0))
    {
        info!("SQLite version: {}", version);
    }

    info!("SQLite database connection established successfully");

    Ok(())
}
