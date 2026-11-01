/**
 * UV Index Card for Home Assistant
 * A custom Lovelace card that shows an animated icon for the current UV index.
 *
 * Installable via HACS (category: plugin).
 * https://github.com/juju35/ha-uv-card
 */

const CARD_VERSION = '__VERSION__';

// SVG icons from icons/, inlined by scripts/build.mjs so the card is a single self-contained file.
// Keys "0".."11" map to the UV index; "default" is the unavailable fallback.
const ICONS = __ICONS__;

// UV risk levels per WHO classification.
// Each band defines a translation key, an accent color and the SVG used for it.
const UV_LEVELS = [
  { max: 2, key: "low", color: "#558b2f" },
  { max: 5, key: "moderate", color: "#f9a825" },
  { max: 7, key: "high", color: "#ef6c00" },
  { max: 10, key: "very_high", color: "#b71c1c" },
  { max: Infinity, key: "extreme", color: "#6a1b9a" },
];

function levelFor(value) {
  return UV_LEVELS.find((l) => value <= l.max);
}

// Translations. "name" is the default card title; the other keys are the risk
// labels and the unavailable state. English ("en") is the fallback.
const TRANSLATIONS = {
  en: { name: "UV Index", low: "Low", moderate: "Moderate", high: "High", very_high: "Very High", extreme: "Extreme", unavailable: "Unavailable",
        ed_entity: "UV index sensor", ed_name: "Name", ed_layout: "Layout", ed_horizontal: "Horizontal", ed_vertical: "Vertical",
        ed_align: "Alignment", ed_center: "Center", ed_top: "Top", ed_show_value: "Show the value", ed_show_label: "Show the risk level",
        ed_transparent: "Transparent background", ed_language: "Language", ed_auto: "Auto (Home Assistant)" },
  fr: { name: "Indice UV", low: "Faible", moderate: "Modéré", high: "Élevé", very_high: "Très élevé", extreme: "Extrême", unavailable: "Indisponible",
        ed_entity: "Capteur d'indice UV", ed_name: "Nom", ed_layout: "Disposition", ed_horizontal: "Horizontale", ed_vertical: "Verticale",
        ed_align: "Alignement", ed_center: "Centré", ed_top: "En haut", ed_show_value: "Afficher la valeur", ed_show_label: "Afficher le niveau de risque",
        ed_transparent: "Fond transparent", ed_language: "Langue", ed_auto: "Automatique (Home Assistant)" },
  de: { name: "UV-Index", low: "Niedrig", moderate: "Mäßig", high: "Hoch", very_high: "Sehr hoch", extreme: "Extrem", unavailable: "Nicht verfügbar",
        ed_entity: "UV-Index-Sensor", ed_name: "Name", ed_layout: "Anordnung", ed_horizontal: "Horizontal", ed_vertical: "Vertikal",
        ed_align: "Ausrichtung", ed_center: "Zentriert", ed_top: "Oben", ed_show_value: "Wert anzeigen", ed_show_label: "Risikostufe anzeigen",
        ed_transparent: "Transparenter Hintergrund", ed_language: "Sprache", ed_auto: "Automatisch (Home Assistant)" },
  es: { name: "Índice UV", low: "Bajo", moderate: "Moderado", high: "Alto", very_high: "Muy alto", extreme: "Extremo", unavailable: "No disponible",
        ed_entity: "Sensor de índice UV", ed_name: "Nombre", ed_layout: "Disposición", ed_horizontal: "Horizontal", ed_vertical: "Vertical",
        ed_align: "Alineación", ed_center: "Centrado", ed_top: "Arriba", ed_show_value: "Mostrar el valor", ed_show_label: "Mostrar el nivel de riesgo",
        ed_transparent: "Fondo transparente", ed_language: "Idioma", ed_auto: "Automático (Home Assistant)" },
  it: { name: "Indice UV", low: "Basso", moderate: "Moderato", high: "Alto", very_high: "Molto alto", extreme: "Estremo", unavailable: "Non disponibile",
        ed_entity: "Sensore indice UV", ed_name: "Nome", ed_layout: "Disposizione", ed_horizontal: "Orizzontale", ed_vertical: "Verticale",
        ed_align: "Allineamento", ed_center: "Centrato", ed_top: "In alto", ed_show_value: "Mostra il valore", ed_show_label: "Mostra il livello di rischio",
        ed_transparent: "Sfondo trasparente", ed_language: "Lingua", ed_auto: "Automatico (Home Assistant)" },
  nl: { name: "UV-index", low: "Laag", moderate: "Matig", high: "Hoog", very_high: "Zeer hoog", extreme: "Extreem", unavailable: "Niet beschikbaar",
        ed_entity: "UV-indexsensor", ed_name: "Naam", ed_layout: "Indeling", ed_horizontal: "Horizontaal", ed_vertical: "Verticaal",
        ed_align: "Uitlijning", ed_center: "Gecentreerd", ed_top: "Boven", ed_show_value: "Waarde tonen", ed_show_label: "Risiconiveau tonen",
        ed_transparent: "Transparante achtergrond", ed_language: "Taal", ed_auto: "Automatisch (Home Assistant)" },
  pt: { name: "Índice UV", low: "Baixo", moderate: "Moderado", high: "Alto", very_high: "Muito alto", extreme: "Extremo", unavailable: "Indisponível",
        ed_entity: "Sensor de índice UV", ed_name: "Nome", ed_layout: "Disposição", ed_horizontal: "Horizontal", ed_vertical: "Vertical",
        ed_align: "Alinhamento", ed_center: "Centrado", ed_top: "Em cima", ed_show_value: "Mostrar o valor", ed_show_label: "Mostrar o nível de risco",
        ed_transparent: "Fundo transparente", ed_language: "Idioma", ed_auto: "Automático (Home Assistant)" },
  pl: { name: "Indeks UV", low: "Niski", moderate: "Umiarkowany", high: "Wysoki", very_high: "Bardzo wysoki", extreme: "Ekstremalny", unavailable: "Niedostępny",
        ed_entity: "Czujnik indeksu UV", ed_name: "Nazwa", ed_layout: "Układ", ed_horizontal: "Poziomy", ed_vertical: "Pionowy",
        ed_align: "Wyrównanie", ed_center: "Wyśrodkowane", ed_top: "Do góry", ed_show_value: "Pokaż wartość", ed_show_label: "Pokaż poziom ryzyka",
        ed_transparent: "Przezroczyste tło", ed_language: "Język", ed_auto: "Automatycznie (Home Assistant)" },
  sr: { name: "УВ индекс", low: "Низак", moderate: "Умерен", high: "Висок", very_high: "Веома висок", extreme: "Екстреман", unavailable: "Недоступно",
        ed_entity: "Сензор УВ индекса", ed_name: "Назив", ed_layout: "Распоред", ed_horizontal: "Хоризонтално", ed_vertical: "Вертикално",
        ed_align: "Поравнање", ed_center: "Центрирано", ed_top: "Горе", ed_show_value: "Прикажи вредност", ed_show_label: "Прикажи ниво ризика",
        ed_transparent: "Провидна позадина", ed_language: "Језик", ed_auto: "Аутоматски (Home Assistant)" },
  "sr-Latn": { name: "UV indeks", low: "Nizak", moderate: "Umeren", high: "Visok", very_high: "Veoma visok", extreme: "Ekstreman", unavailable: "Nedostupno",
        ed_entity: "Senzor UV indeksa", ed_name: "Naziv", ed_layout: "Raspored", ed_horizontal: "Horizontalno", ed_vertical: "Vertikalno",
        ed_align: "Poravnanje", ed_center: "Centrirano", ed_top: "Gore", ed_show_value: "Prikaži vrednost", ed_show_label: "Prikaži nivo rizika",
        ed_transparent: "Providna pozadina", ed_language: "Jezik", ed_auto: "Automatski (Home Assistant)" },
};

