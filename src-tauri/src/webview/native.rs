use tauri::{App, AppHandle, LogicalSize, Manager};
use tauri::{WebviewUrl, WebviewWindow, WebviewWindowBuilder};

#[cfg(target_os = "macos")]
pub fn native_windows(window: &WebviewWindow) {
    use cocoa::{
        appkit::{NSWindow, NSWindowToolbarStyle},
        base::id,
    };
    use objc::{class, msg_send, sel, sel_impl};
    let ns_window = window.ns_window().unwrap() as id;

    use window_vibrancy::{apply_vibrancy, NSVisualEffectMaterial};
    apply_vibrancy(window, NSVisualEffectMaterial::Sidebar, None, None)
        .expect("Unsupported platform! 'apply_vibrancy' is only supported on macOS");

    unsafe {
        ns_window.setToolbar_(msg_send![class!(NSToolbar), new]);
        ns_window.setToolbarStyle_(NSWindowToolbarStyle::NSWindowToolbarStyleUnified);
    }
}

pub fn create_splashscreen(app: &AppHandle) -> WebviewWindow {
    let splash_window = WebviewWindowBuilder::new(
        app,
        "splash",
        WebviewUrl::App("splash.html".parse().unwrap()),
    )
    .decorations(false)
    .resizable(false)
    .visible(false)
    .always_on_top(true)
    .title("Loading...")
    .skip_taskbar(true)
    .build()
    .expect("failed to build splash window");

    splash_window
        .set_size(LogicalSize::new(250, 200))
        .expect("failed to set splash size");

    splash_window.center().unwrap();
    
    #[cfg(target_os = "macos")]
    {
        use cocoa::{
            appkit::{NSWindow, NSColor, NSWindowStyleMask},
            base::id,
        };
        use objc::{class, msg_send, sel, sel_impl};

        if let Ok(ns_window) = splash_window.ns_window() {
            let ns_window = ns_window as id;
            unsafe {
                let transparent_color = msg_send![class!(NSColor), clearColor];
                ns_window.setBackgroundColor_(transparent_color);
                ns_window.setOpaque_(false);
                ns_window.setHasShadow_(false);
                let style_mask: NSWindowStyleMask = ns_window.styleMask();
                let full_size_content_view_mask = NSWindowStyleMask::from_bits_truncate(0x00008000u64);
                ns_window.setStyleMask_(style_mask | full_size_content_view_mask);
            }
        }
    }
    #[cfg(target_os = "windows")]
    {
        // Windows platform uses transparent background
        use windows::Win32::UI::WindowsAndMessaging::{GetWindowLongPtrA, SetWindowLongPtrA, GWL_EXSTYLE, WS_EX_LAYERED};
        use windows::Win32::UI::WindowsAndMessaging::{SetLayeredWindowAttributes, LWA_COLORKEY};
        
        if let Some(hwnd) = splash_window.hwnd() {
            unsafe {
                let ex_style = GetWindowLongPtrA(hwnd.0, GWL_EXSTYLE);
                SetWindowLongPtrA(hwnd.0, GWL_EXSTYLE, ex_style | WS_EX_LAYERED as isize);
                SetLayeredWindowAttributes(hwnd.0, 0x00FFFFFF, 255, LWA_COLORKEY);
            }
        }
    }
    
    return splash_window;
}

#[cfg(target_os = "macos")]
pub fn create_main_window(app: &AppHandle) -> WebviewWindow {
    use tauri::LogicalPosition;

    #[cfg(target_os = "macos")]
    let style = tauri::TitleBarStyle::Overlay;

    #[cfg(target_os = "windows")]
    let style = tauri::TitleBarStyle::Visible;

    let main_window = WebviewWindowBuilder::new(
        app,
        "main", // the unique window label
        WebviewUrl::App("/".parse().unwrap()),
    )
    .decorations(true)
    .resizable(true)
    .visible(false) 
    .hidden_title(true)
    .title("A2A Client")
    .title_bar_style(style)
    .traffic_light_position(LogicalPosition::new(12.0, 28.0))
    .build()
    .expect("failed to build window");

    main_window
        .set_size(LogicalSize::new(1280, 800))
        .expect("failed to set size");

    main_window
        .set_min_size(Some(LogicalSize::new(1280, 800)))
        .expect("failed to set min size");

    main_window.center().unwrap();
    #[cfg(target_os = "macos")]
    native_windows(&main_window);

    return main_window;
}

pub fn window_design(app: &mut App) -> Result<(), Box<dyn std::error::Error>> {
    // Create splashscreen
    let splash_window = create_splashscreen(&app.handle());
    
    // Create main window (load in background)
    let _main_window = create_main_window(&app.handle());
    
    // Simple delay to show splash, then automatically switch to main window
    let app_handle = app.handle().clone();
    let splash_handle = splash_window.clone();
    
    std::thread::spawn(move || {
        // Brief delay to show splash
        std::thread::sleep(std::time::Duration::from_millis(200));
        
        // Show splashscreen
        if let Err(e) = splash_handle.show() {
            log::error!("Failed to show splash window: {}", e);
        }
        
        // Show for 3 seconds then switch to main window
        std::thread::sleep(std::time::Duration::from_millis(3000));
        
        // Close splash screen
        if let Err(e) = splash_handle.close() {
            log::error!("Failed to close splash window: {}", e);
        }
        
        // Show main window
        if let Some(main_win) = app_handle.get_webview_window("main") {
            if let Err(e) = main_win.show() {
                log::error!("Failed to show main window: {}", e);
            } else {
                if let Err(e) = main_win.set_focus() {
                    log::error!("Failed to focus main window: {}", e);
                }
                log::info!("Main window displayed successfully");
            }
        } else {
            log::error!("Main window not found!");
        }
    });
    
    Ok(())
}
