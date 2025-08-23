use anyhow::{Context, Result};
use log::{error, info};
use rusqlite::Row;
use tauri::AppHandle;

use crate::model::{SettingModel, SettingModelParams, UpdateSettingModelParams};

pub struct SettingModelDbManager;

impl SettingModelDbManager {
    pub fn new() -> Self {
        Self
    }

    /// Initialize the setting model table
    pub fn init(&self, _handler: &AppHandle) -> Result<()> {
        let db = crate::db::rusqlite::DB
            .lock()
            .map_err(|e| anyhow::anyhow!("failed to acquire DB lock: {e}"))?;

        let sql = "
            CREATE TABLE IF NOT EXISTS tb_setting_model (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                model_key TEXT NOT NULL UNIQUE,
                enabled INTEGER NOT NULL DEFAULT 0,
                api_url TEXT NOT NULL,
                api_key TEXT NOT NULL,
                created_at TEXT DEFAULT (datetime('now')),
                updated_at TEXT DEFAULT (datetime('now'))
            );
            
            CREATE INDEX IF NOT EXISTS idx_setting_model_key ON tb_setting_model (model_key);
            CREATE INDEX IF NOT EXISTS idx_setting_model_enabled ON tb_setting_model (enabled);
        ";

        db.connection
            .execute(sql, [])
            .context("failed to create setting model table")?;

        info!("Setting model table initialized successfully");
        Ok(())
    }

    /// Insert a new setting model
    pub fn insert(&self, params: &SettingModelParams) -> Result<i64> {
        let db = crate::db::rusqlite::DB
            .lock()
            .map_err(|e| anyhow::anyhow!("failed to acquire DB lock: {e}"))?;

        let result = db.connection.execute(
            "INSERT INTO tb_setting_model (model_key, enabled, api_url, api_key)
             VALUES (?1, ?2, ?3, ?4)",
            (
                &params.model_key,
                params.enabled as i32,
                &params.api_url,
                &params.api_key,
            ),
        );

        match result {
            Ok(_) => {
                let id = db.connection.last_insert_rowid();
                info!("Inserted setting model with id: {}", id);
                Ok(id)
            }
            Err(e) => {
                error!("Failed to insert setting model: {}", e);
                Err(e).context("failed to insert setting model")
            }
        }
    }

    /// Update an existing setting model
    pub fn update(&self, params: &UpdateSettingModelParams) -> Result<usize> {
        let db = crate::db::rusqlite::DB
            .lock()
            .map_err(|e| anyhow::anyhow!("failed to acquire DB lock: {e}"))?;

        let mut update_fields = Vec::new();
        let mut values: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

        if let Some(enabled) = params.enabled {
            update_fields.push("enabled = ?");
            values.push(Box::new(enabled as i32));
        }

        if let Some(api_url) = &params.api_url {
            update_fields.push("api_url = ?");
            values.push(Box::new(api_url.clone()));
        }

        if let Some(api_key) = &params.api_key {
            update_fields.push("api_key = ?");
            values.push(Box::new(api_key.clone()));
        }

        if update_fields.is_empty() {
            return Ok(0);
        }

        update_fields.push("updated_at = datetime('now')");
        values.push(Box::new(params.id));

        let sql = format!(
            "UPDATE tb_setting_model SET {} WHERE id = ?",
            update_fields.join(", ")
        );

        let result = db
            .connection
            .execute(&sql, rusqlite::params_from_iter(values.iter()));

        match result {
            Ok(rows_affected) => {
                info!(
                    "Updated setting model with id: {}, rows affected: {}",
                    params.id, rows_affected
                );
                Ok(rows_affected)
            }
            Err(e) => {
                error!("Failed to update setting model: {}", e);
                Err(e).context("failed to update setting model")
            }
        }
    }

    /// Get all setting models
    pub fn get_all(&self) -> Result<Vec<SettingModel>> {
        let db = crate::db::rusqlite::DB
            .lock()
            .map_err(|e| anyhow::anyhow!("failed to acquire DB lock: {e}"))?;

        let mut stmt = db
            .connection
            .prepare("SELECT * FROM tb_setting_model ORDER BY id ASC")
            .context("failed to prepare query")?;

        let rows = stmt
            .query_map([], Self::extract_setting_model_row)
            .context("failed to map query")?;

        let models = rows
            .collect::<rusqlite::Result<Vec<_>>>()
            .context("failed to collect setting models")?;

        Ok(models)
    }

    /// Get a setting model by ID
    pub fn get_by_id(&self, id: i32) -> Result<Option<SettingModel>> {
        let db = crate::db::rusqlite::DB
            .lock()
            .map_err(|e| anyhow::anyhow!("failed to acquire DB lock: {e}"))?;

        let mut stmt = db
            .connection
            .prepare("SELECT * FROM tb_setting_model WHERE id = ?")
            .context("failed to prepare query")?;

        let mut rows = stmt
            .query_map([id], Self::extract_setting_model_row)
            .context("failed to map query")?;

        match rows.next() {
            Some(Ok(model)) => Ok(Some(model)),
            Some(Err(e)) => Err(e).context("failed to get setting model"),
            None => Ok(None),
        }
    }