const LANGUAGE_NAMES = {
  en: "English", fr: "Français", de: "Deutsch", es: "Español", it: "Italiano", nl: "Nederlands", pt: "Português", pl: "Polski",
  sr: "Српски", "sr-Latn": "Srpski (latinica)",
};

// Pick the translation code for a language: the full code when it has a
// translation (e.g. "sr-Latn", matched case-insensitively), else the base code
// (e.g. "fr-CA" -> "fr"), else English.
function resolveLang(lang) {
  const code = String(lang || "en");
  const lower = code.toLowerCase();
  const full = Object.keys(TRANSLATIONS).find((k) => k.toLowerCase() === lower);
  if (full) return full;
  const base = lower.split("-")[0];
  return TRANSLATIONS[base] ? base : "en";
}

function localize(key, lang) {
  return TRANSLATIONS[resolveLang(lang)][key] || TRANSLATIONS.en[key];
}

// Static stylesheet, injected once. The per-render values are driven by the
// --uv-color variable and the data-layout / data-align / data-transparent
// attributes set on ha-card.
const STYLE = `
  ha-card {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 10px;
    padding: 12px;
    box-sizing: border-box;
    cursor: pointer;
    /* Band colors stay on the tinted backgrounds; text and the badge icon use
       them half-mixed with the theme text color, which keeps the hue and
       reaches 4.5:1 in HA's light and dark themes (bright yellow on white and
       deep purple on dark were under 2:1). */
    --uv-text-color: color-mix(in srgb, var(--uv-color) 50%, var(--primary-text-color));
  }
  ha-card[data-align="top"] {
    justify-content: flex-start;
    height: 100%;
  }
  ha-card[data-transparent] {
    background: none;
    box-shadow: none;
    border: none;
  }
  [hidden] {
    display: none !important;
  }
  /* The body starts 8px under the header (the card gap is 10px). */
  .header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: -2px;
  }
  .badge {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    flex: none;
    background: color-mix(in srgb, var(--uv-color) 16%, transparent);
    color: var(--uv-text-color);
    --mdc-icon-size: 24px;
  }
  .titles {
    flex: 1;
    min-width: 0;
  }
  .name {
    font-size: 16px;
    font-weight: 500;
    line-height: 1.25;
    color: var(--primary-text-color);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .body {
    display: flex;
    flex-direction: row;
    align-items: center;
    text-align: left;
    gap: 12px;
  }
  ha-card[data-layout="vertical"] .body {
    flex-direction: column;
    text-align: center;
    gap: 8px;
  }
  .icon {
    width: 56px;
    height: 56px;
    flex: 0 0 auto;
  }
  .icon svg {
    width: 100%;
    height: 100%;
    display: block;
  }
  .info {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    min-width: 0;
  }
  ha-card[data-layout="vertical"] .info {
    align-items: center;
  }
  .value {
    font-size: 30px;
    font-weight: 400;
    line-height: 1.1;
    color: var(--uv-text-color);
  }
  .label {
    display: inline-block;
    margin-top: 2px;
    padding: 1px 8px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 500;
    color: var(--uv-text-color);
    background: color-mix(in srgb, var(--uv-color) 15%, transparent);
  }
`;

