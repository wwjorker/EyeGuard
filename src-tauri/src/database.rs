// SQLite schema and helpers for the app-footprint and break log.
//
// The database lives at `<AppData>/com.eyeguard.app/eyeguard.db` and is opened
// from the front-end via `tauri-plugin-sql`. This module exposes Tauri
// commands for actions that benefit from running in Rust, primarily the
// destructive "purge" path and a manual flush for the rolling foreground
// sample.

use std::path::PathBuf;
use tauri::{AppHandle, Manager};

pub const DB_FILENAME: &str = "eyeguard.db";

pub fn db_path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app.path().app_data_dir().map_err(|e| format!("app data dir: {e}"))?;
    std::fs::create_dir_all(&dir).ok();
    Ok(dir.join(DB_FILENAME))
}

/// Schema version baked into the binary. Bumping this triggers a migration
/// on next launch when applied through `tauri-plugin-sql`.
pub const SCHEMA_SQL: &str = include_str!("../sql/schema.sql");

#[tauri::command]
pub fn get_db_path(app: AppHandle) -> Result<String, String> {
    db_path(&app).map(|p| p.to_string_lossy().to_string())
}
