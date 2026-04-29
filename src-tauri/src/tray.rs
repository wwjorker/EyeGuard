use std::sync::Mutex;
use tauri::{
    menu::{Menu, MenuEvent, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Manager,
};

/// Holds the menu items so we can mutate their text when the user
/// changes the UI language. Wrapped in a Mutex because Tauri's command
/// handlers run on a background thread.
pub struct TrayItems {
    pub pause_resume: MenuItem<tauri::Wry>,
    pub break_now: MenuItem<tauri::Wry>,
    pub settings: MenuItem<tauri::Wry>,
    pub quit: MenuItem<tauri::Wry>,
}

pub struct TrayState(pub Mutex<Option<TrayItems>>);

pub fn init_tray(app: &AppHandle) -> tauri::Result<()> {
    let pause_resume = MenuItem::with_id(app, "tray-pause", "Pause / Resume", true, None::<&str>)?;
    let break_now = MenuItem::with_id(app, "tray-break", "Break Now", true, None::<&str>)?;
    let settings = MenuItem::with_id(app, "tray-settings", "Settings", true, None::<&str>)?;
    let separator = PredefinedMenuItem::separator(app)?;
    let quit = MenuItem::with_id(app, "tray-quit", "Quit EyeGuard", true, None::<&str>)?;

    let menu = Menu::with_items(
        app,
        &[&pause_resume, &break_now, &settings, &separator, &quit],
    )?;

    let icon = app
        .default_window_icon()
        .cloned()
        .ok_or_else(|| tauri::Error::AssetNotFound("default window icon".into()))?;

    TrayIconBuilder::with_id("main-tray")
        .tooltip("EyeGuard")
        .icon(icon)
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event: MenuEvent| match event.id.as_ref() {
            "tray-pause" => {
                let _ = app.emit("tray://pause-toggle", ());
            }
            "tray-break" => {
                let _ = app.emit("tray://break-now", ());
            }
            "tray-settings" => {
                show_main(app, Some("settings"));
            }
            "tray-quit" => {
                app.exit(0);
            }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                show_main(tray.app_handle(), None);
            }
        })
        .build(app)?;

    let items = TrayItems {
        pause_resume,
        break_now,
        settings,
        quit,
    };
    app.manage(TrayState(Mutex::new(Some(items))));

    Ok(())
}

fn show_main(app: &AppHandle, page: Option<&str>) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
        if let Some(p) = page {
            let _ = app.emit("nav://goto", p.to_string());
        }
    }
}

/// JS → Rust: push translated labels into the tray menu so it can follow
/// the in-app language setting. Each call rewrites the item text in place;
/// the menu IDs and ordering stay constant.
#[tauri::command]
pub fn update_tray_labels(
    state: tauri::State<'_, TrayState>,
    pause_resume: String,
    break_now: String,
    settings: String,
    quit: String,
    tooltip: Option<String>,
    app: AppHandle,
) -> Result<(), String> {
    let guard = state.0.lock().map_err(|e| e.to_string())?;
    let items = guard.as_ref().ok_or("tray not yet initialised")?;

    items.pause_resume.set_text(&pause_resume).map_err(|e| e.to_string())?;
    items.break_now.set_text(&break_now).map_err(|e| e.to_string())?;
    items.settings.set_text(&settings).map_err(|e| e.to_string())?;
    items.quit.set_text(&quit).map_err(|e| e.to_string())?;

    if let Some(tt) = tooltip {
        if let Some(tray) = app.tray_by_id("main-tray") {
            let _ = tray.set_tooltip(Some(tt));
        }
    }
    Ok(())
}
