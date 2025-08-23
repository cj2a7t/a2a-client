use anyhow::{Context, Result};
use log::{error, info};
use rusqlite::Row;
use tauri::AppHandle;

use crate::model::{SettingA2AServer, SettingA2AServerParams, UpdateSettingA2AServerParams};

pub struct SettingA2AServerDbManager;

impl SettingA2AServerDbManager {
    pub fn new() -> Self {
        Self
    }

    /// Initialize the A2A server table
    pub fn init(&self, _handler: &AppHandle) -> Result<()> {
        let db = crate::db::rusqlite::DB
            .lock()
            .map_err(|e| anyhow::anyhow!("failed to acquire DB lock: {e}"))?;

        let sql = "
            CREATE TABLE IF NOT EXISTS tb_setting_a2a_server (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                agent_card_url TEXT NOT NULL,
                agent_card_json TEXT,
                enabled INTEGER NOT NULL DEFAULT 0,
                created_at TEXT DEFAULT (datetime('now')),
                updated_at TEXT DEFAULT (datetime('now'))
            );
            
            CREATE INDEX IF NOT EXISTS idx_setting_a2a_server_name ON tb_setting_a2a_server (name);
            CREATE INDEX IF NOT EXISTS idx_setting_a2a_server_enabled ON tb_setting_a2a_server (enabled);
        ";

        db.connection
            .execute(sql, [])
            .context("failed to create setting A2A server table")?;

        info!("Setting A2A server table initialized successfully");
        Ok(())
    }

    /// Insert a new A2A server
    pub fn insert(&self, params: &SettingA2AServerParams) -> Result<i64> {
        let db = crate::db::rusqlite::DB
            .lock()
            .map_err(|e| anyhow::anyhow!("failed to acquire DB lock: {e}"))?;

        let result = db.connection.execute(
            "INSERT INTO tb_setting_a2a_server (name, agent_card_url, agent_card_json, enabled) VALUES (?1, ?2, ?3, ?4)",
            (
                &params.name,
                &params.agent_card_url,
                &params.agent_card_json,
                params.enabled as i32,
            ),
        );

        match result {
            Ok(_) => {
                let id = db.connection.last_insert_rowid();
                info!("Inserted A2A server with id: {}", id);
                Ok(id)
            }
            Err(e) => {
                error!("Failed to insert A2A server: {}", e);
                Err(e).context("failed to insert A2A server")
            }
        }
    }

    /// Update an existing A2A server
    pub fn update(&self, params: &UpdateSettingA2AServerParams) -> Result<usize> {
        let db = crate::db::rusqlite::DB
            .lock()
            .map_err(|e| anyhow::anyhow!("failed to acquire DB lock: {e}"))?;

        let mut update_fields = Vec::new();
        let mut values: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

        if let Some(name) = &params.name {
            update_fields.push("name = ?");
            values.push(Box::new(name.clone()));
        }

        if let Some(agent_card_url) = &params.agent_card_url {
            update_fields.push("agent_card_url = ?");
            values.push(Box::new(agent_card_url.clone()));
        }

        if let Some(agent_card_json) = &params.agent_card_json {
            update_fields.push("agent_card_json = ?");
            values.push(Box::new(agent_card_json.clone()));
        }

        if let Some(enabled) = params.enabled {
            update_fields.push("enabled = ?");
            values.push(Box::new(enabled as i32));
        }

        if update_fields.is_empty() {
            return Ok(0);
        }

        update_fields.push("updated_at = datetime('now')");
        values.push(Box::new(params.id));

        let sql = format!(
            "UPDATE tb_setting_a2a_server SET {} WHERE id = ?",
            update_fields.join(", ")
        );

        let result = db
            .connection
            .execute(&sql, rusqlite::params_from_iter(values.iter()));

        match result {
            Ok(rows_affected) => {
                info!(
                    "Updated A2A server with id: {}, rows affected: {}",
                    params.id, rows_affected
                );
                Ok(rows_affected)
            }
            Err(e) => {
                error!("Failed to update A2A server: {}", e);
                Err(e).context("failed to update A2A server")
            }
        }
    }

    /// Get all A2A servers
    pub fn get_all(&self) -> Result<Vec<SettingA2AServer>> {
        let db = crate::db::rusqlite::DB
            .lock()
            .map_err(|e| anyhow::anyhow!("failed to acquire DB lock: {e}"))?;

        let mut stmt = db
            .connection
            .prepare("SELECT * FROM tb_setting_a2a_server ORDER BY id ASC")
            .context("failed to prepare query")?;

        let rows = stmt
            .query_map([], Self::extract_a2a_server_row)
            .context("failed to map query")?;

        let servers = rows
            .collect::<rusqlite::Result<Vec<_>>>()
            .context("failed to collect A2A servers")?;

        Ok(servers)
    }

    /// Get an A2A server by ID
    pub fn get_by_id(&self, id: i32) -> Result<Option<SettingA2AServer>> {
        let db = crate::db::rusqlite::DB
            .lock()
            .map_err(|e| anyhow::anyhow!("failed to acquire DB lock: {e}"))?;

        let mut stmt = db
            .connection
            .prepare("SELECT * FROM tb_setting_a2a_server WHERE id = ?")
            .context("failed to prepare query")?;

        let mut rows = stmt
            .query_map([id], Self::extract_a2a_server_row)
            .context("failed to map query")?;

        match rows.next() {
            Some(Ok(server)) => Ok(Some(server)),
            Some(Err(e)) => Err(e).context("failed to get A2A server"),
            None => Ok(None),
        }
    }

