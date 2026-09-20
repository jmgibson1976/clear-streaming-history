/**
 * Shared debug logger.
 *
 * All scripts (content.js, adapters) call `log(...)` instead of `console.log`.
 * Logging is a no-op unless the user has enabled "Debug logging" in the popup,
 * which stores { debugMode: true } in chrome.storage.sync.
 *
 * Because content scripts cannot await storage before the first synchronous
 * execution, this module maintains a cached `_debugEnabled` flag that is
 * refreshed once on load and kept up-to-date via a storage change listener.
 */

let _debugEnabled = false;

// Load the current setting once on script initialisation.
chrome.storage.sync.get("debugMode", ({ debugMode }) => {
  _debugEnabled = !!debugMode;
});

// Keep in sync if the user toggles the setting while the page is open.
chrome.storage.onChanged.addListener((changes) => {
  if ("debugMode" in changes) {
    _debugEnabled = !!changes.debugMode.newValue;
  }
});

/**
 * Logs to the console only when debug mode is enabled.
 * Prefix [ClearHistory] is added automatically.
 * @param {...any} args
 */
function log(...args) {
  if (_debugEnabled) console.log("[ClearHistory]", ...args);
}

/**
 * Always logs warnings regardless of debug mode.
 * @param {...any} args
 */
function warn(...args) {
  console.warn("[ClearHistory]", ...args);
}

if (typeof module !== "undefined") module.exports = { log, warn };
