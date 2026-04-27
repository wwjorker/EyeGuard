// Activity / idle monitor.
//
// Uses Win32 `GetLastInputInfo` to determine system-wide idle time without
// installing a global keyboard hook. A background tokio task polls every
// second and emits Tauri events when the idle state crosses the threshold.

use std::sync::{
    atomic::{AtomicBool, AtomicU64, Ordering},
    Arc,
};
use tauri::{AppHandle, Emitter};

/// Default idle threshold (seconds) until we treat the user as away.
pub const DEFAULT_IDLE_THRESHOLD_SEC: u64 = 5 * 60;

#[derive(Default)]
pub struct MonitorState {
    pub threshold_sec: AtomicU64,
    pub is_idle: AtomicBool,
}

impl MonitorState {
    pub fn new() -> Self {
        Self {
            threshold_sec: AtomicU64::new(DEFAULT_IDLE_THRESHOLD_SEC),
            is_idle: AtomicBool::new(false),
        }
    }
}

#[cfg(target_os = "windows")]
fn system_idle_seconds() -> u64 {
    use windows::Win32::UI::Input::KeyboardAndMouse::{GetLastInputInfo, LASTINPUTINFO};
    use windows::Win32::System::SystemInformation::GetTickCount;

    let mut info = LASTINPUTINFO {
        cbSize: std::mem::size_of::<LASTINPUTINFO>() as u32,
        dwTime: 0,
    };
    unsafe {
        if GetLastInputInfo(&mut info).as_bool() {
            let now = GetTickCount();
            let delta_ms = now.saturating_sub(info.dwTime);
            return (delta_ms / 1000) as u64;
        }
    }
    0
}

#[cfg(not(target_os = "windows"))]
fn system_idle_seconds() -> u64 {
    // TODO: implement equivalents for macOS / Linux.
    0
}

pub fn spawn(app: AppHandle, state: Arc<MonitorState>) {
    std::thread::spawn(move || loop {
        let idle = system_idle_seconds();
        let threshold = state.threshold_sec.load(Ordering::Relaxed);
        let was_idle = state.is_idle.load(Ordering::Relaxed);
        let now_idle = idle >= threshold;

        if now_idle != was_idle {
            state.is_idle.store(now_idle, Ordering::Relaxed);
            let event = if now_idle {
                "activity://idle"
            } else {
                "activity://active"
            };
            let _ = app.emit(event, idle);
        } else {
            // also broadcast a heartbeat with the current idle seconds for UI use
            let _ = app.emit("activity://heartbeat", idle);
        }

        std::thread::sleep(std::time::Duration::from_secs(1));
    });
}

#[tauri::command]
pub fn set_idle_threshold(state: tauri::State<'_, Arc<MonitorState>>, seconds: u64) {
    let clamped = seconds.clamp(30, 60 * 60);
    state.threshold_sec.store(clamped, Ordering::Relaxed);
}

#[tauri::command]
pub fn current_idle_seconds() -> u64 {
    system_idle_seconds()
}
