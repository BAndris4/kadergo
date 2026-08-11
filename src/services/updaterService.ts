import { check, Update, DownloadEvent } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

export interface UpdateStatus {
  status: "idle" | "checking" | "available" | "downloading" | "up-to-date" | "error";
  message: string;
  updateInfo?: Update | null;
}

export interface ReleaseItem {
  tag_name: string;
  name: string;
  body: string;
  published_at: string;
  prerelease: boolean;
  html_url: string;
}

/**
 * Fetches all published GitHub releases for KaderGo repo to support release notes and version rollback selection.
 */
export async function fetchReleaseHistory(): Promise<ReleaseItem[]> {
  try {
    const response = await fetch("https://api.github.com/repos/BAndris4/kadergo/releases", {
      headers: {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "KaderGo-App",
      },
    });

    if (!response.ok) {
      console.warn("Failed to fetch release history from GitHub:", response.statusText);
      return [];
    }

    const releases: ReleaseItem[] = await response.json();
    return releases.filter((r) => !r.prerelease);
  } catch (error) {
    console.error("Error fetching release history:", error);
    return [];
  }
}

/**
 * Non-blocking silent update check for application startup.
 * Returns the Update object if a newer version is available, or null.
 */
export async function checkUpdateOnStartup(): Promise<Update | null> {
  try {
    const update = await check();
    return update || null;
  } catch (error) {
    console.warn("Startup update check error:", error);
    return null;
  }
}

/**
 * Checks for updates (or specific version target) using Tauri Updater plugin.
 * Option allowDowngrades enables selecting and installing older versions if target specified.
 */
export async function checkForUpdates(
  onStatusChange?: (status: UpdateStatus) => void,
  targetTag?: string
): Promise<Update | null> {
  try {
    onStatusChange?.({
      status: "checking",
      message: "Перевірка наявності оновлень...",
    });

    const checkOptions: any = {};
    if (targetTag) {
      checkOptions.allowDowngrades = true;
      const cleanTag = targetTag.startsWith("v") ? targetTag : `v${targetTag}`;
      checkOptions.endpoints = [
        `https://github.com/BAndris4/kadergo/releases/download/${cleanTag}/latest.json`,
      ];
    }

    const update = await check(Object.keys(checkOptions).length > 0 ? checkOptions : undefined);

    if (update) {
      onStatusChange?.({
        status: "available",
        message: targetTag
          ? `Обрано версію ${update.version} для повернення/встановлення. Підтвердіть дію.`
          : `Знайдено версію ${update.version}. Ознайомтеся з описом та підтвердіть оновлення.`,
        updateInfo: update,
      });
      return update;
    } else {
      onStatusChange?.({
        status: "up-to-date",
        message: targetTag
          ? `Не вдалося отримати інсталятор для версії ${targetTag}. Впевніться, що цей реліз створено на GitHub.`
          : "Ви використовуєте найновішу версію програми.",
      });
      return null;
    }
  } catch (error) {
    console.error("Update check failed:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    onStatusChange?.({
      status: "error",
      message: `Помилка під час перевірки оновлень: ${errorMessage}`,
    });
    return null;
  }
}

/**
 * Downloads and installs the given Update object, then relaunches the app.
 */
export async function installUpdate(
  update: Update,
  onStatusChange?: (status: UpdateStatus) => void
): Promise<boolean> {
  try {
    onStatusChange?.({
      status: "downloading",
      message: "Розпочато завантаження оновлення...",
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
            message:
              totalBytes > 0
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

    await relaunch();
    return true;
  } catch (error) {
    console.error("Failed to install update:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    onStatusChange?.({
      status: "error",
      message: `Помилка під час встановлення оновлення: ${errorMessage}`,
    });
    return false;
  }
}
