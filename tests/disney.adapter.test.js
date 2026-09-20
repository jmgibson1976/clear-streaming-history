const { DisneyPlusAdapter } = require('../services/disney');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeShelf(...items) {
  return `
    <section data-set-style="continue_watching">
      ${items.join('')}
    </section>
  `;
}

function makeItem(title, itemId = title.replace(/\s+/g, '-').toLowerCase()) {
  return `
    <div data-testid="set-shelf-item">
      <span data-testid="cw-set-item-wrapper">
        <a data-testid="set-item" aria-label="${title}" data-item-id="${itemId}"></a>
        <div aria-label="REMOVE" role="button" tabindex="0" data-testid="icon-remove"></div>
      </span>
    </div>
  `;
}

function makeModal() {
  return `
    <div data-testid="confirmation-modal" role="dialog">
      <button aria-label="CANCEL">CANCEL</button>
      <button aria-label="REMOVE"><span>REMOVE</span></button>
    </div>
  `;
}

function makeNextArrow({ disabled = false } = {}) {
  return `
    <button data-testid="arrow-right" aria-disabled="${disabled}"></button>
  `;
}

// ---------------------------------------------------------------------------
// isOnHistoryPage
// ---------------------------------------------------------------------------

describe('DisneyPlusAdapter.isOnHistoryPage()', () => {
  function setPathname(pathname) {
    Object.defineProperty(window, 'location', {
      value: { hostname: 'www.disneyplus.com', pathname },
      writable: true,
      configurable: true,
    });
  }

  it('returns true on /home', () => {
    setPathname('/home');
    expect(DisneyPlusAdapter.isOnHistoryPage()).toBe(true);
  });

  it('returns true on /home/ with trailing slash', () => {
    setPathname('/home/');
    expect(DisneyPlusAdapter.isOnHistoryPage()).toBe(true);
  });

  it('returns false on the root path', () => {
    setPathname('/');
    expect(DisneyPlusAdapter.isOnHistoryPage()).toBe(false);
  });

  it('returns false on an unrelated page', () => {
    setPathname('/browse/entity-abc123');
    expect(DisneyPlusAdapter.isOnHistoryPage()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getDeleteButtons
// ---------------------------------------------------------------------------

describe('DisneyPlusAdapter.getDeleteButtons()', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('returns empty array when no Continue Watching shelf exists', () => {
    expect(DisneyPlusAdapter.getDeleteButtons()).toEqual([]);
  });

  it('returns empty array when the shelf exists but has no items', () => {
    document.body.innerHTML = '<section data-set-style="continue_watching"></section>';
    expect(DisneyPlusAdapter.getDeleteButtons()).toEqual([]);
  });

  it('returns one button for a single item', () => {
    document.body.innerHTML = makeShelf(makeItem('Get Away'));
    const buttons = DisneyPlusAdapter.getDeleteButtons();
    expect(buttons).toHaveLength(1);
  });

  it('returns a button for each item', () => {
    document.body.innerHTML = makeShelf(
      makeItem('Get Away'),
      makeItem('Shoresy'),
      makeItem('The Americans')
    );
    expect(DisneyPlusAdapter.getDeleteButtons()).toHaveLength(3);
  });

  it('each button has aria-label REMOVE', () => {
    document.body.innerHTML = makeShelf(makeItem('Get Away'));
    const [btn] = DisneyPlusAdapter.getDeleteButtons();
    expect(btn.getAttribute('aria-label')).toBe('REMOVE');
  });

  it('does not return REMOVE buttons from other shelf types', () => {
    document.body.innerHTML = `
      <section data-set-style="trending">
        <div aria-label="REMOVE" role="button"></div>
      </section>
      ${makeShelf(makeItem('Shoresy'))}
    `;
    expect(DisneyPlusAdapter.getDeleteButtons()).toHaveLength(1);
  });

  it('does not return REMOVE buttons with tabindex="-1" (off-screen carousel items)', () => {
    document.body.innerHTML = `
      <section data-set-style="continue_watching">
        <div aria-label="REMOVE" role="button" tabindex="-1"></div>
        <div aria-label="REMOVE" role="button" tabindex="0"></div>
      </section>
    `;
    expect(DisneyPlusAdapter.getDeleteButtons()).toHaveLength(1);
  });

  it('reflects DOM changes — returns fewer buttons after removal', () => {
    document.body.innerHTML = makeShelf(makeItem('Movie A'), makeItem('Movie B'));
    expect(DisneyPlusAdapter.getDeleteButtons()).toHaveLength(2);

    document.querySelector('[data-testid="set-shelf-item"]').remove();

    expect(DisneyPlusAdapter.getDeleteButtons()).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// deleteItem
// ---------------------------------------------------------------------------

describe('DisneyPlusAdapter.deleteItem()', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    document.body.innerHTML = '';
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('clicks the card REMOVE button', async () => {
    document.body.innerHTML = makeShelf(makeItem('Shoresy')) + makeModal();
    const [btn] = DisneyPlusAdapter.getDeleteButtons();
    const clickSpy = jest.spyOn(btn, 'click');

    const promise = DisneyPlusAdapter.deleteItem(btn);
    await jest.runAllTimersAsync();
    await promise;

    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it('clicks the confirm REMOVE button in the modal', async () => {
    document.body.innerHTML = makeShelf(makeItem('Shoresy')) + makeModal();
    const [btn] = DisneyPlusAdapter.getDeleteButtons();
    const confirmBtn = document.querySelector(
      '[data-testid="confirmation-modal"] button[aria-label="REMOVE"]'
    );
    const confirmSpy = jest.spyOn(confirmBtn, 'click');

    const promise = DisneyPlusAdapter.deleteItem(btn);
    await jest.runAllTimersAsync();
    await promise;

    expect(confirmSpy).toHaveBeenCalledTimes(1);
  });

  it('waits for the modal to disappear before returning', async () => {
    document.body.innerHTML = makeShelf(makeItem('Shoresy')) + makeModal();
    const [btn] = DisneyPlusAdapter.getDeleteButtons();

    // Simulate modal being removed after confirm click.
    const confirmBtn = document.querySelector(
      '[data-testid="confirmation-modal"] button[aria-label="REMOVE"]'
    );
    jest.spyOn(confirmBtn, 'click').mockImplementation(() => {
      document.querySelector('[data-testid="confirmation-modal"]').remove();
    });

    const promise = DisneyPlusAdapter.deleteItem(btn);
    await jest.runAllTimersAsync();
    const result = await promise;

    expect(result).toBe(true);
    expect(document.querySelector('[data-testid="confirmation-modal"]')).toBeNull();
  });

  it('returns true after confirming', async () => {
    document.body.innerHTML = makeShelf(makeItem('Shoresy')) + makeModal();
    const [btn] = DisneyPlusAdapter.getDeleteButtons();

    const promise = DisneyPlusAdapter.deleteItem(btn);
    await jest.runAllTimersAsync();

    await expect(promise).resolves.toBe(true);
  });

  it('does not throw when modal never appears', async () => {
    document.body.innerHTML = makeShelf(makeItem('Shoresy'));
    const [btn] = DisneyPlusAdapter.getDeleteButtons();

    const promise = DisneyPlusAdapter.deleteItem(btn);
    await jest.runAllTimersAsync();

    await expect(promise).resolves.toBe(true);
  });

  it('does not click the right arrow when items remain after deletion', async () => {
    document.body.innerHTML =
      makeShelf(makeItem('Get Away'), makeItem('Shoresy')) + makeModal() + makeNextArrow();
    const [btn] = DisneyPlusAdapter.getDeleteButtons();
    const arrowSpy = jest.spyOn(
      document.querySelector('[data-testid="arrow-right"]'),
      'click'
    );

    // Simulate the item remaining (jsdom won't actually remove it after click).
    const promise = DisneyPlusAdapter.deleteItem(btn);
    await jest.runAllTimersAsync();
    await promise;

    expect(arrowSpy).not.toHaveBeenCalled();
  });

  it('clicks the right arrow when visible items are exhausted and more pages remain', async () => {
    // Empty shelf = all visible items already removed. Arrow is enabled.
    document.body.innerHTML = makeShelf() + makeModal() + makeNextArrow({ disabled: false });
    const btn = document.createElement('div');
    btn.setAttribute('aria-label', 'REMOVE');
    btn.setAttribute('role', 'button');
    const arrowSpy = jest.spyOn(
      document.querySelector('[data-testid="arrow-right"]'),
      'click'
    );

    const promise = DisneyPlusAdapter.deleteItem(btn);
    await jest.runAllTimersAsync();
    await promise;

    expect(arrowSpy).toHaveBeenCalledTimes(1);
  });

  it('does not click the right arrow when it is disabled', async () => {
    document.body.innerHTML = makeShelf() + makeModal() + makeNextArrow({ disabled: true });
    const btn = document.createElement('div');
    btn.setAttribute('aria-label', 'REMOVE');
    const arrowSpy = jest.spyOn(
      document.querySelector('[data-testid="arrow-right"]'),
      'click'
    );

    const promise = DisneyPlusAdapter.deleteItem(btn);
    await jest.runAllTimersAsync();
    await promise;

    expect(arrowSpy).not.toHaveBeenCalled();
  });

  it('does not throw when no right arrow exists', async () => {
    document.body.innerHTML = makeShelf();
    const btn = document.createElement('div');

    const promise = DisneyPlusAdapter.deleteItem(btn);
    await jest.runAllTimersAsync();
    await expect(promise).resolves.toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Static properties
// ---------------------------------------------------------------------------

describe('DisneyPlusAdapter static properties', () => {
  it('has the correct service name', () => {
    expect(DisneyPlusAdapter.name).toBe('Disney+');
  });

  it('has a historyUrl pointing to the Disney+ home page', () => {
    expect(DisneyPlusAdapter.historyUrl).toContain('disneyplus.com');
    expect(DisneyPlusAdapter.historyUrl).toContain('/home');
  });
});
