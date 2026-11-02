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
  removeAttribute(name) { delete this.attributes[name]; }
  getAttribute(name) { return name in this.attributes ? this.attributes[name] : null; }
  toggleAttribute(name, force) {
    if (force) this.attributes[name] = "";
    else delete this.attributes[name];
    return !!force;
  }
  get innerHTML() { return this.html; }
  set innerHTML(html) {
    this.html = html;
    this.htmlWrites++;
    // An inlined SVG becomes one <svg> child that records SMIL control calls.
    this.children = [];
    if (String(html).startsWith("<svg")) {
      const svg = this.appendChild(new FakeElement("svg", this.root));
      svg.smil = [];
      svg.pauseAnimations = () => svg.smil.push("pause");
      svg.setCurrentTime = (t) => svg.smil.push(`time ${t}`);
    }
  }
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
function sandbox(shared = { registry: new Map(), customCards: undefined }, extra = {}) {
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
  Object.assign(context, extra);
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

const placeholders = (text) => (String(text).match(/\{\w+\}/g) || []).sort();

test("every language has the same keys, array lengths and placeholders as English, and no empty value", () => {
  const ctx = sandbox();
  vm.runInContext(`${source}\nshared.TRANSLATIONS = TRANSLATIONS;`, ctx);
  const { TRANSLATIONS } = ctx.shared;
  const langs = ["fr", "de", "es", "it", "nl", "pt", "pl", "sr", "sr-Latn"];
  assert.deepEqual(Object.keys(TRANSLATIONS).sort(), ["en", ...langs].sort());
  for (const lang of langs) {
    const dict = TRANSLATIONS[lang];
    assert.ok(dict, lang);
    assert.deepEqual(Object.keys(dict).sort(), Object.keys(TRANSLATIONS.en).sort(), lang);
    for (const [key, value] of Object.entries(TRANSLATIONS.en)) {
      if (Array.isArray(value)) assert.equal(dict[key].length, value.length, `${lang}.${key}`);
      assert.deepEqual(placeholders(dict[key]), placeholders(value), `${lang}.${key}`);
      assert.ok(String(dict[key]).trim() !== "", `${lang}.${key} is empty`);
    }
  }
});

test("sr is written in Cyrillic and sr-Latn in Latin (brand names aside)", () => {
  const ctx = sandbox();
  vm.runInContext(`${source}\nshared.TRANSLATIONS = TRANSLATIONS;`, ctx);
  const { TRANSLATIONS } = ctx.shared;
  const strip = (text) => String(text).replace(/Home Assistant/g, "");
  for (const [key, value] of Object.entries(TRANSLATIONS.sr)) {
    assert.doesNotMatch(strip(value), /[A-Za-z]/, `sr.${key}`);
  }
  for (const [key, value] of Object.entries(TRANSLATIONS["sr-Latn"])) {
    assert.doesNotMatch(value, /[Ѐ-ӿ]/, `sr-Latn.${key}`);
  }
});

test("the language resolves to the full code, then the base code, then English", () => {
  const ctx = sandbox();
  vm.runInContext(`${source}\nshared.localize = localize;`, ctx);
  const { localize } = ctx.shared;
  assert.equal(localize("ed_language", "fr-FR"), "Langue");
  assert.equal(localize("ed_language", "sr-Latn"), "Jezik");
  assert.equal(localize("ed_language", "sr"), "Језик");
  assert.equal(localize("ed_language", "sr-Cyrl"), "Језик");
  // pt has a translation in this card, so pt-BR falls back to it.
  assert.equal(localize("ed_language", "pt-BR"), "Idioma");
  assert.equal(localize("ed_language", "ja-JP"), "Language");
  assert.equal(localize("ed_language", "ja"), "Language");
  assert.equal(localize("ed_language", undefined), "Language");
});

test("it, nl, pt and pl resolve from their regional codes, pt-BR falls back to European Portuguese", () => {
  const ctx = sandbox();
  vm.runInContext(`${source}\nshared.resolveLang = resolveLang;`, ctx);
  const { resolveLang } = ctx.shared;
  assert.equal(resolveLang("it-IT"), "it");
  assert.equal(resolveLang("nl-BE"), "nl");
  assert.equal(resolveLang("pt"), "pt");
  assert.equal(resolveLang("pt-BR"), "pt");
  assert.equal(resolveLang("pl-PL"), "pl");
  assert.equal(resolveLang("sr-Latn"), "sr-Latn");
  assert.equal(resolveLang("ja"), "en");
});

test("Home Assistant set to pl-PL shows the card and the editor in Polish", () => {
  const ctx = sandbox();
  vm.runInContext(source, ctx);
  const card = new (ctx.customElements.get("ha-uv-card"))();
  card.setConfig({ entity: "sensor.uv" });
  card.hass = hassWith(4, "pl-PL");
  assert.equal(card.shadowRoot.querySelector(".name").textContent, "Indeks UV");
  assert.equal(label(card.shadowRoot), "Umiarkowany");
  const editor = { querySelector: () => ({ hass: { language: "pl-PL" } }) };
  const ctx2 = sandbox(undefined, { document: { ...ctx.document, ...editor } });
  vm.runInContext(source, ctx2);
  const form = ctx2.shared.registry.get("ha-uv-card").getConfigForm();
  assert.equal(form.computeLabel({ name: "language" }), "Język");
});

test("Home Assistant set to sr-Latn shows the card and the editor in Latin script", () => {
  const ctx = sandbox();
  vm.runInContext(source, ctx);
  const card = new (ctx.customElements.get("ha-uv-card"))();
  card.setConfig({ entity: "sensor.uv" });
  card.hass = hassWith(4, "sr-Latn");
  assert.equal(card.shadowRoot.querySelector(".name").textContent, "UV indeks");
  assert.equal(label(card.shadowRoot), "Umeren");
  const editor = { querySelector: () => ({ hass: { language: "sr-Latn" } }) };
  const ctx2 = sandbox(undefined, { document: { ...ctx.document, ...editor } });
  vm.runInContext(source, ctx2);
  const form = ctx2.shared.registry.get("ha-uv-card").getConfigForm();
  assert.equal(form.computeLabel({ name: "language" }), "Jezik");
});

test("the editor offers Serbian in Cyrillic and Latin script", () => {
  const ctx = sandbox();
  vm.runInContext(source, ctx);
  const form = ctx.shared.registry.get("ha-uv-card").getConfigForm();
  const options = form.schema.find((field) => field.name === "language").selector.select.options;
  const labels = Object.fromEntries(options.map((o) => [o.value, o.label]));
  assert.equal(labels.sr, "Српски");
  assert.equal(labels["sr-Latn"], "Srpski (latinica)");
});

test("the editor offers Italian, Dutch, Portuguese and Polish", () => {
  const ctx = sandbox();
  vm.runInContext(source, ctx);
  const form = ctx.shared.registry.get("ha-uv-card").getConfigForm();
  const options = form.schema.find((field) => field.name === "language").selector.select.options;
  const labels = Object.fromEntries(options.map((o) => [o.value, o.label]));
  assert.equal(labels.it, "Italiano");
  assert.equal(labels.nl, "Nederlands");
  assert.equal(labels.pt, "Português (Portugal)");
  assert.equal(labels.pl, "Polski");
  // One option per translation, plus the leading auto option.
  vm.runInContext("shared.TRANSLATIONS = TRANSLATIONS;", ctx);
  assert.deepEqual([...options.slice(1).map((o) => o.value)].sort(), [...Object.keys(ctx.shared.TRANSLATIONS)].sort());
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

// getGridOptions (12-column sections grid) arrived with Home Assistant 2024.11
// (frontend 20241105.0); earlier releases only call getLayoutOptions, so the
// card's sections size is ignored there. The declared minimum must follow.
const readRoot = (name) => readFileSync(new URL(`../${name}`, import.meta.url), "utf8");
const haVersion = (v) => v.split(".").slice(0, 2).map(Number);
const atLeast = ([y, m], [ry, rm]) => y > ry || (y === ry && m >= rm);

test("hacs.json requires Home Assistant 2024.11, where getGridOptions exists", () => {
  assert.match(source, /getGridOptions\(\)/);
  const { homeassistant } = JSON.parse(readRoot("hacs.json"));
  assert.ok(atLeast(haVersion(homeassistant), [2024, 11]), `hacs.json: ${homeassistant}`);
});

test("the README prerequisite matches the hacs.json minimum", () => {
  const { homeassistant } = JSON.parse(readRoot("hacs.json"));
  const readme = readRoot("README.md").match(/Home Assistant (\d{4}\.\d+) or later/);
  assert.ok(readme, "README prerequisite line not found");
  assert.deepEqual(haVersion(readme[1]), haVersion(homeassistant));
});

// Contrast (WCAG 2.x) of the risk text against what is behind it, computed from
// the card's own stylesheet with Home Assistant's default light and dark themes
// (the screenshot themes). A tiny resolver handles var() and color-mix() in srgb.
const THEMES = {
  light: { "--card-background-color": "#ffffff", "--primary-text-color": "#212121", "--secondary-text-color": "#727272" },
  dark: { "--card-background-color": "#1c1c1c", "--primary-text-color": "#e1e1e1", "--secondary-text-color": "#9b9b9b" },
};

function splitArgs(text) {
  const out = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "(") depth++;
    else if (text[i] === ")") depth--;
    else if (text[i] === "," && depth === 0) {
      out.push(text.slice(start, i).trim());
      start = i + 1;
    }
  }
  out.push(text.slice(start).trim());
  return out;
}

// Returns [r, g, b, a] with premultiplied mixing, as color-mix() does.
function resolveColor(expr, vars) {
  expr = expr.trim();
  const v = expr.match(/^var\((--[\w-]+)\)$/);
  if (v) {
    assert.ok(v[1] in vars, `unknown variable ${v[1]}`);
    return resolveColor(vars[v[1]], vars);
  }
  if (expr === "transparent") return [0, 0, 0, 0];
  const hex = expr.match(/^#([0-9a-f]{6})$/i);
  if (hex) return [0, 2, 4].map((i) => parseInt(hex[1].slice(i, i + 2), 16)).concat(1);
  const mix = expr.match(/^color-mix\(in srgb,(.*)\)$/s);
  assert.ok(mix, `unsupported color ${expr}`);
  const [a, b] = splitArgs(mix[1]).map((part) => {
    const m = part.match(/^(.*?)(?:\s+([\d.]+)%)?$/s);
    return { color: resolveColor(m[1], vars), pct: m[2] === undefined ? null : Number(m[2]) / 100 };
  });
  const pa = a.pct ?? (b.pct === null ? 0.5 : 1 - b.pct);
  const pb = 1 - pa;
  const alpha = a.color[3] * pa + b.color[3] * pb;
  if (alpha === 0) return [0, 0, 0, 0];
  const rgb = [0, 1, 2].map((i) => (a.color[i] * a.color[3] * pa + b.color[i] * b.color[3] * pb) / alpha);
  return [...rgb, alpha];
}

const over = (top, bottom) => [0, 1, 2].map((i) => top[i] * top[3] + bottom[i] * (1 - top[3])).concat(1);
const luminance = (rgb) =>
  rgb.slice(0, 3).reduce((sum, c, i) => {
    const s = c / 255;
    const l = s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    return sum + l * [0.2126, 0.7152, 0.0722][i];
  }, 0);
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

// Declarations of the first rule whose selector is exactly `selector`.
function declarations(css, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const rule = css.replace(/\/\*.*?\*\//gs, "").match(new RegExp(`(?:^|\\})\\s*${escaped}\\s*\\{([^}]*)\\}`));
  assert.ok(rule, `rule ${selector} not found`);
  return Object.fromEntries(
    rule[1].split(";").map((d) => d.split(/:(.*)/s).map((x) => x.trim())).filter(([k, val]) => k && val),
  );
}

test("the risk value, label and badge icon are readable in light and dark themes", () => {
  // Value: 30px text (large, 3:1). Label: 11px text (4.5:1). Badge: meaningful icon (3:1).
  const targets = [
    { selector: ".value", min: 3, bg: null },
    { selector: ".label", min: 4.5, bg: ".label" },
    { selector: ".badge", min: 3, bg: ".badge" },
  ];
  for (const state of [1, 4, 6, 9, 11, "unavailable"]) {
    const root = render(state);
    const css = root.querySelector("style").textContent;
    const haCard = root.querySelector("ha-card");
    const cardVars = Object.fromEntries(Object.entries(declarations(css, "ha-card")).filter(([k]) => k.startsWith("--")));
    for (const [theme, themeVars] of Object.entries(THEMES)) {
      const vars = { ...themeVars, ...cardVars, ...haCard.style.props };
      const cardBg = resolveColor("var(--card-background-color)", vars);
      for (const { selector, min, bg } of targets) {
        const decl = declarations(css, selector);
        const behind = bg ? over(resolveColor(decl.background, vars), cardBg) : cardBg;
        const ratio = contrast(over(resolveColor(decl.color, vars), behind), behind);
        assert.ok(ratio >= min, `${selector} at UV ${state} (${theme}): ${ratio.toFixed(2)}:1 < ${min}:1`);
      }
    }
  }
});

// Each test icon is a bare <svg> so the fake DOM exposes it to querySelector.
const svgSource = readFileSync(new URL("../src/ha-uv-card.js", import.meta.url), "utf8")
  .replace("__VERSION__", "test")
  .replace("__ICONS__", () => JSON.stringify({ default: "<svg></svg>", ...Object.fromEntries([...Array(12).keys()].map((i) => [i, "<svg></svg>"])) }));

function motionCard(reduce) {
  const extra = reduce === undefined ? {} : { matchMedia: (q) => ({ matches: reduce && q === "(prefers-reduced-motion: reduce)" }) };
  const ctx = sandbox(undefined, extra);
  vm.runInContext(svgSource, ctx);
  const el = new (ctx.customElements.get("ha-uv-card"))();
  el.setConfig({ entity: "sensor.uv" });
  el.hass = hassWith(4);
  return el;
}

test("with prefers-reduced-motion the icon's SMIL rotation is paused, also after an icon swap", () => {
  const el = motionCard(true);
  const svg = () => el.shadowRoot.querySelector(".icon").querySelector("svg");
  assert.deepEqual(svg().smil, ["pause", "time 0"]);
  el.hass = hassWith(8);
  assert.deepEqual(svg().smil, ["pause", "time 0"]);
});

test("without a reduced-motion preference (or matchMedia) the icon keeps animating", () => {
  for (const reduce of [false, undefined]) {
    const el = motionCard(reduce);
    assert.deepEqual(el.shadowRoot.querySelector(".icon").querySelector("svg").smil, [], String(reduce));
  }
});

// Sections view: the grid stretches the card host to the rows it asked for
// (3 or 4). The host and ha-card must fill that height whatever the alignment,
// so "center" really centers and the card lines up with its neighbours.
test("the card fills its grid cell with the default (center) alignment, not only with top", () => {
  const css = render(4).querySelector("style").textContent;
  const host = declarations(css, ":host");
  assert.equal(host.display, "block");
  assert.equal(host.height, "100%");
  assert.equal(declarations(css, "ha-card").height, "100%", "ha-card height (center alignment)");
  assert.equal(declarations(css, 'ha-card[data-align="top"]')["justify-content"], "flex-start");
});

// Narrow cards (min_columns 4, about 160px; vertical at 3 columns, about
// 120px): a long risk level (pl "Bardzo wysoki", nl "Niet beschikbaar") must
// stay on one line inside the card, cut with an ellipsis, its full text kept
// in a tooltip.
test("the risk level pill stays on one line inside the card and keeps its full text in a tooltip", () => {
  const root = render("unavailable", { language: "nl" });
  const css = root.querySelector("style").textContent;
  const pill = declarations(css, ".label");
  assert.equal(pill["white-space"], "nowrap");
  assert.equal(pill.overflow, "hidden");
  assert.equal(pill["text-overflow"], "ellipsis");
  assert.equal(pill["max-width"], "100%");
  assert.equal(pill["box-sizing"], "border-box");
  assert.equal(declarations(css, ".info")["max-width"], "100%", "the text column never outgrows the card");
  assert.equal(root.querySelector(".label").getAttribute("title"), "Niet beschikbaar");
  // A narrow horizontal card shrinks the icon to leave the level room.
  assert.equal(declarations(css, "ha-card")["container-type"], "inline-size");
  assert.match(css, /@container \(max-width: \d+px\) \{\s*ha-card\[data-layout="horizontal"\] \.icon \{/);
});

test("the label tooltip follows the level when the value changes", () => {
  const ctx = sandbox();
  vm.runInContext(source, ctx);
  const card = new (ctx.customElements.get("ha-uv-card"))();
  card.setConfig({ entity: "sensor.uv", language: "pl" });
  card.hass = hassWith(9);
  assert.equal(card.shadowRoot.querySelector(".label").getAttribute("title"), "Bardzo wysoki");
  card.hass = hassWith("unavailable");
  assert.equal(card.shadowRoot.querySelector(".label").getAttribute("title"), "Niedostępny");
});

// Header at narrow widths: the badge never shrinks, the title keeps a few
// characters and is cut with an ellipsis.
test("the header badge never shrinks and the title keeps at least 4 characters", () => {
  const css = render(4).querySelector("style").textContent;
  assert.equal(declarations(css, ".badge").flex, "none");
  const titles = declarations(css, ".titles");
  // flex-basis 0: the title only takes the room left, never more than its share.
  assert.equal(titles.flex, "1 1 0");
  assert.match(titles["min-width"], /^\d+(\.\d+)?ch$/);
  assert.ok(Number.parseFloat(titles["min-width"]) >= 4);
  assert.equal(declarations(css, ".name")["text-overflow"], "ellipsis");
});

// Body of the first @container (max-width: Npx) block whose content matches `inner`.
function containerBlock(css, inner) {
  const clean = css.replace(/\/\*.*?\*\//gs, "");
  for (const m of clean.matchAll(/@container \(max-width: (\d+)px\) \{((?:[^{}]*\{[^}]*\})*)\s*\}/g)) {
    if (inner.test(m[2])) return { max: Number(m[1]), body: m[2] };
  }
  return null;
}

// Vertical at 3 columns of a phone section (78-91px, 52-65px inside the
// padding): the 40px badge, the gap and 4 characters of title (about 86px)
// ran 9-22px past the card edge. Below the badge + gap + 4ch width the badge
// is dropped (the big UV icon stays), so the title fits.
test("on a very narrow card the header badge is dropped so the title stays inside", () => {
  const css = render(4, { layout: "vertical" }).querySelector("style").textContent;
  const block = containerBlock(css, /\.badge\s*\{[^}]*display:\s*none/);
  assert.ok(block, "no container query hides the badge");
  // 40px badge + 10px gap + 4ch (~36px at 16px): the badge goes before the title would be cut under 4 characters.
  assert.ok(block.max >= 86 && block.max < 104, `badge threshold ${block.max}px`);
});

// Horizontal at 4-6 columns of a phone section (104-178px): next to the icon
// the pill had 26-80px and showed "M…", "Bard…". Under the threshold the pill
// moves to its own row under the icon and the value, the whole card width.
test("on a narrow horizontal card the risk level gets its own full-width row", () => {
  const css = render(4).querySelector("style").textContent;
  const block = containerBlock(css, /ha-card\[data-layout="horizontal"\] \.label\s*\{[^}]*grid-column:\s*1 \/ -1/);
  assert.ok(block, "no container query puts the pill on its own row");
  assert.ok(block.max >= 152, `stacked below ${block.max}px only: 6 columns on a phone (178px) must stack`);
  assert.match(block.body, /ha-card\[data-layout="horizontal"\] \.body\s*\{[^}]*display:\s*grid/);
  assert.match(block.body, /ha-card\[data-layout="horizontal"\] \.info\s*\{[^}]*display:\s*contents/);
});

// The size container is ha-card (the header and the body both follow its
// width). Inline-size containment drops the content from the intrinsic width:
// in a shrink-to-fit parent (inline-block, grid "auto" column, button-card,
// layout-card) the card would fall to its padding. An empty, zero-height grid
// before ha-card gives it a natural width there, with a min-content width of
// 0. contain-intrinsic-inline-size (or a min-width) would be a min-content
// width: a card wrapped in a <div> in a "1fr 1fr" grid ran 40-220px past its
// cell. The layout itself is measured in test/browser.test.mjs.
test("the size container gets its natural width from an empty grid that may shrink to 0", () => {
  const css = render(4).querySelector("style").textContent;
  const haCard = declarations(css, "ha-card");
  assert.equal(haCard["container-type"], "inline-size");
  assert.doesNotMatch(css, /contain-intrinsic/);
  assert.equal(declarations(css, ".body")["container-type"], undefined, "a second, content-less container in the body");
  const sizer = declarations(css, ":host::before");
  assert.equal(sizer.content, '""');
  assert.equal(sizer.display, "grid");
  assert.equal(sizer.height, "0");
  const track = /^minmax\(0,\s*(\d+)px\)$/.exec(sizer["grid-template-columns"] || "");
  assert.ok(track && Number(track[1]) >= 200, `natural width track ${sizer["grid-template-columns"]}`);
  const host = declarations(css, ":host");
  assert.equal(host.display, "block");
  assert.equal(host.width, undefined);
  assert.ok(!/px/.test(host["min-width"] || ""), "a px min-width on the host would not shrink in a 1fr grid");
});

// A pill whose text does not fit even on its own row is shown as its colored
// dot only, the level kept in its tooltip and accessible name, instead of
// "M…" / "Bard…". It is measured, so it only happens when the room really
// lacks, whatever the language.
function fitCard(lang = "en") {
  const observers = [];
  class ResizeObserver {
    constructor(cb) { this.cb = cb; this.targets = []; observers.push(this); }
    observe(t) { this.targets.push(t); }
    disconnect() { this.targets = []; }
  }
  // Animation frames run when the test says so (flush), like the browser after the observer.
  let frames = new Map();
  let next = 1;
  const requestAnimationFrame = (fn) => {
    frames.set(next, fn);
    return next++;
  };
  const cancelAnimationFrame = (id) => frames.delete(id);
  const flush = () => {
    const run = frames;
    frames = new Map();
    for (const fn of run.values()) fn();
  };
  const ctx = sandbox(undefined, { ResizeObserver, requestAnimationFrame, cancelAnimationFrame });
  vm.runInContext(source, ctx);
  const el = new (ctx.customElements.get("ha-uv-card"))();
  el.setConfig({ entity: "sensor.uv", language: lang });
  const pill = () => el.shadowRoot.querySelector(".label");
  // Room for the pill, in px; the text needs 7px per character plus 16px padding.
  let room = 300;
  el.isConnected = true;
  el.connectedCallback?.();
  el.hass = hassWith(4);
  const node = pill();
  // Laid out at its natural width when measured unconstrained, else cut to the room.
  node.getBoundingClientRect = () => {
    const natural = "data-dot" in node.attributes ? 10 : node.textContent.length * 7 + 16 + 0.4;
    return { width: node.style.width === "max-content" ? natural : Math.min(room, natural) };
  };
  // The observer reports the card's new width; the fit runs in the next frame.
  let width = 300;
  const resize = (w) => {
    room = w;
    width += 1; // the card width follows the room
    for (const o of observers) if (o.targets.length) o.cb([{ contentRect: { width, height: 100 } }]);
    flush();
  };
  const notify = (entry) => {
    for (const o of observers) if (o.targets.length) o.cb([{ contentRect: entry }]);
  };
  return { el, pill, resize, observers, notify, frames: () => frames.size, flush, width: () => width };
}

test("a risk level that cannot fit is shown as its colored dot, and comes back when it fits", () => {
  const { el, pill, resize, observers } = fitCard("pl");
  assert.ok(observers.some((o) => o.targets.length), "the card does not watch its width");
  resize(300);
  assert.equal("data-dot" in pill().attributes, false, "room enough: the text shows");
  el.hass = hassWith(9); // "Bardzo wysoki": 13 chars, 107px
  resize(80);
  assert.equal("data-dot" in pill().attributes, true, "no room: dot only");
  assert.equal(pill().getAttribute("title"), "Bardzo wysoki");
  // A dot is an image named by the level (a named generic div is not announced).
  assert.equal(pill().getAttribute("role"), "img");
  assert.equal(pill().getAttribute("aria-label"), "Bardzo wysoki");
  assert.equal(pill().textContent, "Bardzo wysoki", "the text stays in the DOM for screen readers");
  resize(107); // 107.4px needed: cut by less than a pixel is still cut
  assert.equal("data-dot" in pill().attributes, true, "a sub-pixel cut is a cut");
  resize(120);
  assert.equal("data-dot" in pill().attributes, false, "room again: the text is back");
  assert.equal(pill().getAttribute("role"), null, "the text names itself again");
  assert.equal(pill().getAttribute("aria-label"), null);
  // A shorter level at the same width shows in full: "Niski", 51px.
  resize(80);
  el.hass = hassWith(1);
  assert.equal("data-dot" in pill().attributes, false, "a short level fits");
  el.hass = hassWith("unavailable"); // "Niedostępny", 93px
  assert.equal("data-dot" in pill().attributes, true, "a new long level is re-measured");
});

test("a card removed from the page stops watching its width", () => {
  const { el, observers, notify, frames } = fitCard();
  notify({ width: 120, height: 100 });
  assert.equal(frames(), 1);
  el.disconnectedCallback?.();
  assert.ok(observers.every((o) => o.targets.length === 0));
  assert.equal(frames(), 0, "a pending fit is cancelled");
});

// Without a fixed height (masonry, stacks) the text <-> dot switch changes the
// card height. Fitting inside the observer callback resized the observed card
// in its own callback ("ResizeObserver loop completed with undelivered
// notifications"): the fit runs in the next frame, and only for a new width.
test("the observer refits in the next frame, and only when the width changed", () => {
  const { pill, resize, notify, frames, flush, width } = fitCard("pl");
  resize(80);
  assert.equal("data-dot" in pill().attributes, true, "UV 4 'Umiarkowany' (86px) does not fit in 80px");
  notify({ width: width() + 1, height: 100 });
  assert.equal(frames(), 1, "the fit waits for the next frame");
  notify({ width: width() + 2, height: 100 });
  assert.equal(frames(), 1, "two resizes in a frame fit once");
  flush();
  notify({ width: width() + 2, height: 140 });
  assert.equal(frames(), 0, "a height change alone (the dot switch itself) is not refitted");
});

test("the dot style keeps the band color and hides only the text", () => {
  const css = render(4).querySelector("style").textContent;
  const dot = declarations(css, ".label[data-dot]");
  assert.equal(dot["font-size"], "0");
  assert.ok(Number.parseFloat(dot.width) >= 8 && dot.width === dot.height, `dot ${dot.width} x ${dot.height}`);
  assert.equal(dot.background, "var(--uv-text-color)");
});

// The card is a role="button": a visible keyboard focus ring, drawn inside the
// rounded card, like the other cards.
test("the card shows a focus ring for keyboard focus", () => {
  const css = render(4).querySelector("style").textContent;
  const ring = declarations(css, "ha-card:focus-visible");
  assert.equal(ring.outline, "2px solid var(--primary-color)");
  assert.ok(Number.parseFloat(ring["outline-offset"]) <= 0, `outline-offset ${ring["outline-offset"]}`);
});
