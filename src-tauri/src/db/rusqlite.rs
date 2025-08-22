use std::{
    fs,
    sync::{atomic::AtomicBool, Arc, Mutex},
};

use anyhow::{Context, Result};
use lazy_static::lazy_static;
use log::{error, info};
use rusqlite::{Connection, Row};
use tauri::{AppHandle, Manager};

use crate::model::DyncmcpConnection;

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

    // 使用桌面目录作为数据库存储位置
    let mut db_dir = handle
        .path()
        .desktop_dir()
        .context("get desktop_dir failed")?;
    
    // 在桌面创建应用专用的数据库目录
    db_dir.push("a2a-client-db");
    if !db_dir.exists() {
        fs::create_dir(&db_dir).context("create db dir failed")?;
    }

    info!("Database directory: {:?}", db_dir);
    info!("Database directory absolute path: {:?}", db_dir.canonicalize().unwrap_or(db_dir.clone()));

    let db_path = db_dir.join("index.db");
    if !db_path.exists() {
        fs::File::create_new(&db_path).context("create index.db failed")?;
    }

    info!("create index file success");
    info!("Database file path: {:?}", db_path);
    info!("Database file absolute path: {:?}", db_path.canonicalize().unwrap_or(db_path.clone()));
    
    // 获取数据库文件的详细信息
    if let Ok(metadata) = fs::metadata(&db_path) {
        info!("Database file size: {} bytes", metadata.len());
        info!("Database file permissions: {:?}", metadata.permissions());
        info!("Database file created: {:?}", metadata.created());
        info!("Database file modified: {:?}", metadata.modified());
    }
    
    // 打印完整的SQLite连接信息
    info!("SQLite database full path: {}", db_path.display());
    if let Ok(canonical_path) = db_path.canonicalize() {
        info!("SQLite database canonical path: {}", canonical_path.display());
    }

    db_manager.connection = Connection::open(&db_path).context("open db connection failed")?;
    
    // 验证连接并打印SQLite版本信息
    if let Ok(version) = db_manager.connection.query_row("SELECT sqlite_version()", [], |row| row.get::<_, String>(0)) {
        info!("SQLite version: {}", version);
    }
    
    info!("SQLite database connection established successfully");

    Ok(())
}

impl DbManager {
    fn init(&self, handler: &AppHandle) -> Result<()> {
        let state = handler.state::<SqlState>();
        if !state.0.load(std::sync::atomic::Ordering::Relaxed) {
            for sql in [
                "CREATE TABLE IF NOT EXISTS tb_dynmcp_connection (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    url TEXT NOT NULL UNIQUE,
                    api_key TEXT NOT NULL,
                    starred INTEGER NOT NULL DEFAULT 0
                );",
                "CREATE INDEX IF NOT EXISTS idx_connection_url ON tb_dynmcp_connection (url);",
            ] {
                self.connection
                    .execute(sql, [])
                    .context("failed to execute init SQL")?;
            }
            state
                .0
                .fetch_and(true, std::sync::atomic::Ordering::Relaxed);
        }
        Ok(())
    }

    pub fn upsert(&self, ac: &DyncmcpConnection, handler: &AppHandle) -> Result<i64> {
        self.init(handler)?;

        // 1. insert or update connection
        if let Err(e) = self.connection.execute(
            "INSERT INTO tb_dynmcp_connection (name, url, api_key, starred)
        VALUES (?1, ?2, ?3, ?4)
        ON CONFLICT(url) DO UPDATE SET
        name = excluded.name,
        api_key = excluded.api_key,
        starred = excluded.starred",
            (&ac.name, &ac.url, &ac.api_key, ac.starred as i32),
        ) {
            error!(
                "Failed to insert or update connection (url: {}): {}",
                &ac.url, e
            );
            return Err(e).context("failed to insert or update connection");
        }

        // 2. query the id of the inserted/updated connection
        match self.connection.query_row(
            "SELECT id FROM tb_dynmcp_connection WHERE url = ?1",
            [&ac.url],
            |row| row.get(0),
        ) {
            Ok(id) => Ok(id),
            Err(e) => {
                error!("Failed to retrieve id for url {}: {}", &ac.url, e);
                Err(e).context("failed to retrieve id after insert/update")
            }
        }
    }

    pub fn query_all(&self, handle: &AppHandle) -> Result<Vec<DyncmcpConnection>> {
        self.init(handle)?;

        let mut stmt = self
            .connection
            .prepare("SELECT * FROM tb_dynmcp_connection ORDER BY id DESC")
            .context("failed to prepare query")?;

        let rows = stmt
            .query_map([], Self::extrace_conns_row)
            .context("failed to map query")?;

        let conns = rows
            .collect::<rusqlite::Result<Vec<_>>>()
            .context("failed to collect connections")?;

        Ok(conns)
    }

    pub fn extrace_conns_row(row: &Row) -> rusqlite::Result<DyncmcpConnection> {
        Ok(DyncmcpConnection {
            id: row.get(0)?,
            name: row.get(1)?,
            url: row.get(2)?,
            api_key: row.get(3)?,
            starred: row.get::<_, i32>(4)? != 0,
        })
    }
}
