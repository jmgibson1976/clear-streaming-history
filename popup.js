/**
 * Popup script.
 *
 * On open: inspects the active tab URL to identify the service and whether
 * the user is already on the history page.
 *
 * Start button:
 *   - If on the history page → sends "start" to the content script.
 *   - If on the service domain but wrong page → navigates to history URL,
 *     then sends "start" once the page loads.
 *   - If on an unsupported page → shows an error.
 *
 * Receives progress/done/error messages from content.js and updates the UI.
 */

// ---------------------------------------------------------------------------
// Service definitions (must stay in sync with services/ adapters)
// ---------------------------------------------------------------------------

const SERVICES = {
  "www.amazon.com": {
    name: "Amazon Prime Video",
    historyUrl:
      "https://www.amazon.com/gp/video/settings/watch-history/ref=atv_set_watch-history",
    isHistoryPath: (pathname) =>
      pathname.startsWith("/gp/video/settings/watch-history"),
  },
  "www.disneyplus.com": {
    name: "Disney+",
    historyUrl: "https://www.disneyplus.com/home",
    isHistoryPath: (pathname) =>
      pathname === "/home" || pathname.startsWith("/home/"),
  },
};

// ---------------------------------------------------------------------------
// UI refs
// ---------------------------------------------------------------------------

const elService = document.getElementById("service-name");
const elStatus = document.getElementById("status-box");
const btnStart = document.getElementById("btn-start");
const btnStop = document.getElementById("btn-stop");
const chkDebug = document.getElementById("chk-debug");

// ---------------------------------------------------------------------------
// Debug toggle — persisted in chrome.storage.sync
// ---------------------------------------------------------------------------

chrome.storage.sync.get("debugMode", ({ debugMode }) => {
  chkDebug.checked = !!debugMode;
});

chkDebug.addEventListener("change", () => {
  chrome.storage.sync.set({ debugMode: chkDebug.checked });
});

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let activeTabId = null;
let currentService = null;

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

(async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;

  activeTabId = tab.id;

  const url = new URL(tab.url);
  currentService = SERVICES[url.hostname] ?? null;

  if (!currentService) {
    elService.textContent = "Unsupported site";
    setStatus("Navigate to a supported streaming service first.", "error");
    btnStart.disabled = true;
    return;
  }

  elService.textContent = currentService.name;

  if (currentService.isHistoryPath(url.pathname)) {
    setStatus("On history page — ready to clear.");
  } else {
    setStatus("Not on the history page.\nClick to navigate there and clear.");
  }
})();

// ---------------------------------------------------------------------------
// Message listener (from content script)
// ---------------------------------------------------------------------------

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "progress") {
    setStatus(`Deleted ${msg.deleted} item(s)…`);
  }

  if (msg.type === "done") {
    setStatus(`Done! Deleted ${msg.deleted} item(s).`, "done");
    setRunning(false);
  }

  if (msg.type === "error") {
    setStatus(msg.message, "error");
    setRunning(false);
  }
});

// ---------------------------------------------------------------------------
// Buttons
// ---------------------------------------------------------------------------

btnStart.addEventListener("click", async () => {
  if (!currentService) return;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = new URL(tab.url);

  if (!currentService.isHistoryPath(url.pathname)) {
    setStatus("Navigating to history page…");
    setRunning(true);

    // The background service worker handles navigation + sending "start" because
    // the popup closes during navigation, destroying any listeners set here.
    chrome.runtime.sendMessage({
      action: "navigateAndStart",
      url: currentService.historyUrl,
    });
  } else {
    sendStart();
  }
});

btnStop.addEventListener("click", () => {
  chrome.tabs.sendMessage(activeTabId, { action: "stop" });
  setRunning(false);
  setStatus("Stopped.");
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sendStart() {
  setRunning(true);
  setStatus("Clearing history…");
  chrome.tabs.sendMessage(activeTabId, { action: "start" }, (resp) => {
    if (chrome.runtime.lastError || !resp?.ok) {
      setStatus("Could not reach the page. Please refresh and try again.", "error");
      setRunning(false);
    }
  });
}

function setRunning(isRunning) {
  btnStart.disabled = isRunning;
  btnStop.disabled = !isRunning;
}

function setStatus(text, cls = "") {
  elStatus.textContent = text;
  elStatus.className = cls;
}
