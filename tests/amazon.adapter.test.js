const { AmazonAdapter } = require("../services/amazon");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeDeleteItem(id, title, type = "movie") {
  const label =
    type === "movie"
      ? `Delete ${title} from Watch History`
      : `Delete ${title} from Watch History`;
  return `
    <li data-automation-id="wh-item-${id}" aria-live="polite">
      <div data-automation-id="wh-delete-${id}">
        <form action="/gp/video/api/activityHistoryTitleUpdate">
          <input type="hidden" name="action" value="REMOVE" />
          <input type="hidden" name="titleIds" value="${id}" />
          <input type="hidden" name="token" value="tok123" />
          <button type="submit" aria-label="${label}">
            Delete ${type} from Watch History
          </button>
        </form>
      </div>
    </li>`;
}

// ---------------------------------------------------------------------------
// isOnHistoryPage
// ---------------------------------------------------------------------------

describe("AmazonAdapter.isOnHistoryPage()", () => {
  afterEach(() => {
    Object.defineProperty(window, "location", {
      value: { pathname: "/", hostname: "www.amazon.com" },
      writable: true,
      configurable: true,
    });
  });

  it("returns true when on the watch history path", () => {
    Object.defineProperty(window, "location", {
      value: {
        pathname: "/gp/video/settings/watch-history/ref=atv_set_watch-history",
        hostname: "www.amazon.com",
      },
      writable: true,
      configurable: true,
    });
    expect(AmazonAdapter.isOnHistoryPage()).toBe(true);
  });

  it("returns true for the bare history path without ref param", () => {
    Object.defineProperty(window, "location", {
      value: {
        pathname: "/gp/video/settings/watch-history",
        hostname: "www.amazon.com",
      },
      writable: true,
      configurable: true,
    });
    expect(AmazonAdapter.isOnHistoryPage()).toBe(true);
  });

  it("returns false when on an unrelated Amazon page", () => {
    Object.defineProperty(window, "location", {
      value: { pathname: "/gp/video/storefront", hostname: "www.amazon.com" },
      writable: true,
      configurable: true,
    });
    expect(AmazonAdapter.isOnHistoryPage()).toBe(false);
  });

  it("returns false when on the home page", () => {
    Object.defineProperty(window, "location", {
      value: { pathname: "/", hostname: "www.amazon.com" },
      writable: true,
      configurable: true,
    });
    expect(AmazonAdapter.isOnHistoryPage()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getDeleteButtons
// ---------------------------------------------------------------------------

describe("AmazonAdapter.getDeleteButtons()", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("returns empty array when no history items exist", () => {
    expect(AmazonAdapter.getDeleteButtons()).toEqual([]);
  });

  it("returns one button for a single history item", () => {
    document.body.innerHTML = makeDeleteItem("id-001", "Back to the Future");
    const buttons = AmazonAdapter.getDeleteButtons();
    expect(buttons).toHaveLength(1);
    expect(buttons[0].tagName).toBe("BUTTON");
  });

  it("returns a button for each history item", () => {
    document.body.innerHTML =
      makeDeleteItem("id-001", "Back to the Future") +
      makeDeleteItem("id-002", "A Time to Kill") +
      makeDeleteItem("id-003", "Citadel - Season 2", "episodes");
    expect(AmazonAdapter.getDeleteButtons()).toHaveLength(3);
  });

  it("each button has the correct aria-label", () => {
    document.body.innerHTML = makeDeleteItem("id-001", "Hot Fuzz");
    const [btn] = AmazonAdapter.getDeleteButtons();
    expect(btn.getAttribute("aria-label")).toBe(
      "Delete Hot Fuzz from Watch History"
    );
  });

  it("ignores containers that lack a submit button", () => {
    // A form with no button inside — should be filtered out.
    document.body.innerHTML = `
      <div data-automation-id="wh-delete-id-empty">
        <form action="/gp/video/api/activityHistoryTitleUpdate">
          <input type="hidden" name="action" value="REMOVE" />
        </form>
      </div>
      ${makeDeleteItem("id-001", "Back to the Future")}
    `;
    expect(AmazonAdapter.getDeleteButtons()).toHaveLength(1);
  });

  it("reflects DOM changes — returns fewer buttons after removal", () => {
    document.body.innerHTML =
      makeDeleteItem("id-001", "Movie A") +
      makeDeleteItem("id-002", "Movie B");

    expect(AmazonAdapter.getDeleteButtons()).toHaveLength(2);

    // Simulate Amazon removing the first item after deletion.
    document.querySelector('[data-automation-id="wh-item-id-001"]').remove();

    expect(AmazonAdapter.getDeleteButtons()).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Static properties
// ---------------------------------------------------------------------------

describe("AmazonAdapter static properties", () => {
  it("has the correct service name", () => {
    expect(AmazonAdapter.name).toBe("Amazon Prime Video");
  });

  it("has a historyUrl pointing to the Amazon watch history page", () => {
    expect(AmazonAdapter.historyUrl).toContain("www.amazon.com");
    expect(AmazonAdapter.historyUrl).toContain("watch-history");
  });
});