    /// Get a setting model by model_key
    pub fn get_by_model_key(
        &self,
        model_key: &str,
    ) -> Result<Option<SettingModel>> {
        let db = crate::db::rusqlite::DB
            .lock()
            .map_err(|e| anyhow::anyhow!("failed to acquire DB lock: {e}"))?;

        let mut stmt = db
            .connection
            .prepare("SELECT * FROM tb_setting_model WHERE model_key = ?")
            .context("failed to prepare query")?;

        let mut rows = stmt
            .query_map([model_key], Self::extract_setting_model_row)
            .context("failed to map query")?;

        match rows.next() {
            Some(Ok(model)) => Ok(Some(model)),
            Some(Err(e)) => Err(e).context("failed to get setting model"),
            None => Ok(None),
        }
    }

    /// Get enabled setting models
    pub fn get_enabled(&self) -> Result<Vec<SettingModel>> {
        let db = crate::db::rusqlite::DB
            .lock()
            .map_err(|e| anyhow::anyhow!("failed to acquire DB lock: {e}"))?;

        let mut stmt = db
            .connection
            .prepare("SELECT * FROM tb_setting_model WHERE enabled = 1 ORDER BY id ASC")
            .context("failed to prepare query")?;

        let rows = stmt
            .query_map([], Self::extract_setting_model_row)
            .context("failed to map query")?;

        let models = rows
            .collect::<rusqlite::Result<Vec<_>>>()
            .context("failed to collect enabled setting models")?;

        Ok(models)
    }

    /// Delete a setting model by ID
    pub fn delete_by_id(&self, id: i32) -> Result<usize> {
        let db = crate::db::rusqlite::DB
            .lock()
            .map_err(|e| anyhow::anyhow!("failed to acquire DB lock: {e}"))?;

        let result = db
            .connection
            .execute("DELETE FROM tb_setting_model WHERE id = ?", [id]);

        match result {
            Ok(rows_affected) => {
                info!(
                    "Deleted setting model with id: {}, rows affected: {}",
                    id, rows_affected
                );
                Ok(rows_affected)
            }
            Err(e) => {
                error!("Failed to delete setting model: {}", e);
                Err(e).context("failed to delete setting model")
            }
        }
    }

    /// Delete a setting model by model_key
    pub fn delete_by_model_key(&self, model_key: &str) -> Result<usize> {
        let db = crate::db::rusqlite::DB
            .lock()
            .map_err(|e| anyhow::anyhow!("failed to acquire DB lock: {e}"))?;

        let result = db.connection.execute(
            "DELETE FROM tb_setting_model WHERE model_key = ?",
            [model_key],
        );

        match result {
            Ok(rows_affected) => {
                info!(
                    "Deleted setting model with model_key: {}, rows affected: {}",
                    model_key, rows_affected
                );
                Ok(rows_affected)
            }
            Err(e) => {
                error!("Failed to delete model provider: {}", e);
                Err(e).context("failed to delete model provider")
            }
        }
    }

    /// Toggle the enabled status of a setting model
    pub fn toggle_enabled(&self, id: i32) -> Result<usize> {
        let db = crate::db::rusqlite::DB
            .lock()
            .map_err(|e| anyhow::anyhow!("failed to acquire DB lock: {e}"))?;

        let result = db.connection.execute(
            "UPDATE tb_setting_model SET enabled = CASE WHEN enabled = 1 THEN 0 ELSE 1 END, updated_at = datetime('now') WHERE id = ?",
            [id],
        );

        match result {
            Ok(rows_affected) => {
                info!(
                    "Toggled enabled status for setting model with id: {}, rows affected: {}",
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

    /// Ensure only one model is enabled at a time (disable others when one is enabled)
    pub fn ensure_single_enabled(&self, enabled_id: i32) -> Result<usize> {
        let db = crate::db::rusqlite::DB
            .lock()
            .map_err(|e| anyhow::anyhow!("failed to acquire DB lock: {e}"))?;

        let result = db.connection.execute(
            "UPDATE tb_setting_model SET enabled = 0, updated_at = datetime('now') WHERE id != ?",
            [enabled_id],
        );

        match result {
            Ok(rows_affected) => {
                info!(
                    "Disabled other setting models, rows affected: {}",
                    rows_affected
                );
                Ok(rows_affected)
            }
            Err(e) => {
                error!("Failed to disable other setting models: {}", e);
                Err(e).context("failed to disable other setting models")
            }
        }
    }

    /// Extract setting model from database row
    fn extract_setting_model_row(row: &Row) -> rusqlite::Result<SettingModel> {
        Ok(SettingModel {
            id: Some(row.get(0)?),
            model_key: row.get(1)?,
            enabled: row.get::<_, i32>(2)? != 0,
            api_url: row.get(3)?,
            api_key: row.get(4)?,
        })
    }
}
