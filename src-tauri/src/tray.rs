use tauri::{
    menu::{Menu, MenuEvent, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Manager,
};

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
