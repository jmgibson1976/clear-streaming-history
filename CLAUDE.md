# Clear Streaming History — Claude Instructions

This is a Chrome Manifest V3 browser extension that bulk-clears watch history on
streaming services. It is modular: each service lives in `services/<name>.js` and
is registered in `services/index.js`.

## Architecture

```
manifest.json              Chrome MV3 manifest
background.js              Service worker — handles tab navigation only
content.js                 Orchestrator — runs the delete loop on the history page
popup.html / popup.js      Extension popup UI
sidepanel.html / sidepanel.js  Side panel UI for navigation and history clearing
services/
  amazon.js                Amazon Prime Video adapter
  index.js                 Service registry (hostname → adapter)
tests/                     Jest unit tests (jsdom environment)
```

## Service Adapter Interface

Every adapter must be a plain object with:

```js
{
  name: string,                  // Display name
  historyUrl: string,            // Direct URL to the history page
  isOnHistoryPage(): boolean,    // Detects if the current page is the history page
  getDeleteButtons(): HTMLButtonElement[],  // Returns all currently visible delete buttons
}
```

## JavaScript Conventions

### Style

- Use `const` by default; `let` only when reassignment is required. Never `var`.
- Prefer arrow functions for callbacks; use named `function` declarations for top-level functions.
- Use `async/await` over raw Promise chains.
- Use optional chaining (`?.`) and nullish coalescing (`??`) instead of verbose null checks.
- Single quotes for strings; template literals for interpolation.

### Browser Extension Specifics

- This project has **no bundler**. All files are loaded as plain scripts via `manifest.json`.
- Each `services/*.js` adapter file is a self-contained global. Export for Node/Jest with:
  ```js
  if (typeof module !== 'undefined') module.exports = { MyAdapter };
  ```
- **Never** select elements by obfuscated CSS class names (e.g. `hXwTqF`). Always use
  `data-*` attributes, `aria-*` attributes, or semantic element types.
- Content scripts communicate with the popup via `chrome.runtime.sendMessage`. Always
  wrap the call in `.catch(() => {})` since the popup may be closed.
- Do not add a bundler or build step without updating this file and the README.

### Error Handling

- Content scripts must not throw unhandled exceptions — wrap async entry points in try/catch.
- Prefer early returns over deeply nested if/else.
- Log errors with a `[ClearHistory]` prefix so they're easy to filter in DevTools.

### Comments

- Comment the *why*, not the *what*. Avoid restating what the code obviously does.
- JSDoc is required for exported functions and adapter interface methods.

## Test Conventions

### Framework

- **Jest** with **jsdom** environment (`"testEnvironment": "jsdom"` in `package.json`).
- All test files live in `tests/` and are named `<subject>.test.js`.
- Run tests with `npm test`.

### Structure

- Use `describe` blocks to group related tests; use `it` or `test` for individual cases.
- Name tests as full sentences: `"returns empty array when no delete buttons exist"`.
- Follow Arrange / Act / Assert within each test. Keep setup minimal and local.

### Browser Extension Testing Approach

The extension has no bundler, so each adapter is a plain JS global. Load them in tests via:

```js
const { AmazonAdapter } = require('../services/amazon');
```

The `module.exports` guard at the bottom of each service file enables this without
changing runtime behaviour in the browser.

#### DOM Testing

Use `document.body.innerHTML = ...` to set up fixture HTML in jsdom before each test.
Reset it in `afterEach` or `beforeEach` to keep tests independent.

#### `window.location` Mocking

Override location properties for URL-detection tests:

```js
Object.defineProperty(window, 'location', {
  value: { pathname: '/some/path', hostname: 'www.example.com' },
  writable: true,
  configurable: true,
});
```

#### Chrome API Mocking

Chrome extension APIs (`chrome.runtime`, `chrome.tabs`) are not available in jsdom.
Mock them as needed:

```js
global.chrome = {
  runtime: { sendMessage: jest.fn(), onMessage: { addListener: jest.fn() } },
};
```

### Coverage Expectations

- **Adapters** (`services/*.js`): aim for 100% — they are pure DOM logic.
- **Registry** (`services/index.js`): cover hostname lookup and unknown-host fallback.
- **content.js / popup.js**: cover pure helper functions; skip chrome API integration paths.

### Anti-Patterns

- Do not test CSS class name selectors — they are obfuscated and will break.
- Do not test implementation details; test observable behaviour (buttons found, click called).
- Do not share mutable DOM state between tests.
