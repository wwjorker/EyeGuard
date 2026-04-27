mod monitor;
mod tray;

use std::sync::Arc;
use tauri::Manager;

use monitor::MonitorState;

#[tauri::command]
fn ping() -> &'static str {
    "pong"
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let monitor_state = Arc::new(MonitorState::new());

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_autostart::Builder::new().build())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .manage(monitor_state.clone())
        .setup(move |app| {
            tray::init_tray(app.handle())?;
            monitor::spawn(app.handle().clone(), monitor_state.clone());
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
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
