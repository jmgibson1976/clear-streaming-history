/**
 * Disney+ adapter.
 *
 * Disney+ has no formal "clear all history" feature. The Continue Watching
 * shelf on the home page renders each in-progress title with a REMOVE button
 * directly on the card. Clicking it opens a confirmation modal; the modal's
 * own REMOVE button performs the actual deletion.
 *
 * The shelf is a carousel: only a window of items is visible at a time. After
 * the visible items are removed, the right-arrow button must be clicked to
 * advance to the next page of items. `deleteItem` handles this automatically.
 *
 * Selector rationale:
 *   - `[data-set-style="continue_watching"]` scopes queries to the Continue
 *     Watching shelf, avoiding REMOVE buttons from other shelf types.
 *   - `[aria-label="REMOVE"][role="button"][tabindex="0"]` — the `tabindex="0"`
 *     filter is critical: off-screen carousel items use `tabindex="-1"` and
 *     their clicks are not processed by the React SPA.
 *   - `[data-item-id]` on the sibling anchor uniquely identifies each item so
 *     we can wait for that specific node to leave the DOM after deletion.
 *   - `[data-testid="confirmation-modal"]` identifies the confirmation dialog.
 *   - `[data-testid="arrow-right"][aria-disabled="false"]` targets the carousel
 *     advance button only when more items remain.
 */

const DisneyPlusAdapter = {
  name: 'Disney+',

  historyUrl: 'https://www.disneyplus.com/home',

  isOnHistoryPage() {
    return window.location.pathname === '/home' ||
      window.location.pathname.startsWith('/home/');
  },

  /**
   * Returns visible, interactive REMOVE buttons from the Continue Watching shelf.
   * Filters to `tabindex="0"` only — off-screen carousel items have `tabindex="-1"`
   * and won't open the confirmation modal when clicked programmatically.
   * @returns {HTMLElement[]}
   */
  getDeleteButtons() {
    const shelf = document.querySelector('[data-set-style="continue_watching"]');
    if (!shelf) return [];
    return Array.from(
      shelf.querySelectorAll('[aria-label="REMOVE"][role="button"][tabindex="0"]')
    );
  },

  /**
   * Clicks the card REMOVE button, waits for the confirmation modal, clicks
   * the modal's REMOVE to confirm, then waits for the specific item to leave
   * the DOM (confirming the API call completed) before proceeding.
   * @param {HTMLElement} btn
   * @returns {Promise<boolean>}
   */
  async deleteItem(btn) {
    // Capture the item ID before clicking so we can detect when it's gone.
    const wrapper = btn.closest('[data-testid="cw-set-item-wrapper"]');
    const itemId = wrapper?.querySelector('[data-item-id]')?.dataset.itemId;

    btn.click();

    const modal = await this._waitFor('[data-testid="confirmation-modal"]', 3000);
    if (modal) {
      const confirmBtn = modal.querySelector('button[aria-label="REMOVE"]');
      if (confirmBtn) confirmBtn.click();

      // Wait for the specific item to leave the DOM — this is the reliable
      // signal that Disney+'s API accepted the deletion and React re-rendered.
      if (itemId) {
        await this._waitForGone(`[data-item-id="${itemId}"]`, 5000);
      } else {
        await this._waitForGone('[data-testid="confirmation-modal"]', 5000);
      }
    }

    // Brief pause for the SPA to settle before the next interaction.
    await new Promise(resolve => setTimeout(resolve, 500));

    // Advance carousel if this page is now empty and more items remain.
    if (this.getDeleteButtons().length === 0) {
      const nextArrow = document.querySelector(
        '[data-testid="arrow-right"][aria-disabled="false"]'
      );
      if (nextArrow) {
        nextArrow.click();
        await new Promise(resolve => setTimeout(resolve, 800));
      }
    }

    return true;
  },

  /**
   * Polls until a selector appears in the DOM or timeoutMs elapses.
   * @param {string} selector
   * @param {number} timeoutMs
   * @returns {Promise<Element|null>}
   */
  async _waitFor(selector, timeoutMs) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const el = document.querySelector(selector);
      if (el) return el;
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    return null;
  },

  /**
   * Polls until a selector is gone from the DOM or timeoutMs elapses.
   * @param {string} selector
   * @param {number} timeoutMs
   * @returns {Promise<boolean>} true if gone, false if timed out
   */
  async _waitForGone(selector, timeoutMs) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (!document.querySelector(selector)) return true;
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    return false;
  },
};

if (typeof module !== 'undefined') module.exports = { DisneyPlusAdapter };
