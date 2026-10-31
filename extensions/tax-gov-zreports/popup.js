// ==============================================================================
// KaderGo - Extension Popup Controller
// Provides extension information, status detection and management
// ==============================================================================

document.addEventListener('DOMContentLoaded', async () => {
  const versionBadge = document.getElementById('versionBadge');
  const closeBtn = document.getElementById('closeBtn');
  const reloadHeaderBtn = document.getElementById('reloadHeaderBtn');
  const tabStatusCard = document.getElementById('tabStatusCard');
  const statusLabel = document.getElementById('statusLabel');
  const openCabinetBtn = document.getElementById('openCabinetBtn');
  const uninstallBtn = document.getElementById('uninstallBtn');

  // 1. Display current version dynamically from manifest
  try {
    const manifest = chrome.runtime.getManifest();
    if (manifest && manifest.version && versionBadge) {
      versionBadge.innerText = 'v' + manifest.version;
    }
  } catch (e) {
    // Fallback retains default HTML text
  }

  // 2. Close button handler
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      window.close();
    });
  }

  // 3. Reload extension handler (Reloads unpacked extension directly from disk)
  if (reloadHeaderBtn) {
    reloadHeaderBtn.addEventListener('click', () => {
      reloadHeaderBtn.classList.add('spinning');
      setTimeout(() => {
        if (chrome.runtime && typeof chrome.runtime.reload === 'function') {
          chrome.runtime.reload();
        } else {
          window.location.reload();
        }
      }, 180);
    });
  }

  // 4. Tab detection & status
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const activeTab = tabs && tabs[0];
    const targetDomain = 'cabinet.tax.gov.ua';

    if (activeTab && activeTab.url && activeTab.url.includes(targetDomain)) {
      if (tabStatusCard) tabStatusCard.className = 'tab-status-card active';
      if (statusLabel) statusLabel.innerText = 'Підключено';
    } else {
      if (tabStatusCard) tabStatusCard.className = 'tab-status-card inactive';
      if (statusLabel) statusLabel.innerText = 'Очікує входу';
    }
  } catch (err) {
    if (tabStatusCard) tabStatusCard.className = 'tab-status-card inactive';
    if (statusLabel) statusLabel.innerText = 'Очікує входу';
  }

  // 5. Open cabinet page button
  if (openCabinetBtn) {
    openCabinetBtn.addEventListener('click', () => {
      chrome.tabs.create({ url: 'https://cabinet.tax.gov.ua/cashregs/zreports' });
      window.close();
    });
  }

  // 6. Delete / Uninstall extension button
  if (uninstallBtn) {
    uninstallBtn.addEventListener('click', () => {
      if (chrome.management && typeof chrome.management.uninstallSelf === 'function') {
        chrome.management.uninstallSelf({ showConfirmDialog: true }, () => {
          if (chrome.runtime.lastError) {
            // User cancelled the Chrome uninstallation dialog
          }
        });
      } else {
        alert('Для видалення перейдіть до меню розширень браузера: chrome://extensions');
      }
    });
  }
});
