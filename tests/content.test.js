// Tests for content.js message-handler guard logic.
// Chrome API integration paths (startClearing's full loop) are skipped per CLAUDE.md.
// We test only the synchronous guard that rejects duplicate starts and accepts stops.

let messageListener;

beforeEach(() => {
  jest.useFakeTimers();

  const fakeBtn = document.createElement('button');
  const fakeAdapter = {
    name: 'TestService',
    isOnHistoryPage: () => true,
    getDeleteButtons: jest.fn().mockReturnValue([fakeBtn]),
  };

  global.log = jest.fn();
  global.getAdapter = jest.fn().mockReturnValue(fakeAdapter);
  global.chrome = {
    runtime: {
      onMessage: { addListener: jest.fn() },
      sendMessage: jest.fn().mockResolvedValue(undefined),
    },
  };

  jest.resetModules();
  require('../content');

  messageListener = global.chrome.runtime.onMessage.addListener.mock.calls[0][0];
});

afterEach(() => {
  jest.useRealTimers();
  delete global.log;
  delete global.getAdapter;
  delete global.chrome;
});

describe('onMessage: start action', () => {
  it('returns { ok: true } when not already running', () => {
    const sendResponse = jest.fn();
    messageListener({ action: 'start' }, {}, sendResponse);
    expect(sendResponse).toHaveBeenCalledWith({ ok: true });
  });

  it('returns { ok: false, reason: "already running" } when a second start arrives mid-run', () => {
    // startClearing() sets running = true synchronously before its first await,
    // so the guard fires on the very next message without advancing timers.
    const resp1 = jest.fn();
    const resp2 = jest.fn();

    messageListener({ action: 'start' }, {}, resp1);
    messageListener({ action: 'start' }, {}, resp2);

    expect(resp1).toHaveBeenCalledWith({ ok: true });
    expect(resp2).toHaveBeenCalledWith({ ok: false, reason: 'already running' });
  });
});

describe('onMessage: stop action', () => {
  it('returns { ok: true }', () => {
    const sendResponse = jest.fn();
    messageListener({ action: 'stop' }, {}, sendResponse);
    expect(sendResponse).toHaveBeenCalledWith({ ok: true });
  });

  it('allows a subsequent start after stopping', () => {
    const resp = jest.fn();

    messageListener({ action: 'start' }, {}, jest.fn()); // running = true
    messageListener({ action: 'stop' }, {}, jest.fn());  // running = false
    messageListener({ action: 'start' }, {}, resp);      // should succeed

    expect(resp).toHaveBeenCalledWith({ ok: true });
  });
});
