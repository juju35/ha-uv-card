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
        ed_transparent: "Transparent background", ed_language: "Language" },
  fr: { name: "Indice UV", low: "Faible", moderate: "Modéré", high: "Élevé", very_high: "Très élevé", extreme: "Extrême", unavailable: "Indisponible",
        ed_entity: "Capteur d'indice UV", ed_name: "Nom", ed_layout: "Disposition", ed_horizontal: "Horizontale", ed_vertical: "Verticale",
        ed_align: "Alignement", ed_center: "Centré", ed_top: "En haut", ed_show_value: "Afficher la valeur", ed_show_label: "Afficher le niveau de risque",
        ed_transparent: "Fond transparent", ed_language: "Langue" },
  de: { name: "UV-Index", low: "Niedrig", moderate: "Mäßig", high: "Hoch", very_high: "Sehr hoch", extreme: "Extrem", unavailable: "Nicht verfügbar" },
  es: { name: "Índice UV", low: "Bajo", moderate: "Moderado", high: "Alto", very_high: "Muy alto", extreme: "Extremo", unavailable: "No disponible" },
  it: { name: "Indice UV", low: "Basso", moderate: "Moderato", high: "Alto", very_high: "Molto alto", extreme: "Estremo", unavailable: "Non disponibile" },
  nl: { name: "UV-index", low: "Laag", moderate: "Matig", high: "Hoog", very_high: "Zeer hoog", extreme: "Extreem", unavailable: "Niet beschikbaar" },
  pt: { name: "Índice UV", low: "Baixo", moderate: "Moderado", high: "Alto", very_high: "Muito alto", extreme: "Extremo", unavailable: "Indisponível" },
};

const LANGUAGE_NAMES = { en: "English", fr: "Français", de: "Deutsch", es: "Español", it: "Italiano", nl: "Nederlands", pt: "Português" };

// Resolve a translation for the given language, falling back to the base
// language code (e.g. "fr-CA" -> "fr") and finally to English.
function localize(key, lang) {
  const code = (lang || "en").toLowerCase();
  const dict =
    TRANSLATIONS[code] || TRANSLATIONS[code.split("-")[0]] || TRANSLATIONS.en;
  return dict[key] || TRANSLATIONS.en[key];
}

function esc(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

function iconSvg(index) {
  return ICONS[String(index)] || ICONS.default;
}

class UvIndexCard extends HTMLElement {
  // Visual editor: Home Assistant's native form.
  static getConfigForm() {
    const ha = document.querySelector("home-assistant");
    const lang = (ha && ha.hass && ha.hass.language) || "en";
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
        { name: "language", selector: { select: { mode: "dropdown", options: Object.entries(LANGUAGE_NAMES).map(([value, label]) => ({ value, label })) } } },
      ],
      computeLabel: (schema) => t(`ed_${schema.name}`),
    };
  }

  setConfig(config) {
    if (!config.entity) {
      throw new Error("You need to define an 'entity'");
    }
    this._config = {
      ...config,
      name: config.name,
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
    return this._config && this._config.layout === "vertical" ? 3 : 2;
  }

  getGridOptions() {
    const vertical = this._config && this._config.layout === "vertical";
    return vertical
      ? { columns: 3, min_columns: 3, rows: 3, min_rows: 3 }
      : { columns: 6, min_columns: 4, rows: 2, min_rows: 2 };
  }

  static getStubConfig(hass) {
    const ids = hass ? Object.keys(hass.states) : [];
    const uv = ids.find((id) => id.startsWith("sensor.") && /(^|_|\.)uv(_|$)/.test(id));
    return { entity: uv || "sensor.uv_index" };
  }

  _render() {
    if (!this._config) return;

    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" });
    }

    const entityId = this._config.entity;
    const stateObj = this._hass ? this._hass.states[entityId] : undefined;

    // Skip the rebuild if nothing visible changed (avoids the icon flicker
    // on every Home Assistant state tick).
    const sig = this._signature(stateObj);
    if (sig === this._sig && this.shadowRoot) return;
    this._sig = sig;

    const raw = stateObj ? Number(stateObj.state) : NaN;
    const available = stateObj && Number.isFinite(raw);

    // Round and clamp the UV index to the available icons (0-11).
    let index = available ? Math.max(0, Math.round(raw)) : NaN;
    if (Number.isFinite(index) && index > 11) index = 11;

    // Language: explicit config wins, otherwise follow the Home Assistant UI.
    const lang =
      this._config.language || (this._hass && this._hass.language) || "en";

    const level = available ? levelFor(raw) : null;
    const name =
      this._config.name ||
      (stateObj && stateObj.attributes.friendly_name) ||
      localize("name", lang);

    const valueText = available ? String(Math.round(raw)) : "—";
    const labelText = level
      ? localize(level.key, lang)
      : localize("unavailable", lang);
    const color = level ? level.color : "var(--secondary-text-color)";
    const vertical = this._config.layout === "vertical";
    const transparent = this._config.transparent;
    const top = this._config.align === "top";

    // Cross-axis (horizontal layout) and main-axis (vertical layout) alignment.
    const alignItems = !vertical && top ? "flex-start" : "center";
    const justify = vertical && top ? "flex-start" : "center";

    this.shadowRoot.innerHTML = `
      <style>
        ha-card {
          display: flex;
          flex-direction: ${vertical ? "column" : "row"};
          align-items: ${alignItems};
          justify-content: ${justify};
          text-align: ${vertical ? "center" : "left"};
          gap: ${vertical ? "8px" : "12px"};
          padding: 12px;
          box-sizing: border-box;
          ${top ? "height: 100%;" : ""}
          cursor: pointer;
          --uv-color: ${color};
          ${transparent ? "background: none; box-shadow: none; border: none;" : ""}
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
          align-items: ${vertical ? "center" : "flex-start"};
          gap: 2px;
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
          max-width: 100%;
        }
        .value {
          font-size: 28px;
          font-weight: 500;
          line-height: 1.1;
          color: var(--uv-color);
        }
        .label {
          display: inline-block;
          margin-top: 2px;
          padding: 1px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
          color: var(--uv-color);
          background: color-mix(in srgb, var(--uv-color) 15%, transparent);
        }
      </style>
      <ha-card>
        <div class="icon" title="${esc(labelText)}">${iconSvg(index)}</div>
        <div class="info">
          <div class="name">${esc(name)}</div>
          ${this._config.show_value ? `<div class="value">${valueText}</div>` : ""}
          ${this._config.show_label ? `<div class="label">${esc(labelText)}</div>` : ""}
        </div>
      </ha-card>
    `;

    const card = this.shadowRoot.querySelector("ha-card");
    card.addEventListener("click", () => this._openMoreInfo(entityId));
  }

  _openMoreInfo(entityId) {
    const event = new Event("hass-more-info", { bubbles: true, composed: true });
    event.detail = { entityId };
    this.dispatchEvent(event);
  }
}

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