function iconSvg(index) {
  return ICONS[String(index)] || ICONS.default;
}

class UvIndexCard extends HTMLElement {
  // Visual editor: Home Assistant's native form.
  static getConfigForm() {
    const ha = document.querySelector("home-assistant");
    const lang = (ha?.hass?.language) || "en";
    const t = (key) => localize(key, lang);
    return {
      schema: [
        { name: "entity", required: true, selector: { entity: { domain: "sensor" } } },
        { name: "name", selector: { text: {} } },
        {
          type: "grid",
          name: "",
          schema: [
            { name: "layout", selector: { select: { mode: "dropdown", options: [
              { value: "horizontal", label: t("ed_horizontal") },
              { value: "vertical", label: t("ed_vertical") },
            ] } } },
            { name: "align", selector: { select: { mode: "dropdown", options: [
              { value: "center", label: t("ed_center") },
              { value: "top", label: t("ed_top") },
            ] } } },
          ],
        },
        { name: "show_value", default: true, selector: { boolean: {} } },
        { name: "show_label", default: true, selector: { boolean: {} } },
        { name: "transparent", default: false, selector: { boolean: {} } },
        // Leading "auto" option (empty value) lets the editor revert to
        // following the Home Assistant language once a language was picked.
        { name: "language", selector: { select: { mode: "dropdown", options: [
          { value: "", label: t("ed_auto") },
          ...Object.entries(LANGUAGE_NAMES).map(([value, label]) => ({ value, label })),
        ] } } },
      ],
      computeLabel: (schema) => (schema.name ? t(`ed_${schema.name}`) : ""),
    };
  }

