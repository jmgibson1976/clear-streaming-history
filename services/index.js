/**
 * Service registry — maps hostnames to their adapter modules.
 * Each adapter must export a plain object matching the ServiceAdapter interface:
 *
 *   {
 *     name: string,
 *     historyUrl: string,
 *     isOnHistoryPage(): boolean,
 *     getDeleteButtons(): HTMLElement[],
 *   }
 *
 * To add a new streaming service, create a file in services/ and register it here.
 */

const SERVICE_REGISTRY = {
  "www.amazon.com": AmazonAdapter,
  "www.disneyplus.com": DisneyPlusAdapter,
};

/**
 * Returns the adapter for the current page, or null if unsupported.
 * @returns {object|null}
 */
function getAdapter() {
  return SERVICE_REGISTRY[window.location.hostname] ?? null;
}

if (typeof module !== "undefined") module.exports = { getAdapter, SERVICE_REGISTRY };
