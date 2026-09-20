# Clear Streaming History

A Chrome browser extension that bulk-clears watch history on supported streaming services. One click — every item gone.

**Supported services:** Amazon Prime Video · Disney+

---

## Installation

1. **Clone or download** this repository.
2. Open Chrome and navigate to `chrome://extensions`.
3. Enable **Developer mode** (toggle in the top-right corner).
4. Click **Load unpacked** and select the project folder (the one containing `manifest.json`).
5. The extension icon (orange circle with an ✕) will appear in your toolbar.

> **Tip:** Pin it for easy access via the puzzle-piece Extensions menu → pin icon next to "Clear Streaming History".

---

## Usage

1. Click the extension icon in the Chrome toolbar — the **side panel** opens on the right.
2. The panel detects which supported service you're on (Amazon Prime Video or Disney+).
3. If you are already on the history page, click **Clear History**.
4. If you are not, the extension will navigate you there automatically and then start clearing.
5. Watch the progress counter update. Click **Stop** at any time to abort.
6. When finished, the panel displays the total number of items deleted.
7. Click the extension icon again to close the side panel.

### Per-service pages targeted

| Service | Page cleared | URL |
|---|---|---|
| Amazon Prime Video | Watch History | `amazon.com/gp/video/settings/watch-history` |
| Disney+ | Continue Watching (home shelf) | `disneyplus.com/home` |

---

## Updating the Extension

After pulling new code from the repository:

1. Go to `chrome://extensions`.
2. Find **Clear Streaming History** and click the **refresh icon** (↺).
3. Hard-refresh any open tab (`Cmd+Shift+R` / `Ctrl+Shift+R`) so the updated content script is injected.

---

## Development

### Prerequisites

- Node.js ≥ 18 (for running tests)
- Chrome (for loading the extension)

### Install dependencies

```bash
npm install
```

### Run tests

```bash
npm test
```