  setConfig(config) {
    if (!config.entity) {
      throw new Error("You need to define an 'entity'");
    }
    this._config = {
      ...config,
      show_label: config.show_label !== false,
      show_value: config.show_value !== false,
      // "horizontal" = text to the right (default), "vertical" = text below.
      layout: config.layout === "vertical" ? "vertical" : "horizontal",
      // Drop the card background, border and shadow for a transparent look.
      transparent: config.transparent === true,
      // "center" (default) or "top": vertical alignment inside the card,
      // useful to line the card up with others in a horizontal-stack.
      align: config.align === "top" ? "top" : "center",
    };
    this._configSig = JSON.stringify(this._config);
    this._sig = null; // force a re-render on the next paint
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  // Cheap fingerprint of everything that affects the rendered output, so we
  // only rebuild the DOM (and restart the SVG animation) when it changes.
  _signature(stateObj) {
    return [
      this._configSig,
      stateObj ? stateObj.state : null,
      stateObj ? stateObj.attributes.friendly_name : null,
      this._hass ? this._hass.language : null,
    ].join("|");
  }

  getCardSize() {
    return this._config && this._config.layout === "vertical" ? 4 : 3;
  }

  getGridOptions() {
    const vertical = this._config && this._config.layout === "vertical";
    return vertical
      ? { columns: 3, min_columns: 3, rows: 4, min_rows: 4 }
      : { columns: 6, min_columns: 4, rows: 3, min_rows: 3 };
  }

  static getStubConfig(hass) {
    const ids = hass ? Object.keys(hass.states) : [];
    const uv = ids.find((id) => id.startsWith("sensor.") && /(^|_|\.)uv(_|$)/.test(id));
    return { entity: uv || "sensor.uv_index" };
  }

  // Builds the card once: the static stylesheet and the DOM skeleton. Later
  // renders only update text, attributes and the --uv-color variable, so the
  // icon (and its SMIL animation) is only swapped when the UV index changes.
  _build() {
    const root = this.shadowRoot;
    const el = (tag, cls, parent) => {
      const node = document.createElement(tag);
      if (cls) node.className = cls;
      parent.appendChild(node);
      return node;
    };
    const style = el("style", "", root);
    style.textContent = STYLE;
    const card = el("ha-card", "", root);
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");
    const header = el("div", "header", card);
    const badge = el("div", "badge", header);
    el("ha-icon", "", badge).setAttribute("icon", "mdi:sun-wireless-outline");
    const name = el("div", "name", el("div", "titles", header));
    const body = el("div", "body", card);
    const icon = el("div", "icon", body);
    const info = el("div", "info", body);
    const value = el("div", "value", info);
    const label = el("div", "label", info);
    // The entity is read when the event fires, so a config change needs no rebind.
    card.addEventListener("click", () => this._openMoreInfo(this._config.entity));
    // Keyboard: Enter or Space opens the entity dialog, like a button
    card.addEventListener("keydown", (ev) => {
      if (ev.key !== "Enter" && ev.key !== " ") return;
      ev.preventDefault();
      this._openMoreInfo(this._config.entity);
    });
    this._els = { card, name, icon, value, label };
    this._iconKey = null;
  }

  _render() {
    if (!this._config) return;

    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" });
    }
    if (!this._els) this._build();

    const entityId = this._config.entity;
    const stateObj = this._hass ? this._hass.states[entityId] : undefined;

    // Skip the update if nothing visible changed (avoids touching the DOM on
    // every Home Assistant state tick).
    const sig = this._signature(stateObj);
    if (sig === this._sig) return;
    this._sig = sig;

    // Number("") and Number(" ") are 0: an empty state is unavailable, not "0".
    const text = stateObj ? String(stateObj.state).trim() : "";
    const raw = text !== "" ? Number(text) : NaN;
    const available = !!stateObj && Number.isFinite(raw);

    // Round and clamp the UV index to the available icons (0-11); a negative
    // reading is shown as 0, like its icon.
    const rounded = available ? Math.max(0, Math.round(raw)) : NaN;
    const index = available ? Math.min(rounded, 11) : NaN;

    // Language: explicit config wins, otherwise follow the Home Assistant UI.
    const lang =
      this._config.language || (this._hass?.language) || "en";

    // WHO bands are defined on whole numbers: use the value that is displayed.
    const level = available ? levelFor(rounded) : null;
    const name =
      this._config.name ||
      (stateObj?.attributes.friendly_name) ||
      localize("name", lang);

    const valueText = available ? String(rounded) : "—";
    const labelText = level
      ? localize(level.key, lang)
      : localize("unavailable", lang);
    const color = level ? level.color : "var(--secondary-text-color)";

    const { card, icon, value, label } = this._els;
    card.setAttribute("data-layout", this._config.layout);
    card.setAttribute("data-align", this._config.align);
    card.toggleAttribute("data-transparent", this._config.transparent);
    card.style.setProperty("--uv-color", color);
    this._els.name.textContent = name;
    icon.setAttribute("title", labelText);
    const iconKey = String(index);
    if (iconKey !== this._iconKey) {
      icon.innerHTML = iconSvg(index);
      this._iconKey = iconKey;
      // SMIL ignores CSS media queries: honour prefers-reduced-motion by
      // freezing the rays' rotation on its first frame.
      if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
        const svg = icon.querySelector("svg");
        svg?.pauseAnimations?.();
        svg?.setCurrentTime?.(0);
      }
    }
    value.textContent = valueText;
    value.hidden = !this._config.show_value;
    label.textContent = labelText;
    label.hidden = !this._config.show_label;
  }

  _openMoreInfo(entityId) {
    this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId }, bubbles: true, composed: true }));
  }
}

// Guarded: the resource may be loaded twice (HACS and /local/, or two ?v= URLs).
if (!customElements.get("ha-uv-card")) {
  customElements.define("ha-uv-card", UvIndexCard);

  // Register the card so it shows up in the dashboard card picker.
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: "ha-uv-card",
    name: "UV Index Card",
    description: "Displays the current UV index with an animated weather-style icon.",
    preview: true,
    documentationURL: "https://github.com/juju35/ha-uv-card",
  });

  console.info(
    `%c HA-UV-CARD %c v${CARD_VERSION} `,
    "color: white; background: #f9a825; font-weight: 700;",
    "color: #f9a825; background: white; font-weight: 700;"
  );
}
