// ==============================================================================
// KaderGo - Popup Script (Direct .xlsx Download)
// ==============================================================================

document.addEventListener('DOMContentLoaded', async () => {
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  const downloadBtn = document.getElementById('downloadBtn');
  const btnLabel = document.getElementById('btnLabel');
  const resultMessage = document.getElementById('resultMessage');

  let activeTab = null;
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    activeTab = tabs && tabs[0];
  } catch (e) {
    //
  }

  if (!activeTab || !activeTab.id || !activeTab.url || !activeTab.url.includes('tax.gov.ua')) {
    statusDot.className = 'status-indicator not-found';
    statusText.innerText = 'Не на сторінці tax.gov.ua';
    downloadBtn.disabled = true;
    return;
  }

  try {
    chrome.tabs.sendMessage(activeTab.id, { action: 'GET_STATUS' }, (response) => {
      if (chrome.runtime.lastError || !response) {
        statusDot.className = 'status-indicator not-found';
        statusText.innerText = 'Оновіть сторінку кабінету (F5)';
        downloadBtn.disabled = true;
        return;
      }

      if (response.found) {
        statusDot.className = 'status-indicator ready';
        statusText.innerText = `Таблицю знайдено (${response.count} рядків)`;
        downloadBtn.disabled = false;
        btnLabel.innerText = `Завантажити (${response.count} рядків)`;
      } else {
        statusDot.className = 'status-indicator not-found';
        statusText.innerText = 'Очікування завантаження таблиці...';
        downloadBtn.disabled = true;
      }
    });
  } catch (err) {
    statusDot.className = 'status-indicator not-found';
    statusText.innerText = "Помилка зв'язку зі сторінкою";
    downloadBtn.disabled = true;
  }

  downloadBtn.addEventListener('click', () => {
    downloadBtn.disabled = true;
    btnLabel.innerText = 'Генерація .xlsx...';
    resultMessage.innerText = '';

    chrome.tabs.sendMessage(activeTab.id, { action: 'TRIGGER_DOWNLOAD' }, (res) => {
      if (res && res.success) {
        btnLabel.innerText = '✓ Завантажено!';
        resultMessage.className = 'result-message success';
        resultMessage.innerText = `${res.fileName} збережено!`;

        setTimeout(() => {
          btnLabel.innerText = 'Завантажити ще раз';
          downloadBtn.disabled = false;
        }, 1800);
      } else {
        btnLabel.innerText = 'Помилка!';
        resultMessage.className = 'result-message error';
        resultMessage.innerText = (res && res.error) || 'Не вдалося створити файл Excel.';
        downloadBtn.disabled = false;
      }
    });
  });
});