Tests use [Jest](https://jestjs.io/) with a [jsdom](https://github.com/jsdom/jsdom) environment. No browser is required. The adapter DOM-querying logic and service registry are fully unit tested.

### Debugging

1. Load the extension unpacked (see Installation).
2. Open DevTools on the history page (`Cmd+Option+I` / `F12`) → **Console** tab.
3. All extension log lines are prefixed with `[ClearHistory]`.
4. To debug the background service worker, click **"service worker"** link on `chrome://extensions`.
5. To debug the side panel, open it, then go to `chrome://extensions` → **"service worker"** → DevTools → Sources. Alternatively right-click inside the side panel → **Inspect**.

---

## Project Structure

```
manifest.json          Chrome MV3 manifest — permissions, content script registration
background.js          Service worker — toggles side panel, navigates to history page
content.js             Orchestrator — runs the delete loop; talks to side panel via messages
sidepanel.html         Side panel markup (stays open across tab navigation)
sidepanel.js           Side panel logic — detects service, drives start/stop, shows progress
popup.html             Legacy popup markup (retained for reference; not active)
popup.js               Legacy popup logic (retained for reference; not active)
services/
  amazon.js            Amazon Prime Video adapter (direct delete button)
  disney.js            Disney+ adapter (REMOVE button + confirmation modal)
  index.js             Service registry (hostname → adapter map)
tests/
  amazon.adapter.test.js     Unit tests for the Amazon adapter
  disney.adapter.test.js     Unit tests for the Disney+ adapter
  service-registry.test.js   Unit tests for the service registry
.github/
  copilot-instructions.md    AI assistant instructions for this repo
  instructions/
    js.instructions.md       JavaScript coding conventions
    tests.instructions.md    Test conventions and patterns
```

---

## Adding a New Streaming Service

The adapter interface has two patterns depending on how the service works:

### Pattern A — Direct button (like Amazon)
The page exposes a single button per item that directly triggers removal when clicked.

```js
const NetflixAdapter = {
  name: "Netflix",
  historyUrl: "https://www.netflix.com/viewingactivity",

  isOnHistoryPage() {
    return window.location.pathname.startsWith("/viewingactivity");
  },

  // Returns the current list of delete buttons. Called fresh each iteration.
  getDeleteButtons() {
    // Use stable data-* or aria-* selectors, never obfuscated class names.
    return Array.from(document.querySelectorAll('[data-uia="viewing-activity-delete-button"]'));
  },
};

if (typeof module !== "undefined") module.exports = { NetflixAdapter };
```

### Pattern B — Multi-step with confirmation (like Disney+)
The page requires opening a menu or hovering to reveal a remove button, followed by a confirmation modal. Implement `getDeleteButtons()` + `deleteItem(btn)`:

```js
const MyServiceAdapter = {
  name: "My Service",
  historyUrl: "https://www.example.com/history",

  isOnHistoryPage() {
    return window.location.pathname.startsWith("/history");
  },

  // Returns the trigger buttons — one per card.
  getDeleteButtons() {
    return Array.from(document.querySelectorAll('button[aria-label*="Remove"]'));
  },

  // Clicks the trigger, waits for a confirmation modal, confirms.
  async deleteItem(btn) {
    btn.click();
    const confirmBtn = await waitForConfirmButton(); // poll until it appears
    if (!confirmBtn) return false;
    confirmBtn.click();
    return true;
  },
};
```

`content.js` automatically uses `deleteItem` when the adapter provides it, otherwise falls back to a direct `.click()`.

### Steps to add any service

1. **Create the adapter** in `services/<name>.js` using Pattern A or B above.

2. **Register the adapter** in `services/index.js`:

   ```js
   const SERVICE_REGISTRY = {
     "www.amazon.com": AmazonAdapter,
     "www.disneyplus.com": DisneyPlusAdapter,
     "www.example.com": MyServiceAdapter,  // ← add this
   };
   ```

3. **Update the manifest** — add the hostname to `host_permissions` and add a new `content_scripts` entry in `manifest.json`:

   ```json
   "host_permissions": [
     "https://www.amazon.com/*",
     "https://www.disneyplus.com/*",
     "https://www.example.com/*"
   ],
   "content_scripts": [
     { ... existing entries ... },
     {
       "matches": ["https://www.example.com/history*"],
       "js": ["services/myservice.js", "services/index.js", "content.js"],
       "run_at": "document_idle"
     }
   ]
   ```

4. **Update the side panel** — add the service entry to the `SERVICES` map in `sidepanel.js`:

   ```js
   "www.example.com": {
     name: "My Service",
     historyUrl: "https://www.example.com/history",
     isHistoryPath: (pathname) => pathname.startsWith("/history"),
   },
   ```
   (Also update the same map in `popup.js` if you intend to keep the legacy popup in sync.)

5. **Write tests** — add `tests/<name>.adapter.test.js`. For Pattern B, mock the confirmation modal appearance (see `tests/disney.adapter.test.js` for the pattern).

6. **Reload** the extension in `chrome://extensions`.

---

## Architecture Notes

- **No bundler.** All scripts are plain JS loaded directly by Chrome. This keeps the extension simple and auditable.
- **Side panel UI.** The extension uses `chrome.sidePanel` (Chrome 114+) instead of a popup, so the UI stays open across tab navigation. The icon click toggles the panel open/closed via a long-lived port connection between `sidepanel.js` and the background service worker.
- **Adapter isolation.** Each service adapter is self-contained. The core orchestrator (`content.js`) never contains service-specific logic.
- **Two adapter patterns.** Pattern A (Amazon): a single delete button per item, clicked directly. Pattern B (Disney+): a trigger button reveals a confirmation modal; the adapter handles the full multi-step flow via `deleteItem()`. `content.js` detects which pattern applies via the presence of `adapter.deleteItem`.
- **Stable selectors.** Adapters target `data-automation-id`, `aria-label`, and other semantic attributes — not obfuscated CSS class names that change with each deploy.
- **Fresh button queries.** Button-getter methods are called on every loop iteration because services remove DOM nodes after each successful deletion.

