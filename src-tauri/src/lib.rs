mod database;
mod footprint;
mod fullscreen;
mod monitor;
mod tray;

use std::sync::Arc;
use tauri::Manager;
use tauri_plugin_sql::{Migration, MigrationKind};

use footprint::FootprintState;
use monitor::MonitorState;

#[tauri::command]
fn ping() -> &'static str {
    "pong"
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let monitor_state = Arc::new(MonitorState::new());
    let footprint_state = Arc::new(FootprintState::new(true));

    let migrations = vec![Migration {
        version: 1,
        description: "create core tables",
        sql: database::SCHEMA_SQL,
        kind: MigrationKind::Up,
    }];

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_autostart::Builder::new().build())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations(&format!("sqlite:{}", database::DB_FILENAME), migrations)
                .build(),
        )
        .manage(monitor_state.clone())
        .manage(footprint_state.clone())
        .setup(move |app| {
            tray::init_tray(app.handle())?;
            monitor::spawn(app.handle().clone(), monitor_state.clone());
            footprint::spawn(app.handle().clone(), footprint_state.clone());
            if let Some(win) = app.get_webview_window("main") {
                let _ = win.show();
                let _ = win.set_focus();
            }
            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                if window.label() == "main" {
                    api.prevent_close();
                    let _ = window.hide();
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            ping,
            monitor::set_idle_threshold,
            monitor::current_idle_seconds,
            footprint::set_footprint_enabled,
            footprint::flush_footprint,
            fullscreen::check_fullscreen,
            fullscreen::current_foreground,
            database::get_db_path,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
