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
      this.shadowRoot = { innerHTML: "", querySelector: () => ({ addEventListener() {} }) };
      return this.shadowRoot;
    }
  }
  const context = {
    HTMLElement,
    Event: class {},
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
