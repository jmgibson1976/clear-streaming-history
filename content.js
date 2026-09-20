/**
 * Content script — orchestrates the clear-history loop.
 *
 * Loaded on the history page. Listens for messages from the popup:
 *   { action: "start" }  — begin clearing
 *   { action: "stop"  }  — abort the loop
 *
 * Sends status messages back to the popup:
 *   { type: "progress", deleted: number, remaining: number }
 *   { type: "done",     deleted: number }
 *   { type: "error",    message: string }
 *
 * Adapter interface consumed here:
 *   adapter.getButtons()         — returns currently visible action buttons
 *   adapter.deleteItem?(btn)     — optional async; if absent, defaults to btn.click()
 *   adapter.isOnHistoryPage()    — URL guard
 */

const DELAY_BETWEEN_DELETES_MS = 800;

let running = false;

// Deferred so the storage-backed flag in logger.js has time to load.
setTimeout(() => log("content.js loaded on", window.location.href), 0);

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  log("received message:", msg);

  if (msg.action === "start") {
    if (running) {
      sendResponse({ ok: false, reason: "already running" });
      return;
    }
    startClearing();
    sendResponse({ ok: true });
  }

  if (msg.action === "stop") {
    running = false;
    sendResponse({ ok: true });
  }
});

async function startClearing() {
  const adapter = getAdapter();
  log("adapter:", adapter ? adapter.name : "none");

  if (!adapter) {
    sendStatus({ type: "error", message: "Unsupported page." });
    return;
  }

  if (!adapter.isOnHistoryPage()) {
    sendStatus({ type: "error", message: "Not on the history page." });
    return;
  }

  running = true;
  let deleted = 0;

  // Resolve the delete strategy once: use adapter.deleteItem if provided
  // (multi-step flows like Apple TV), otherwise fall back to a direct click.
  const deleteItem = adapter.deleteItem
    ? adapter.deleteItem.bind(adapter)
    : (btn) => { btn.click(); return Promise.resolve(true); };

  // Adapters may expose getMenuButtons (Apple TV) or getDeleteButtons (Amazon).
  const getButtons = (adapter.getMenuButtons ?? adapter.getDeleteButtons).bind(adapter);

  while (running) {
    const buttons = getButtons();
    log("buttons found:", buttons.length);

    if (buttons.length === 0) {
      break;
    }

    log("deleting:", buttons[0].getAttribute("aria-label"));
    const removed = await deleteItem(buttons[0]);
    if (removed) deleted++;

    sendStatus({
      type: "progress",
      deleted,
      remaining: getButtons().length,
    });

    await sleep(DELAY_BETWEEN_DELETES_MS);
  }

  running = false;
  sendStatus({ type: "done", deleted });
}

function sendStatus(payload) {
  chrome.runtime.sendMessage(payload).catch(() => {
    // Popup may be closed — ignore.
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
