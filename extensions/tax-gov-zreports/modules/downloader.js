// ==============================================================================
// KaderGo - File Download & Saving Handler
// ==============================================================================

window.KaderGo = window.KaderGo || {};

(function () {
  'use strict';

  function uint8ToBase64(uint8) {
    let binary = '';
    const len = uint8.byteLength;
    const chunkSize = 0x8000;
    for (let i = 0; i < len; i += chunkSize) {
      binary += String.fromCharCode.apply(null, uint8.subarray(i, Math.min(i + chunkSize, len)));
    }
    return btoa(binary);
  }

  const DB_NAME = 'kadergo_tax_reports_db';
  const STORE_NAME = 'settings';
  const KEY_LAST_DIR = 'last_export_dir_handle';
  const KEY_LAST_DIR_NAME = 'last_export_dir_name';

  let cachedDirHandle = null;

  function getLastDirectoryName() {
    if (cachedDirHandle && cachedDirHandle.name) {
      return cachedDirHandle.name;
    }
    try {
      const stored = localStorage.getItem(KEY_LAST_DIR_NAME);
      if (stored) return stored;
    } catch (e) {}
    return 'Робочий стіл (Desktop)';
  }

  function storeDirectoryName(name) {
    try {
      if (name) localStorage.setItem(KEY_LAST_DIR_NAME, name);
    } catch (e) {}
  }

  // Azonnali előtöltés az oldal betöltésekor, hogy a kattintás pillanatában már szinkronban elérhető legyen
  getStoredDirectoryHandle().then((h) => {
    if (h) {
      cachedDirHandle = h;
      if (h.name) storeDirectoryName(h.name);
    }
  }).catch(() => {});

  function openDatabase() {
    return new Promise((resolve) => {
      if (typeof indexedDB === 'undefined') return resolve(null);
      try {
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
      } catch (e) {
        resolve(null);
      }
    });
  }

  async function getStoredDirectoryHandle() {
    if (cachedDirHandle) return cachedDirHandle;
    try {
      const db = await openDatabase();
      if (!db) return null;
      return new Promise((resolve) => {
        try {
          const tx = db.transaction(STORE_NAME, 'readonly');
          const store = tx.objectStore(STORE_NAME);
          const req = store.get(KEY_LAST_DIR);
          req.onsuccess = () => resolve(req.result || null);
          req.onerror = () => resolve(null);
        } catch (e) {
          resolve(null);
        }
      });
    } catch (e) {
      return null;
    }
  }

  async function storeDirectoryHandle(handle) {
    if (!handle) return;
    cachedDirHandle = handle;
    try {
      const db = await openDatabase();
      if (!db) return;
      return new Promise((resolve) => {
        try {
          const tx = db.transaction(STORE_NAME, 'readwrite');
          const store = tx.objectStore(STORE_NAME);
          store.put(handle, KEY_LAST_DIR);
          tx.oncomplete = () => resolve();
          tx.onerror = () => resolve();
        } catch (e) {
          resolve();
        }
      });
    } catch (e) {
      // Ignore IDB write error
    }
  }

  async function ensureWritePermission(handle) {
    if (!handle || typeof handle.queryPermission !== 'function') return true;
    try {
      const status = await handle.queryPermission({ mode: 'readwrite' });
      if (status === 'granted') return true;
      if (typeof handle.requestPermission === 'function') {
        const reqStatus = await handle.requestPermission({ mode: 'readwrite' });
        return reqStatus === 'granted';
      }
      return true;
    } catch (e) {
      return true;
    }
  }

  /**
   * Prompts user once to select a target directory.
   * Remembers the previously selected folder (persisted in IndexedDB / in-memory).
   * Opens by default in the last selected directory (or 'desktop').
   * Returns:
   *  - FileSystemDirectoryHandle: on success
   *  - { cancelled: true }: if user clicked Cancel / closed dialog
   *  - null: if showDirectoryPicker is not supported or failed
   */
  async function pickDirectory() {
    if (typeof window.showDirectoryPicker !== 'function') {
      console.warn('[KaderGo] window.showDirectoryPicker is not supported');
      return null;
    }

    const pickerOptions = {
      id: 'kadergo_tax_export_dir',
      mode: 'readwrite'
    };

    // Szinkron módon adjuk meg a kezdőmappát a legutóbbiból kiindulva (nincs await késleltetés a kattintás után!)
    if (cachedDirHandle) {
      pickerOptions.startIn = cachedDirHandle;
    } else {
      pickerOptions.startIn = 'desktop';
    }

    try {
      const dirHandle = await window.showDirectoryPicker(pickerOptions);
      if (dirHandle) {
        cachedDirHandle = dirHandle;
        storeDirectoryHandle(dirHandle); // háttérben mentjük IndexedDB-be, nem blokkolunk
        if (dirHandle.name) storeDirectoryName(dirHandle.name);
        return dirHandle;
      }
    } catch (err) {
      if (err && (err.name === 'AbortError' || (err.message && err.message.toLowerCase().includes('abort')))) {
        return { cancelled: true };
      }
      console.warn('[KaderGo] showDirectoryPicker failed with startIn handle, trying desktop fallback:', err);
      if (pickerOptions.startIn !== 'desktop') {
        try {
          const fallbackHandle = await window.showDirectoryPicker({
            id: 'kadergo_tax_export_dir',
            mode: 'readwrite',
            startIn: 'desktop'
          });
          if (fallbackHandle) {
            cachedDirHandle = fallbackHandle;
            storeDirectoryHandle(fallbackHandle);
            if (fallbackHandle.name) storeDirectoryName(fallbackHandle.name);
            return fallbackHandle;
          }
        } catch (fbErr) {
          if (fbErr && (fbErr.name === 'AbortError' || (fbErr.message && fbErr.message.toLowerCase().includes('abort')))) {
            return { cancelled: true };
          }
        }
      }
      return null;
    }

    return null;
  }

  /**
   * Directly writes an Excel file into a previously chosen directory handle without prompting again.
   */
  async function saveFileToDirectory(dirHandle, uint8Data, fileName) {
    if (!dirHandle || typeof dirHandle.getFileHandle !== 'function') {
      throw new Error('Invalid directory handle');
    }

    await ensureWritePermission(dirHandle);

    const blob = new Blob([uint8Data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(blob);
    await writable.close();

    return {
      fileName: fileHandle.name || fileName,
      downloadId: null,
      cancelled: false
    };
  }

  /**
   * Downloads a generated .xlsx file using Chrome's native download manager.
   * - Shows up in Chrome's top-right download tray/shelf.
   * - Requires NO site-level folder modification permissions.
   * - Does NOT suffer from Windows desktop/system directory blocks.
   */
  async function performDownload(uint8Data, defaultFileName, options = {}) {
    const saveAs = options.saveAs !== undefined ? Boolean(options.saveAs) : true;
    const isZip = defaultFileName && defaultFileName.toLowerCase().endsWith('.zip');
    const mimeType = isZip ? 'application/zip' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    // 1. Elsődleges: Background service worker (chrome.downloads)
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      try {
        const base64Data = uint8ToBase64(uint8Data);
        const res = await new Promise((resolve) => {
          chrome.runtime.sendMessage({
            action: 'DOWNLOAD_EXCEL',
            base64Data,
            fileName: defaultFileName,
            mimeType,
            saveAs
          }, (response) => {
            if (chrome.runtime.lastError) {
              resolve(null);
            } else {
              resolve(response);
            }
          });
        });

        if (res) {
          if (res.cancelled) {
            return { fileName: null, downloadId: null, cancelled: true };
          }
          if (res.success && res.downloadId) {
            return { fileName: res.fileName || defaultFileName, downloadId: res.downloadId, cancelled: false };
          }
        }
      } catch (e) {
        console.warn('[KaderGo] Background download error, falling back:', e);
      }
    }

    // 2. Tartalék: szabványos böngésző Blob <a> letöltés (szintén a Chrome letöltéskezelőjébe kerül)
    const blob = new Blob([uint8Data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = defaultFileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      a.remove();
      URL.revokeObjectURL(url);
    }, 1500);

    return { fileName: defaultFileName, downloadId: null, cancelled: false };
  }

  window.KaderGo.Downloader = {
    uint8ToBase64,
    pickDirectory,
    saveFileToDirectory,
    performDownload,
    getLastDirectoryHandle: () => cachedDirHandle,
    getLastDirectoryName
  };
})();
