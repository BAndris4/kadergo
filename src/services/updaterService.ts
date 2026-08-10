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
      message: "Перевірка наявності оновлень...",
    });

    const update = await check();

    if (update) {
      onStatusChange?.({
        status: "available",
        message: `Знайдено нову версію (${update.version})! Завантаження та встановлення...`,
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
              message: `Розпочато завантаження...`,
              updateInfo: update,
            });
            break;
          case "Progress":
            downloadedBytes += event.data.chunkLength;
            const percent = totalBytes > 0 ? Math.round((downloadedBytes / totalBytes) * 100) : 0;
            onStatusChange?.({
              status: "downloading",
              message: totalBytes > 0
                ? `Завантаження: ${percent}% (${Math.round(downloadedBytes / 1024)} KB / ${Math.round(totalBytes / 1024)} KB)`
                : `Завантаження... (${Math.round(downloadedBytes / 1024)} KB)`,
              updateInfo: update,
            });
            break;
          case "Finished":
            onStatusChange?.({
              status: "downloading",
              message: "Завантаження завершено. Встановлення та перезапуск...",
              updateInfo: update,
            });
            break;
        }
      });

      onStatusChange?.({
        status: "downloading",
        message: "Оновлення успішно встановлено! Перезапуск програми...",
        updateInfo: update,
      });

      // Relaunch the app to apply the update
      await relaunch();
      return true;
    } else {
      onStatusChange?.({
        status: "up-to-date",
        message: "Ви використовуєте найновішу версію програми.",
      });
      return false;
    }
  } catch (error) {
    console.error("Update check failed:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    onStatusChange?.({
      status: "error",
      message: `Помилка під час перевірки оновлень: ${errorMessage}`,
    });
    return false;
  }
}
