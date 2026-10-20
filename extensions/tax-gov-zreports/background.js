// ==============================================================================
// KaderGo - Background Service Worker (Direct Download & File Open Handler)
// ==============================================================================

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'DOWNLOAD_EXCEL') {
    const { base64Data, fileName, mimeType } = request;
    const type = mimeType || (fileName && fileName.toLowerCase().endsWith('.zip') ? 'application/zip' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    const dataUrl = `data:${type};base64,` + base64Data;

    // saveAs: true nyitja meg a Windows natív Mentés Másként ablakát:
    // - Nincs webes mappa-jogosultságkérés (nem kell engedélyt adni a webhelynek)
    // - Bármelyik mappa (pl. Asztal) választható, nincs rendszerfájl-tiltás
    // - A felhasználó közvetlenül választja ki a mentési helyet
    // - A letöltés megjelenik a Chrome jobb felső letöltési paneljén
    // - A Windows megjegyzi a legutóbb használt mappát a következő letöltésekhez
    chrome.downloads.download({
      url: dataUrl,
      filename: fileName,
      saveAs: request.saveAs !== undefined ? Boolean(request.saveAs) : true
    }, (downloadId) => {
      if (chrome.runtime.lastError || !downloadId) {
        const errorMsg = (chrome.runtime.lastError && chrome.runtime.lastError.message) || '';
        const isCancelled = errorMsg.toLowerCase().includes('cancel') || errorMsg.includes('USER_CANCELED') || (!errorMsg && !downloadId);
        sendResponse({ success: false, cancelled: isCancelled, error: errorMsg });
      } else {
        // Отримуємо збережену назву файлу
        chrome.downloads.search({ id: downloadId }, (items) => {
          const item = items && items[0];
          const actualName = item && item.filename ? item.filename.split(/[\\/]/).pop() : fileName;
          sendResponse({ success: true, downloadId: downloadId, fileName: actualName });
        });
      }
    });
    return true; // Keep message channel open for async response
  }

  if (request.action === 'OPEN_FILE') {
    const { downloadId } = request;
    if (downloadId) {
      try {
        chrome.downloads.open(downloadId);
        sendResponse({ success: true });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    } else {
      sendResponse({ success: false, error: 'No downloadId provided' });
    }
    return true;
  }
});
