/**
 * UV Index Card for Home Assistant
 * A custom Lovelace card that shows the current UV index on a WHO-coloured gauge.
 *
 * Installable via HACS (category: plugin).
 * https://github.com/juju35/ha-uv-card
 */
import { TRANSLATIONS } from "./i18n/translations.js";

export const CARD_VERSION = '__VERSION__';

// SVG icons from icons/, inlined by scripts/build.mjs so the card is a single self-contained file.
// Keys "0".."11" map to the UV index; "default" is the unavailable fallback.
export const ICONS = __ICONS__;

// UV risk levels per WHO classification.
// Each band defines a translation key.
// Their colours are CSS variables of ha-card (--uv-low ... --uv-extreme), each
// overridable from a theme (--uv-low-color ...).
export const UV_LEVELS = [
  { max: 2, key: "low" },
  { max: 5, key: "moderate" },
  { max: 7, key: "high" },
  { max: 10, key: "very_high" },
  { max: Infinity, key: "extreme" },
];

export function levelFor(value) {
  return UV_LEVELS.find((l) => value <= l.max);
}


export const LANGUAGE_NAMES = {
  en: "English", fr: "Français", de: "Deutsch", es: "Español", it: "Italiano", nl: "Nederlands", pt: "Português (Portugal)", pl: "Polski",
  ro: "Română", da: "Dansk", sv: "Svenska", bg: "Български", ru: "Русский", uk: "Українська", hu: "Magyar",
  sk: "Slovenčina", cs: "Čeština", sl: "Slovenščina", lv: "Latviešu", el: "Ελληνικά",
  sr: "Српски", "sr-Latn": "Srpski (latinica)",
};

// Pick the translation code for a language: the full code when it has a
// translation (e.g. "sr-Latn", matched case-insensitively), else the base code
// (e.g. "fr-CA" -> "fr"), else English.
export function resolveLang(lang) {
  const code = String(lang || "en");
  const lower = code.toLowerCase();
  const full = Object.keys(TRANSLATIONS).find((k) => k.toLowerCase() === lower);
  if (full) return full;
  const base = lower.split("-")[0];
  return TRANSLATIONS[base] ? base : "en";
}

export function localize(key, lang) {
  return TRANSLATIONS[resolveLang(lang)][key] || TRANSLATIONS.en[key];
}

// WHO bands on the gauge: 0 to 12 on a half circle, each band from the middle
// between two whole numbers (the displayed value is rounded), so 2 sits in the
// green band and 3 in the yellow one; 11+ takes the last stretch.
export const GAUGE_MAX = 12;
export const BOUNDS = [0, 2.5, 5.5, 7.5, 10.5, GAUGE_MAX];
export const CX = 100;
export const CY = 100;
export const R = 82;

// Angle (0 = left end, 180 = right end) of a rounded UV value on the gauge.
export function gaugeAngle(value) {
  return (Math.min(Math.max(value, 0), 11.5) / GAUGE_MAX) * 180;
}

// A point of the arc at a fraction t (0 left .. 1 right) of the half circle.
export function arcPoint(t) {
  const a = Math.PI * t;
  return `${(CX - R * Math.cos(a)).toFixed(2)} ${(CY - R * Math.sin(a)).toFixed(2)}`;
}

// The gauge drawing: five band segments (a small gap between them), the day's
// max tick and the marker, both turned around the centre by CSS (--uv-angle,
