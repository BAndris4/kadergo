pub mod commands;
pub mod db;
pub mod models;

use commands::{
    create_fop, create_worker, delete_fop, delete_worker, dismiss_worker, get_fops, reseed_db,
    update_fop, update_worker,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            get_fops,
            reseed_db,
            create_fop,
            update_fop,
            delete_fop,
            create_worker,
            update_worker,
            dismiss_worker,
            delete_worker
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
