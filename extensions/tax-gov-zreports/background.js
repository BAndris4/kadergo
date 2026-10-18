// ==============================================================================
// KaderGo - Background Service Worker (Direct Download & File Open Handler)
// ==============================================================================

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'DOWNLOAD_EXCEL') {
    const { base64Data, fileName } = request;
    const dataUrl = 'data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,' + base64Data;

    // saveAs: true дозволяє користувачеві самостійно обрати папку та ім'я для збереження
    chrome.downloads.download({
      url: dataUrl,
      filename: fileName,
      saveAs: true
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
