// App-footprint sampler.
//
// Polls the foreground window every `SAMPLE_INTERVAL_SEC` seconds, merges
// adjacent samples for the same process into a single rolling segment, and
// emits `footprint://segment` events to the front-end. The front-end is
// responsible for inserting the segment into SQLite via the `sql` plugin.

use serde::Serialize;
use std::sync::{
    atomic::{AtomicBool, Ordering},
    Arc, Mutex,
};
use tauri::{AppHandle, Emitter};

const SAMPLE_INTERVAL_SEC: u64 = 5;

#[derive(Debug, Clone, Serialize)]
pub struct WindowSample {
    pub process: String,
    pub title: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct FootprintSegment {
    pub process: String,
    pub title: String,
    pub started_at: i64, // unix seconds
    pub ended_at: i64,
    pub duration_s: i64,
}

#[derive(Default)]
pub struct FootprintState {
    pub enabled: AtomicBool,
    pub current: Mutex<Option<RollingSegment>>,
}

#[derive(Debug, Clone)]
pub struct RollingSegment {
    pub process: String,
    pub title: String,
    pub started_at: i64,
    pub last_seen: i64,
}

impl FootprintState {
    pub fn new(enabled: bool) -> Self {
        Self {
            enabled: AtomicBool::new(enabled),
            current: Mutex::new(None),
        }
    }
}

#[cfg(target_os = "windows")]
fn current_window() -> Option<WindowSample> {
    use windows::Win32::Foundation::{CloseHandle, HWND, MAX_PATH};
    use windows::Win32::System::ProcessStatus::GetModuleBaseNameW;
    use windows::Win32::System::Threading::{
        OpenProcess, PROCESS_QUERY_LIMITED_INFORMATION, PROCESS_VM_READ,
    };
    use windows::Win32::UI::WindowsAndMessaging::{
        GetForegroundWindow, GetWindowTextLengthW, GetWindowTextW, GetWindowThreadProcessId,
    };

    unsafe {
        let hwnd: HWND = GetForegroundWindow();
        if hwnd.0 == 0 {
            return None;
        }

        let mut pid: u32 = 0;
        GetWindowThreadProcessId(hwnd, Some(&mut pid));
        if pid == 0 {
            return None;
        }

        // Window title
        let len = GetWindowTextLengthW(hwnd);
        let title = if len > 0 {
            let mut buf = vec![0u16; (len as usize) + 1];
            let n = GetWindowTextW(hwnd, &mut buf);
            String::from_utf16_lossy(&buf[..n as usize])
        } else {
            String::new()
        };

        // Process name. If we can't open the handle (elevated process,
        // protected process, or it exited), fall back to a stable
        // "unknown" label so the stats don't fill with random pid: rows.
        let mut process_name = String::from("unknown");
        if let Ok(handle) = OpenProcess(
            PROCESS_QUERY_LIMITED_INFORMATION | PROCESS_VM_READ,
            false,
            pid,
        ) {
            let mut name_buf = [0u16; MAX_PATH as usize];
            let n = GetModuleBaseNameW(handle, None, &mut name_buf);
            if n > 0 {
                process_name = String::from_utf16_lossy(&name_buf[..n as usize]);
            }
            let _ = CloseHandle(handle);
        }

        Some(WindowSample {
            process: process_name,
            title,
        })
    }
}

#[cfg(not(target_os = "windows"))]
fn current_window() -> Option<WindowSample> {
    None
}

fn now_unix() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0)
}

pub fn spawn(app: AppHandle, state: Arc<FootprintState>) {
    std::thread::spawn(move || loop {
        std::thread::sleep(std::time::Duration::from_secs(SAMPLE_INTERVAL_SEC));

        if !state.enabled.load(Ordering::Relaxed) {
            // Flush any in-flight segment when tracking gets disabled.
            if let Some(seg) = take_segment(&state) {
                let _ = app.emit("footprint://segment", seg);
            }
            continue;
        }

        let Some(sample) = current_window() else {
            continue;
        };
        let now = now_unix();

        let mut current = state.current.lock().expect("footprint mutex poisoned");
        let mut emit: Option<FootprintSegment> = None;

        match current.as_mut() {
            Some(seg) if seg.process == sample.process => {
                seg.last_seen = now;
                seg.title = sample.title;
            }
            Some(seg) => {
                emit = Some(FootprintSegment {
                    process: seg.process.clone(),
                    title: seg.title.clone(),
                    started_at: seg.started_at,
                    ended_at: seg.last_seen,
                    duration_s: (seg.last_seen - seg.started_at).max(SAMPLE_INTERVAL_SEC as i64),
                });
                *seg = RollingSegment {
                    process: sample.process,
                    title: sample.title,
                    started_at: now,
                    last_seen: now,
                };
            }
            None => {
                *current = Some(RollingSegment {
                    process: sample.process,
                    title: sample.title,
                    started_at: now,
                    last_seen: now,
                });
            }
        }
        drop(current);

        if let Some(seg) = emit {
            let _ = app.emit("footprint://segment", seg);
        }
    });
}

fn take_segment(state: &FootprintState) -> Option<FootprintSegment> {
    let mut current = state.current.lock().ok()?;
    let seg = current.take()?;
    Some(FootprintSegment {
        process: seg.process,
        title: seg.title,
        started_at: seg.started_at,
        ended_at: seg.last_seen,
        duration_s: (seg.last_seen - seg.started_at).max(SAMPLE_INTERVAL_SEC as i64),
    })
}

#[tauri::command]
pub fn set_footprint_enabled(state: tauri::State<'_, Arc<FootprintState>>, enabled: bool) {
    state.enabled.store(enabled, Ordering::Relaxed);
}

#[tauri::command]
pub fn flush_footprint(
    app: AppHandle,
    state: tauri::State<'_, Arc<FootprintState>>,
) -> Option<FootprintSegment> {
    let seg = take_segment(&state)?;
    let _ = app.emit("footprint://segment", seg.clone());
    Some(seg)
}
