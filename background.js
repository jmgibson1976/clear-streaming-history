/**
 * Background service worker.
 *
 * Toggles the side panel open/closed when the extension icon is clicked.
 * Panel visibility is tracked via a long-lived port from sidepanel.js —
 * the port exists while the panel is open and disconnects when it closes.
 * This survives service worker restarts without needing storage.
 *
 * Also handles tab navigation when the user is not on the history page.
 * The side panel sends { action: "navigateAndStart", url: string } to trigger this.
 * Navigation and the subsequent "start" message are handled here so the logic
 * survives regardless of side panel visibility.
 */

let panelPort = null;

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== 'sidepanel') return;
  panelPort = port;
  port.onDisconnect.addListener(() => { panelPort = null; });
});

chrome.action.onClicked.addListener(async (tab) => {
  if (panelPort) {
    // Panel is open — close it by disabling then re-enabling.
    await chrome.sidePanel.setOptions({ enabled: false });
    await chrome.sidePanel.setOptions({ enabled: true, path: 'sidepanel.html' });
  } else {
    chrome.sidePanel.open({ windowId: tab.windowId });
  }
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.action === 'navigateAndStart' && msg.url) {
    navigateAndStart(msg.url).then(() => sendResponse({ ok: true }));
    return true; // keep message channel open for async response
  }
});

async function navigateAndStart(url) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;

  await chrome.tabs.update(tab.id, { url });

  // Wait for the tab to finish loading, then send "start" to the content script.
  // Handled here so it works regardless of whether the side panel is open.
  await new Promise((resolve) => {
    chrome.tabs.onUpdated.addListener(function onUpdated(tabId, info) {
      if (tabId !== tab.id || info.status !== 'complete') return;
      chrome.tabs.onUpdated.removeListener(onUpdated);
      resolve();
    });
  });

  // Small delay to allow content scripts to initialise.
  await new Promise((resolve) => setTimeout(resolve, 600));

  chrome.tabs.sendMessage(tab.id, { action: 'start' }).catch(() => {});
}
