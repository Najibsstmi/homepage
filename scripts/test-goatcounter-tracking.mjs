import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../public/goatcounter-tracking.js', import.meta.url), 'utf8');
function browser(initial) {
  const calls = [];
  const listeners = {};
  const window = {
    location: { href: initial },
    history: {},
    addEventListener: (name, fn) => { listeners[name] = fn; },
  };
  for (const method of ['pushState', 'replaceState']) {
    window.history[method] = (_state, _unused, url) => {
      window.location.href = new URL(url, window.location.href).href;
    };
  }
  const document = {
    referrer: 'https://example.com/', title: 'CikguSTEM',
    addEventListener: (name, fn) => { listeners[name] = fn; },
  };
  vm.runInNewContext(source, { window, document, URL });
  return {
    window, calls,
    load() {
      window.goatcounter.count = (data) => calls.push(data);
      listeners.load({ target: { matches: () => true } });
    },
    back(url) { window.location.href = new URL(url, initial).href; listeners.popstate(); },
  };
}

const b = browser('https://www.cikgustem.com/simulator/sel-kimia?utm_source=test');
assert.equal(b.window.goatcounter.no_onload, true);
b.window.history.pushState({}, '', '/simulator/simulator-baharu');
assert.equal(b.calls.length, 0);
b.load();
assert.deepEqual(b.calls.map(x => x.path), ['/simulator/sel-kimia', '/simulator/simulator-baharu']);
assert.equal(b.calls[0].referrer, 'https://example.com/');
b.window.history.replaceState({}, '', '/simulator/simulator-baharu/#bantuan');
assert.equal(b.calls.length, 2);
b.back('/simulator/sel-kimia');
assert.equal(b.calls.at(-1).path, '/simulator/sel-kimia');
b.load();
assert.equal(b.calls.length, 3);
for (const [route, expected] of [
  ['/?page=simulator', '/simulator'], ['/simulator.html', '/simulator'],
  ['/simulator/aloi', '/simulator/kenali-aloi'], ['/?page=about&utm_source=x', '/?page=about'],
]) {
  const test = browser('https://www.cikgustem.com' + route);
  test.load();
  assert.equal(test.calls[0].path, expected);
}
for (const entry of ['index.html', 'simulator.html']) {
  const html = readFileSync(new URL('../' + entry, import.meta.url), 'utf8');
  assert.ok(html.indexOf('/goatcounter-tracking.js') < html.indexOf('data-goatcounter='));
}
console.log('GoatCounter: direct loads, new routes, async queue, history, deduplication and entry pages passed.');
