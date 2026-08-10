import { check, Update, DownloadEvent } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

export interface UpdateStatus {
  status: "idle" | "checking" | "available" | "downloading" | "up-to-date" | "error";
  message: string;
  updateInfo?: Update | null;
}

/**
 * Checks for updates using the Tauri Updater plugin.
 * If an update is found, downloads and installs it, then relaunches the application.
 */
export async function checkForUpdates(
  onStatusChange?: (status: UpdateStatus) => void
): Promise<boolean> {
  try {
    onStatusChange?.({
      status: "checking",
      message: "Frissítések keresése...",
    });

    const update = await check();

    if (update) {
      onStatusChange?.({
        status: "available",
        message: `Új verzió érhető el (${update.version})! Letöltés és telepítés folyamatban...`,
        updateInfo: update,
      });

      let downloadedBytes = 0;
      let totalBytes = 0;

      await update.downloadAndInstall((event: DownloadEvent) => {
        switch (event.event) {
          case "Started":
            totalBytes = event.data.contentLength || 0;
            onStatusChange?.({
              status: "downloading",
              message: `Letöltés megkezdődött...`,
              updateInfo: update,
            });
            break;
          case "Progress":
            downloadedBytes += event.data.chunkLength;
            const percent = totalBytes > 0 ? Math.round((downloadedBytes / totalBytes) * 100) : 0;
            onStatusChange?.({
              status: "downloading",
              message: totalBytes > 0
                ? `Letöltés: ${percent}% (${Math.round(downloadedBytes / 1024)} KB / ${Math.round(totalBytes / 1024)} KB)`
                : `Letöltés folyamatban (${Math.round(downloadedBytes / 1024)} KB)...`,
              updateInfo: update,
            });
            break;
          case "Finished":
            onStatusChange?.({
              status: "downloading",
              message: "Letöltés befejeződött. Telepítés és újraindítás...",
              updateInfo: update,
            });
            break;
        }
      });

      onStatusChange?.({
        status: "downloading",
        message: "Frissítés sikeresen telepítve! Az alkalmazás újraindul...",
        updateInfo: update,
      });

      // Relaunch the app to apply the update
      await relaunch();
      return true;
    } else {
      onStatusChange?.({
        status: "up-to-date",
        message: "Az alkalmazás a legfrissebb verziót használja.",
      });
      return false;
    }
  } catch (error) {
    console.error("Update check failed:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    onStatusChange?.({
      status: "error",
      message: `Hiba a frissítés ellenőrzésekor: ${errorMessage}`,
    });
    return false;
  }
}
