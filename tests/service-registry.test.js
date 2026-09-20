const { AmazonAdapter } = require("../services/amazon");
const { DisneyPlusAdapter } = require("../services/disney");

// Expose adapters as globals so services/index.js can reference them
// the same way it would in the browser.
global.AmazonAdapter = AmazonAdapter;
global.DisneyPlusAdapter = DisneyPlusAdapter;

const { getAdapter, SERVICE_REGISTRY } = require("../services/index");

// ---------------------------------------------------------------------------
// SERVICE_REGISTRY
// ---------------------------------------------------------------------------

describe("SERVICE_REGISTRY", () => {
  it("contains an entry for www.amazon.com", () => {
    expect(SERVICE_REGISTRY).toHaveProperty(["www.amazon.com"]);
  });

  it("maps www.amazon.com to the AmazonAdapter", () => {
    expect(SERVICE_REGISTRY["www.amazon.com"]).toBe(AmazonAdapter);
  });

  it("contains an entry for www.disneyplus.com", () => {
    expect(SERVICE_REGISTRY).toHaveProperty(["www.disneyplus.com"]);
  });

  it("maps www.disneyplus.com to the DisneyPlusAdapter", () => {
    expect(SERVICE_REGISTRY["www.disneyplus.com"]).toBe(DisneyPlusAdapter);
  });

});

// ---------------------------------------------------------------------------
// getAdapter
// ---------------------------------------------------------------------------

describe("getAdapter()", () => {
  function setHostname(hostname) {
    Object.defineProperty(window, "location", {
      value: { hostname, pathname: "/" },
      writable: true,
      configurable: true,
    });
  }

  it("returns AmazonAdapter when on www.amazon.com", () => {
    setHostname("www.amazon.com");
    expect(getAdapter()).toBe(AmazonAdapter);
  });

  it("returns DisneyPlusAdapter when on www.disneyplus.com", () => {
    setHostname("www.disneyplus.com");
    expect(getAdapter()).toBe(DisneyPlusAdapter);
  });

  it("returns null for an unsupported hostname", () => {
    setHostname("www.netflix.com");
    expect(getAdapter()).toBeNull();
  });

  it("returns null for an empty hostname", () => {
    setHostname("");
    expect(getAdapter()).toBeNull();
  });

  it("Amazon adapter has the required interface", () => {
    setHostname("www.amazon.com");
    const adapter = getAdapter();
    expect(typeof adapter.name).toBe("string");
    expect(typeof adapter.historyUrl).toBe("string");
    expect(typeof adapter.isOnHistoryPage).toBe("function");
    expect(typeof adapter.getDeleteButtons).toBe("function");
  });

  it("Disney+ adapter has the required interface", () => {
    setHostname("www.disneyplus.com");
    const adapter = getAdapter();
    expect(typeof adapter.name).toBe("string");
    expect(typeof adapter.historyUrl).toBe("string");
    expect(typeof adapter.isOnHistoryPage).toBe("function");
    expect(typeof adapter.getDeleteButtons).toBe("function");
    expect(typeof adapter.deleteItem).toBe("function");
  });
});
