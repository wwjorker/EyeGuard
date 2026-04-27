// Detect whether the user is currently in a true fullscreen application
// (game, video, presentation). Returns `true` when the foreground window
// occupies the whole monitor and is *not* the desktop / shell.
//
// Also exposes `current_foreground_process` so the front-end DND whitelist
// can match on process name.

use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub struct ForegroundInfo {
    pub process: String,
    pub title: String,
    pub fullscreen: bool,
}

#[cfg(target_os = "windows")]
pub fn foreground_info() -> Option<ForegroundInfo> {
    use windows::Win32::Foundation::{CloseHandle, HWND, MAX_PATH, RECT};
    use windows::Win32::Graphics::Gdi::{
        GetMonitorInfoW, MonitorFromWindow, MONITORINFO, MONITOR_DEFAULTTONEAREST,
    };
    use windows::Win32::System::ProcessStatus::GetModuleBaseNameW;
    use windows::Win32::System::Threading::{
        OpenProcess, PROCESS_QUERY_LIMITED_INFORMATION, PROCESS_VM_READ,
    };
    use windows::Win32::UI::WindowsAndMessaging::{
        GetClassNameW, GetDesktopWindow, GetForegroundWindow, GetShellWindow, GetWindowRect,
        GetWindowTextLengthW, GetWindowTextW, GetWindowThreadProcessId,
    };

    unsafe {
        let hwnd: HWND = GetForegroundWindow();
        if hwnd.0 == 0 {
            return None;
        }

        // Skip shell + desktop windows when computing fullscreen
        let mut shell_like = hwnd == GetShellWindow() || hwnd == GetDesktopWindow();
        let mut class_buf = [0u16; 64];
        let n = GetClassNameW(hwnd, &mut class_buf);
        if n > 0 {
            let class = String::from_utf16_lossy(&class_buf[..n as usize]);
            if matches!(
                class.as_str(),
                "Progman" | "WorkerW" | "Shell_TrayWnd" | "Button"
            ) {
                shell_like = true;
            }
        }

        // Title
        let len = GetWindowTextLengthW(hwnd);
        let title = if len > 0 {
            let mut buf = vec![0u16; (len as usize) + 1];
            let n = GetWindowTextW(hwnd, &mut buf);
            String::from_utf16_lossy(&buf[..n as usize])
        } else {
            String::new()
        };

        // Process name
        let mut pid: u32 = 0;
        GetWindowThreadProcessId(hwnd, Some(&mut pid));
        let mut process = format!("pid:{}", pid);
        if pid > 0 {
            if let Ok(handle) =
                OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION | PROCESS_VM_READ, false, pid)
            {
                let mut name_buf = [0u16; MAX_PATH as usize];
                let n = GetModuleBaseNameW(handle, None, &mut name_buf);
                if n > 0 {
                    process = String::from_utf16_lossy(&name_buf[..n as usize]);
                }
                let _ = CloseHandle(handle);
            }
        }

        // Fullscreen test
        let mut fullscreen = false;
        if !shell_like {
            let mut win_rect = RECT::default();
            if GetWindowRect(hwnd, &mut win_rect).is_ok() {
                let mon = MonitorFromWindow(hwnd, MONITOR_DEFAULTTONEAREST);
                if mon.0 != 0 {
                    let mut info = MONITORINFO {
                        cbSize: std::mem::size_of::<MONITORINFO>() as u32,
                        ..Default::default()
                    };
                    if GetMonitorInfoW(mon, &mut info).as_bool() {
                        let mr = info.rcMonitor;
                        fullscreen = win_rect.left <= mr.left
                            && win_rect.top <= mr.top
                            && win_rect.right >= mr.right
                            && win_rect.bottom >= mr.bottom;
                    }
                }
            }
        }

        Some(ForegroundInfo {
            process,
            title,
            fullscreen,
        })
    }
}

#[cfg(not(target_os = "windows"))]
pub fn foreground_info() -> Option<ForegroundInfo> {
    None
}

#[tauri::command]
pub fn check_fullscreen() -> bool {
    foreground_info().map(|i| i.fullscreen).unwrap_or(false)
}

#[tauri::command]
pub fn current_foreground() -> Option<ForegroundInfo> {
    foreground_info()
}
