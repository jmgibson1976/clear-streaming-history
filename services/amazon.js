/**
 * Amazon Prime Video adapter.
 *
 * The watch history page renders each title as an <li> with a form inside.
 * The form contains a submit button (aria-label="Delete … from Watch History").
 * Clicking that button POSTs a removal request and the DOM removes the item.
 *
 * Selector rationale:
 *   - `[data-automation-id^="wh-delete-"]` reliably identifies each delete form
 *     regardless of obfuscated CSS class names that Amazon rotates.
 *   - We grab the <button type="submit"> inside each form to trigger the click.
 */

const AmazonAdapter = {
  name: "Amazon Prime Video",

  historyUrl:
    "https://www.amazon.com/gp/video/settings/watch-history/ref=atv_set_watch-history",

  isOnHistoryPage() {
    return window.location.pathname.startsWith(
      "/gp/video/settings/watch-history"
    );
  },

  /**
   * Returns all currently visible delete buttons on the history page.
   * Amazon removes DOM nodes after each deletion, so this must be called
   * fresh each iteration rather than caching the full list up-front.
   * @returns {HTMLButtonElement[]}
   */
  getDeleteButtons() {
    const forms = document.querySelectorAll(
      '[data-automation-id^="wh-delete-"]'
    );
    return Array.from(forms)
      .map((form) => form.querySelector('button[type="submit"]'))
      .filter(Boolean);
  },
};

if (typeof module !== "undefined") module.exports = { AmazonAdapter };
