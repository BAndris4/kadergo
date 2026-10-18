// ==============================================================================
// KaderGo - Popup Script (Direct .xlsx Turnover Download)
// ==============================================================================

document.addEventListener('DOMContentLoaded', async () => {
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  const downloadBtn = document.getElementById('downloadBtn');
  const btnLabel = document.getElementById('btnLabel');
  const downloadAllBtn = document.getElementById('downloadAllBtn');
  const btnAllLabel = document.getElementById('btnAllLabel');
  const resultMessage = document.getElementById('resultMessage');

  let activeTab = null;

  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    activeTab = tabs && tabs[0];
  } catch (e) {
    //
  }

  const targetPrefix = 'https://cabinet.tax.gov.ua/cashregs/zreports';

  if (!activeTab || !activeTab.id || !activeTab.url || !activeTab.url.startsWith(targetPrefix)) {
    statusDot.className = 'status-indicator not-found';
    statusText.innerText = 'Відкрийте: /cashregs/zreports';
    downloadBtn.disabled = true;
    if (downloadAllBtn) downloadAllBtn.disabled = true;
    return;
  }

  try {
    chrome.tabs.sendMessage(activeTab.id, { action: 'GET_STATUS' }, (response) => {
      if (chrome.runtime.lastError || !response) {
        statusDot.className = 'status-indicator not-found';
        statusText.innerText = 'Оновіть сторінку кабінету (F5)';
        downloadBtn.disabled = true;
        if (downloadAllBtn) downloadAllBtn.disabled = true;
        return;
      }

      if (!response.hasPeriod) {
        statusDot.className = 'status-indicator not-found';
        statusText.innerText = 'Вкажіть період (дати «з» та «по»)';
        downloadBtn.disabled = true;
        if (downloadAllBtn) downloadAllBtn.disabled = true;
      } else {
        statusDot.className = 'status-indicator ready';
        statusText.innerText = response.found ? `Дані знайдено (${response.count} рядків)` : 'Період вказано (готово до експорту)';
        downloadBtn.disabled = false;
        btnLabel.innerText = 'Завантажити поточний';
        if (downloadAllBtn) downloadAllBtn.disabled = false;
      }
    });
  } catch (err) {
    statusDot.className = 'status-indicator not-found';
    statusText.innerText = "Помилка зв'язку зі сторінкою";
    downloadBtn.disabled = true;
    if (downloadAllBtn) downloadAllBtn.disabled = true;
  }

  downloadBtn.addEventListener('click', () => {
    downloadBtn.disabled = true;
    if (downloadAllBtn) downloadAllBtn.disabled = true;
    btnLabel.innerText = 'Формування...';
    resultMessage.innerText = '';

    chrome.tabs.sendMessage(activeTab.id, { action: 'TRIGGER_DOWNLOAD' }, (res) => {
      btnLabel.innerText = 'Завантажити поточний';
      downloadBtn.disabled = false;
      if (downloadAllBtn) downloadAllBtn.disabled = false;

      if (res && res.cancelled) {
        resultMessage.className = 'result-message';
        resultMessage.innerText = '';
        return;
      }

      if (res && res.success) {
        resultMessage.className = 'result-message success';
        resultMessage.innerText = `${res.fileName || 'Звіт'} сформовано!`;
      } else {
        resultMessage.className = 'result-message error';
        resultMessage.innerText = (res && res.error) || 'Не вдалося створити файл Excel.';
      }
    });
  });

  if (downloadAllBtn) {
    downloadAllBtn.addEventListener('click', () => {
      downloadAllBtn.disabled = true;
      downloadBtn.disabled = true;
      btnAllLabel.innerText = 'Збір по всіх РРО...';
      resultMessage.innerText = '';

      chrome.tabs.sendMessage(activeTab.id, { action: 'TRIGGER_DOWNLOAD_ALL' }, (res) => {
        btnAllLabel.innerText = 'Всі РРО в один Excel';
        downloadAllBtn.disabled = false;
        downloadBtn.disabled = false;

        if (res && res.cancelled) {
          resultMessage.className = 'result-message';
          resultMessage.innerText = '';
          return;
        }

        if (res && res.success) {
          resultMessage.className = 'result-message success';
          resultMessage.innerText = 'Всі РРО збережено в Excel!';
        } else {
          resultMessage.className = 'result-message error';
          resultMessage.innerText = (res && res.error) || 'Не вдалося експортувати всі РРО.';
        }
      });
    });
  }
});
