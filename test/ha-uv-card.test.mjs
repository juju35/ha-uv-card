// Unit tests for src/ha-uv-card.js, run with `node --test` (no dependencies).
// The source is a browser script with build placeholders, so it is evaluated in
// a small sandbox that stubs the few DOM APIs it uses.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";

const source = readFileSync(new URL("../src/ha-uv-card.js", import.meta.url), "utf8")
  .replace("__VERSION__", "test")
  .replace("__ICONS__", "{}");

// `shared` carries the page-wide objects (custom element registry, card picker
// list) between two loads of the module, each load having its own scope.
function sandbox(shared = { registry: new Map(), customCards: undefined }) {
  const { registry } = shared;
  class HTMLElement {
    attachShadow() {
      // The ha-card keeps its listeners so a test can fire them
      const card = { listeners: {}, addEventListener(type, fn) { this.listeners[type] = fn; } };
      this.shadowRoot = { innerHTML: "", card, querySelector: () => card };
      return this.shadowRoot;
    }
    dispatchEvent(event) {
      (this.events ||= []).push(event);
    }
  }
  const context = {
    HTMLElement,
    CustomEvent: class {
      constructor(type, init = {}) {
        Object.assign(this, init, { type });
      }
    },
    console: { info() {} },
    document: { querySelector: () => null },
    customElements: {
      get: (name) => registry.get(name),
      define: (name, cls) => {
        if (registry.has(name)) throw new Error(`NotSupportedError: ${name} already defined`);
        registry.set(name, cls);
      },
    },
  };
  context.window = context;
  context.customCards = shared.customCards;
  context.shared = shared;
  vm.createContext(context);
  return context;
}

function render(state) {
  const ctx = sandbox();
  vm.runInContext(source, ctx);
  const card = new (ctx.customElements.get("ha-uv-card"))();
  card.setConfig({ entity: "sensor.uv", language: "en" });
  card.hass = { language: "en", states: { "sensor.uv": { state: String(state), attributes: {} } } };
  return card.shadowRoot.innerHTML;
}

const label = (html) => html.match(/<div class="label">([^<]*)<\/div>/)[1];
const value = (html) => html.match(/<div class="value">([^<]*)<\/div>/)[1];

test("the risk level follows the displayed (rounded) value", () => {
  for (const [state, shown, level] of [
    [2.4, "2", "Low"],
    [2.5, "3", "Moderate"],
    [5.4, "5", "Moderate"],
    [7.4, "7", "High"],
    [10.4, "10", "Very High"],
    [10.5, "11", "Extreme"],
  ]) {
    const html = render(state);
    assert.equal(value(html), shown, `value for ${state}`);
    assert.equal(label(html), level, `level for ${state}`);
  }
});

test("a non-numeric state is unavailable", () => {
  const html = render("unknown");
  assert.equal(value(html), "—");
  assert.equal(label(html), "Unavailable");
});

test("loading the resource twice does not throw nor duplicate the picker entry", () => {
  const first = sandbox();
  vm.runInContext(source, first);
  first.shared.customCards = first.customCards;
  const second = sandbox(first.shared);
  assert.doesNotThrow(() => vm.runInContext(source, second));
  assert.equal(second.customCards.filter((c) => c.type === "ha-uv-card").length, 1);
});

function card(lang = "en") {
  const ctx = sandbox();
  vm.runInContext(source, ctx);
  const el = new (ctx.customElements.get("ha-uv-card"))();
  el.setConfig({ entity: "sensor.uv" });
  el.hass = { language: lang, states: { "sensor.uv": { state: "4", attributes: {} } } };
  return { ctx, el };
}

test("the card is a focusable button that opens more-info with Enter or Space", () => {
  const { el } = card();
  assert.match(el.shadowRoot.innerHTML, /<ha-card role="button" tabindex="0">/);
  const { listeners } = el.shadowRoot.card;
  let prevented = 0;
  for (const key of ["Enter", " ", "a"]) listeners.keydown({ key, preventDefault: () => prevented++ });
  listeners.click();
  assert.equal(prevented, 2);
  assert.equal(el.events.length, 3);
  for (const ev of el.events) {
    assert.equal(ev.type, "hass-more-info");
    assert.deepEqual({ ...ev.detail }, { entityId: "sensor.uv" });
    assert.equal(ev.bubbles, true);
    assert.equal(ev.composed, true);
  }
});

test("every language has the editor labels", () => {
  const ctx = sandbox();
  vm.runInContext(`${source}\nshared.TRANSLATIONS = TRANSLATIONS;`, ctx);
  const { TRANSLATIONS } = ctx.shared;
  const keys = Object.keys(TRANSLATIONS.en).sort();
  for (const [lang, dict] of Object.entries(TRANSLATIONS)) {
    assert.deepEqual(Object.keys(dict).sort(), keys, lang);
  }
});
