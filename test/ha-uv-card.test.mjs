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
// A minimal DOM: elements keep their children, attributes, listeners and
// textContent, and count innerHTML writes (the icon swaps), which is all the
// card uses. querySelector matches a ".class" or a tag name, depth first.
class FakeElement {
  constructor(tag, root) {
    this.tagName = tag.toUpperCase();
    this.root = root;
    this.children = [];
    this.attributes = {};
    this.listeners = {};
    this.className = "";
    this.textContent = "";
    this.hidden = false;
    this.html = "";
    this.htmlWrites = 0;
    this.style = { props: {}, setProperty(k, v) { this.props[k] = v; } };
  }
  appendChild(child) {
    child.root = this.root;
    this.children.push(child);
    return child;
  }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  getAttribute(name) { return name in this.attributes ? this.attributes[name] : null; }
  toggleAttribute(name, force) {
    if (force) this.attributes[name] = "";
    else delete this.attributes[name];
    return !!force;
  }
  get innerHTML() { return this.html; }
  set innerHTML(html) { this.html = html; this.htmlWrites++; }
  addEventListener(type, fn) { this.listeners[type] = fn; }
  focus(options) {
    this.root.activeElement = this;
    this.root.focusOptions = options;
  }
  querySelector(selector) {
    for (const child of this.children) {
      const hit = selector.startsWith(".")
        ? child.className.split(" ").includes(selector.slice(1))
        : child.tagName === selector.toUpperCase();
      if (hit) return child;
      const deep = child.querySelector(selector);
      if (deep) return deep;
    }
    return null;
  }
}

// `shared` carries the page-wide objects (custom element registry, card picker
// list) between two loads of the module, each load having its own scope.
function sandbox(shared = { registry: new Map(), customCards: undefined }) {
  const { registry } = shared;
  class HTMLElement {
    attachShadow() {
      const root = new FakeElement("#shadow-root", null);
      root.root = root;
      root.activeElement = null;
      this.shadowRoot = root;
      return root;
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
    document: { querySelector: () => null, createElement: (tag) => new FakeElement(tag, null) },
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

const hassWith = (state, lang = "en") => ({ language: lang, states: { "sensor.uv": { state: String(state), attributes: {} } } });

function render(state, config = {}) {
  const ctx = sandbox();
  vm.runInContext(source, ctx);
  const card = new (ctx.customElements.get("ha-uv-card"))();
  card.setConfig({ entity: "sensor.uv", language: "en", ...config });
  card.hass = hassWith(state);
  return card.shadowRoot;
}

const label = (root) => root.querySelector(".label").textContent;
const value = (root) => root.querySelector(".value").textContent;

test("the risk level follows the displayed (rounded) value", () => {
  for (const [state, shown, level] of [
    [2.4, "2", "Low"],
    [2.5, "3", "Moderate"],
    [5.4, "5", "Moderate"],
    [7.4, "7", "High"],
    [10.4, "10", "Very High"],
    [10.5, "11", "Extreme"],
  ]) {
    const root = render(state);
    assert.equal(value(root), shown, `value for ${state}`);
    assert.equal(label(root), level, `level for ${state}`);
  }
});

test("a non-numeric state is unavailable", () => {
  const root = render("unknown");
  assert.equal(value(root), "—");
  assert.equal(label(root), "Unavailable");
});

test("an empty or blank state is unavailable, not 0", () => {
  for (const state of ["", " "]) {
    const root = render(state);
    assert.equal(value(root), "—", JSON.stringify(state));
    assert.equal(label(root), "Unavailable", JSON.stringify(state));
  }
});

test("a negative reading is shown as 0 (Low)", () => {
  const root = render(-1);
  assert.equal(value(root), "0");
  assert.equal(label(root), "Low");
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
  el.hass = hassWith(4, lang);
  return { ctx, el };
}

test("the card is a focusable button that opens more-info with Enter or Space", () => {
  const { el } = card();
  const haCard = el.shadowRoot.querySelector("ha-card");
  assert.equal(haCard.getAttribute("role"), "button");
  assert.equal(haCard.getAttribute("tabindex"), "0");
  const { listeners } = haCard;
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

test("the editor language selector starts with an auto (empty) option", () => {
  const ctx = sandbox();
  vm.runInContext(source, ctx);
  const form = ctx.shared.registry.get("ha-uv-card").getConfigForm();
  const language = form.schema.find((field) => field.name === "language");
  const options = language.selector.select.options;
  assert.deepEqual({ ...options[0] }, { value: "", label: "Auto (Home Assistant)" });
  assert.ok(options.length > 1);
  const grid = form.schema.find((field) => field.type === "grid");
  assert.equal(form.computeLabel(grid), "");
  assert.equal(form.computeLabel(language), "Language");
});

test("the stylesheet and the card are built once, the icon only swapped when the index changes", () => {
  const { el } = card();
  const root = el.shadowRoot;
  const haCard = root.querySelector("ha-card");
  const icon = root.querySelector(".icon");
  assert.equal(root.children.length, 2);
  const writes = icon.htmlWrites;
  // Same rounded index (4): text may change, the icon and its animation stay.
  el.hass = hassWith(4.2);
  el.setConfig({ entity: "sensor.uv", name: "Garden", layout: "vertical", transparent: true, align: "top" });
  assert.equal(root.querySelector("ha-card"), haCard);
  assert.equal(root.children.length, 2);
  assert.equal(icon.htmlWrites, writes);
  assert.equal(root.querySelector(".name").textContent, "Garden");
  assert.equal(haCard.getAttribute("data-layout"), "vertical");
  assert.equal(haCard.getAttribute("data-align"), "top");
  assert.equal(haCard.getAttribute("data-transparent"), "");
  assert.equal(haCard.style.props["--uv-color"], "#f9a825");
  // A new index swaps the icon and the color.
  el.hass = hassWith(8);
  assert.equal(icon.htmlWrites, writes + 1);
  assert.equal(haCard.style.props["--uv-color"], "#b71c1c");
});

test("show_value and show_label hide their element", () => {
  const root = render(4, { show_value: false, show_label: false });
  assert.equal(root.querySelector(".value").hidden, true);
  assert.equal(root.querySelector(".label").hidden, true);
  const shown = render(4);
  assert.equal(shown.querySelector(".value").hidden, false);
  assert.equal(shown.querySelector(".label").hidden, false);
});

test("a focused card keeps the keyboard focus when the value changes", () => {
  const { el } = card();
  const haCard = el.shadowRoot.querySelector("ha-card");
  haCard.focus();
  el.hass = hassWith(8);
  assert.equal(el.shadowRoot.querySelector("ha-card"), haCard);
  assert.equal(el.shadowRoot.activeElement, haCard);
});

test("an unfocused card does not take the focus when the value changes", () => {
  const { el } = card();
  el.hass = hassWith(8);
  assert.equal(el.shadowRoot.activeElement, null);
});
