pub mod commands;
pub mod db;
pub mod models;

use commands::{
    create_fop, create_worker, delete_fop, delete_worker, dismiss_worker, ensure_fop_directory,
    get_fops, import_selected_fops, open_folder_in_explorer, open_file_directly, pick_folder, preview_payroll, preview_payroll_period,
    generate_payroll_excel, generate_payroll_period_excel, save_worker_kopek, reseed_db, scan_and_import_fop_folders, scan_fop_folders, update_fop, update_worker,
    preview_tabel, preview_tabel_period, generate_tabel_excel, generate_tabel_period_excel, delete_all_fops,
    generate_zayava_priyom_docx, generate_shtat_docx, generate_grafik_docx,
    generate_nakaz_priyom_docx, generate_nakaz_kasa_docx, scan_fop_nakazy, scrape_fop_address_from_nakazy,
    run_installer_from_bytes, download_and_run_installer, fetch_github_releases,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            get_fops,
            reseed_db,
            create_fop,
            update_fop,
            delete_fop,
            delete_all_fops,
            create_worker,
            update_worker,
            dismiss_worker,
            delete_worker,
            pick_folder,
            ensure_fop_directory,
            open_folder_in_explorer,
            open_file_directly,
            scan_and_import_fop_folders,
            scan_fop_folders,
            import_selected_fops,
            preview_payroll,
            preview_payroll_period,
            generate_payroll_excel,
            generate_payroll_period_excel,
            save_worker_kopek,
            preview_tabel,
            preview_tabel_period,
            generate_tabel_excel,
            generate_tabel_period_excel,
            generate_zayava_priyom_docx,
            generate_shtat_docx,
            generate_grafik_docx,
            generate_nakaz_priyom_docx,
            generate_nakaz_kasa_docx,
            scan_fop_nakazy,
            scrape_fop_address_from_nakazy,
            run_installer_from_bytes,
            download_and_run_installer,
            fetch_github_releases
        ])




        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