    /// Get an A2A server by name
    pub fn get_by_name(&self, name: &str) -> Result<Option<SettingA2AServer>> {
        let db = crate::db::rusqlite::DB
            .lock()
            .map_err(|e| anyhow::anyhow!("failed to acquire DB lock: {e}"))?;

        let mut stmt = db
            .connection
            .prepare("SELECT * FROM tb_setting_a2a_server WHERE name = ?")
            .context("failed to prepare query")?;

        let mut rows = stmt
            .query_map([name], Self::extract_a2a_server_row)
            .context("failed to map query")?;

        match rows.next() {
            Some(Ok(server)) => Ok(Some(server)),
            Some(Err(e)) => Err(e).context("failed to get A2A server"),
            None => Ok(None),
        }
    }

    /// Get enabled A2A servers
    pub fn get_enabled(&self) -> Result<Vec<SettingA2AServer>> {
        let db = crate::db::rusqlite::DB
            .lock()
            .map_err(|e| anyhow::anyhow!("failed to acquire DB lock: {e}"))?;

        let mut stmt = db
            .connection
            .prepare("SELECT * FROM tb_setting_a2a_server WHERE enabled = 1 ORDER BY id ASC")
            .context("failed to prepare query")?;

        let rows = stmt
            .query_map([], Self::extract_a2a_server_row)
            .context("failed to map query")?;

        let servers = rows
            .collect::<rusqlite::Result<Vec<_>>>()
            .context("failed to collect enabled A2A servers")?;

        Ok(servers)
    }

    /// Delete an A2A server by ID
    pub fn delete_by_id(&self, id: i32) -> Result<usize> {
        let db = crate::db::rusqlite::DB
            .lock()
            .map_err(|e| anyhow::anyhow!("failed to acquire DB lock: {e}"))?;

        let result = db
            .connection
            .execute("DELETE FROM tb_setting_a2a_server WHERE id = ?", [id]);

        match result {
            Ok(rows_affected) => {
                info!(
                    "Deleted A2A server with id: {}, rows affected: {}",
                    id, rows_affected
                );
                Ok(rows_affected)
            }
            Err(e) => {
                error!("Failed to delete A2A server: {}", e);
                Err(e).context("failed to delete A2A server")
            }
        }
    }

    /// Delete an A2A server by name
    pub fn delete_by_name(&self, name: &str) -> Result<usize> {
        let db = crate::db::rusqlite::DB
            .lock()
            .map_err(|e| anyhow::anyhow!("failed to acquire DB lock: {e}"))?;

        let result = db
            .connection
            .execute("DELETE FROM tb_setting_a2a_server WHERE name = ?", [name]);

        match result {
            Ok(rows_affected) => {
                info!(
                    "Deleted A2A server with name: {}, rows affected: {}",
                    name, rows_affected
                );
                Ok(rows_affected)
            }
            Err(e) => {
                error!("Failed to delete A2A server: {}", e);
                Err(e).context("failed to delete A2A server")
            }
        }
    }

    /// Toggle the enabled status of an A2A server
    pub fn toggle_enabled(&self, id: i32) -> Result<usize> {
        let db = crate::db::rusqlite::DB
            .lock()
            .map_err(|e| anyhow::anyhow!("failed to acquire DB lock: {e}"))?;

        let result = db.connection.execute(
            "UPDATE tb_setting_a2a_server SET enabled = CASE WHEN enabled = 1 THEN 0 ELSE 1 END, updated_at = datetime('now') WHERE id = ?",
            [id],
        );

        match result {
            Ok(rows_affected) => {
                info!(
                    "Toggled enabled status for A2A server with id: {}, rows affected: {}",
                    id, rows_affected
                );
                Ok(rows_affected)
            }
            Err(e) => {
                error!("Failed to toggle enabled status: {}", e);
                Err(e).context("failed to toggle enabled status")
            }
        }
    }

    /// Ensure only one A2A server is enabled at a time (disable others when one is enabled)
    pub fn ensure_single_enabled(&self, enabled_id: i32) -> Result<usize> {
        let db = crate::db::rusqlite::DB
            .lock()
            .map_err(|e| anyhow::anyhow!("failed to acquire DB lock: {e}"))?;

        let result = db.connection.execute(
            "UPDATE tb_setting_a2a_server SET enabled = 0, updated_at = datetime('now') WHERE id != ?",
            [enabled_id],
        );

        match result {
            Ok(rows_affected) => {
                info!(
                    "Disabled other A2A servers, rows affected: {}",
                    rows_affected
                );
                Ok(rows_affected)
            }
            Err(e) => {
                error!("Failed to disable other A2A servers: {}", e);
                Err(e).context("failed to disable other A2A servers")
            }
        }
    }

    /// Extract A2A server from database row
    fn extract_a2a_server_row(row: &Row) -> rusqlite::Result<SettingA2AServer> {
        Ok(SettingA2AServer {
            id: Some(row.get(0)?),
            name: row.get(1)?,
            agent_card_url: row.get(2)?,
            agent_card_json: row.get(3)?,
            enabled: row.get::<_, i32>(4)? != 0,
            created_at: row.get(5)?,
            updated_at: row.get(6)?,
        })
    }
}
