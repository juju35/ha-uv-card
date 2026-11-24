// --uv-color / --uv-angle / --uv-max-angle variables and the data-layout,
// data-align, data-transparent, data-level, data-unavailable, data-max and
// data-paused attributes set on ha-card.
import { pickerDefine } from "./card-picker.js";
import { CARD_VERSION, ICONS, LANGUAGE_NAMES, UV_LEVELS, gaugeAngle, levelFor, localize } from "./core.js";
import { GAUGE_SVG, MDI_SUN, isNight, uvSceneSvg } from "./uv-max-angle.js";

export let uvUid = 0;

export const STYLE = `
  /* Sections view: the grid stretches the host to the rows the card asked
     for; ha-card fills it, so "center" centers and "top" sticks to the top. */
  :host {
    display: block;
    height: 100%;
  }
  /* Natural width in a parent that sizes to its content (inline-block, grid
     "auto" column, layout-card, button-card): ha-card is a size container, so
     its content no longer gives the card a width, and this empty grid does
     instead. Its min-content width is 0: in a "1fr 1fr" grid the card still
     shrinks to its cell, also when a wrapping <div> (min-width: auto) takes
     its min-content width. No height, so it takes no room. */
  :host::before {
    content: "";
    display: grid;
    grid-template-columns: minmax(0, 240px);
    height: 0;
  }
  ha-card {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 10px;
    padding: 12px;
    box-sizing: border-box;
    cursor: pointer;
    /* Size container for the narrow-card rules below. Inline-size containment
       leaves the content out of the intrinsic width: :host::before gives the
       card its width in a shrink-to-fit parent. */
    container-type: inline-size;
    /* WHO band colours, themable. */
    --uv-low: var(--uv-low-color, #558b2f);
    --uv-moderate: var(--uv-moderate-color, #f9a825);
    --uv-high: var(--uv-high-color, #ef6c00);
    --uv-very-high: var(--uv-very-high-color, #b71c1c);
    --uv-extreme: var(--uv-extreme-color, #6a1b9a);
    /* Band colors stay on the tinted backgrounds and the gauge; text and the
       badge icon use them half-mixed with the theme text color, which keeps
       the hue and reaches 4.5:1 in HA's light and dark themes (bright yellow
       on white and deep purple on dark were under 2:1). */
    --uv-text-color: color-mix(in srgb, var(--uv-color) 50%, var(--primary-text-color, #212121));
  }
  ha-card[data-align="top"] {
    justify-content: flex-start;
  }
  /* Keyboard focus (the card is a role="button"), drawn inside the rounded card. */
  ha-card:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: -2px;
  }
  ha-card[data-transparent] {
    background: none;
    box-shadow: none;
    border: none;
  }
  [hidden] {
    display: none !important;
  }
  /* Header: badge, title + subtitle, status pill on the title line. */
  .header {
    display: flex;
    align-items: center;
    gap: 10px;
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
    transition: background-color 0.6s ease;
  }
  /* The animated Meteocons icon fills the badge (its drawing has a margin). */
  .icon {
    width: 40px;
    height: 40px;
    display: grid;
    place-items: center;
  }
  .icon svg {
    width: 100%;
    height: 100%;
    display: block;
  }
  /* The titles take the room left by the badge; the title is cut with an ellipsis only when it does not fit alone. */
  .titles {
    flex: 1 1 0;
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
  .sub {
    font-size: 12px;
    line-height: 16px;
    color: var(--secondary-text-color);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  /* The status pill, in both headers: on the title row right after the title only when the whole title and the
     pill's whole label fit there; otherwise on its own line under the (one-line) subtitle; its dot alone, beside the
     title, when the banner has no room left above its sand strip, when the label does not fit even alone, or on a
     card of 200 px or less. Decided by measurement (see _fitLabel), in every language. */
  .trow {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }
  .trow .name {
    flex: 0 1 auto;
    min-width: 0;
  }
  .header[data-wrap] .titles {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }
  .header[data-wrap] .titles > *,
  .header[data-wrap] .trow > .name {
    max-width: 100%;
  }
  .header[data-wrap] .trow {
    display: contents;
  }
  .header[data-wrap] .trow > :is(.pill, .label) {
    order: 9;
    align-self: flex-start;
    margin-top: 2px;
  }
  .label {
    flex: none;
    padding: 1px 8px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 500;
    line-height: 18px;
    color: var(--uv-text-color);
    background: color-mix(in srgb, var(--uv-color) 15%, transparent);
    /* One line inside the card: a long level (pl "Bardzo wysoki", nl "Niet
       beschikbaar") is cut with an ellipsis, its full text in the tooltip. */
    white-space: nowrap;
    min-width: 0;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    box-sizing: border-box;
  }
  /* A level that does not fit even so (measured by the card) shows as its
     colored dot; the text stays in the DOM, the tooltip and the label. */
  .label[data-dot] {
    font-size: 0;
    width: 10px;
    height: 10px;
    padding: 0;
    flex: none;
    border-radius: 50%;
    background: var(--uv-text-color);
  }
  /* Body, vertical (default): the gauge, the value in its centre, the advice
     under it. Horizontal: the gauge on the left, value and advice on the right. */
  .body {
    display: grid;
    grid-template-areas: "gauge" "advice";
    justify-items: center;
    row-gap: 4px;
    min-width: 0;
  }
  .gauge {
    grid-area: gauge;
    width: min(100%, 220px);
  }
  .gauge svg {
    display: block;
    width: 100%;
    height: auto;
    overflow: visible;
  }
  .seg {
    fill: none;
    stroke-width: 14;
    transition: opacity 0.6s ease;
  }
  /* Bands above the current level are dimmed. */
  ha-card[data-level="0"] :is(.s1, .s2, .s3, .s4),
  ha-card[data-level="1"] :is(.s2, .s3, .s4),
  ha-card[data-level="2"] :is(.s3, .s4),
  ha-card[data-level="3"] .s4 {
    opacity: 0.22;
  }
  /* No value: the whole gauge dimmed, without a marker. */
  ha-card[data-unavailable] .seg {
    opacity: 0.3;
  }
  /* The marker and the max tick turn around the gauge centre. */
  .marker,
  .tick {
    transform-box: view-box;
    transform-origin: 100px 100px;
    transition: transform 0.9s cubic-bezier(0.3, 0.7, 0.3, 1), opacity 0.4s ease;
  }
  .marker {
    transform: rotate(var(--uv-angle, 0deg));
  }
  .tick {
    transform: rotate(var(--uv-max-angle, 0deg));
    opacity: 0;
  }
  ha-card[data-max] .tick {
    opacity: 1;
  }
  .tick line {
    stroke: var(--primary-text-color, #212121);
    stroke-width: 2.5;
    stroke-linecap: round;
  }
  .dot {
    fill: var(--uv-color);
    stroke: var(--card-background-color, #fff);
    stroke-width: 3;
    transition: fill 0.6s ease;
  }
  .halo {
    fill: var(--uv-color);
    opacity: 0;
    transform-box: fill-box;
    transform-origin: center;
  }
  /* Very high and Extreme: a gentle pulse around the marker. */
  ha-card:is([data-level="3"], [data-level="4"]) .halo {
    animation: uv-pulse 3s ease-out infinite;
  }
  ha-card[data-paused] .halo {
    animation-play-state: paused;
  }
  @keyframes uv-pulse {
    0% { opacity: 0.45; transform: scale(1); }
    70%, 100% { opacity: 0; transform: scale(2.1); }
  }
  ha-card[data-unavailable] .marker {
    opacity: 0;
  }
  .value {
    grid-area: gauge;
    align-self: end;
    font-size: 40px;
    font-weight: 400;
    line-height: 1;
    color: var(--uv-text-color);
    transition: color 0.6s ease;
    font-variant-numeric: tabular-nums;
  }
  .advice {
    grid-area: advice;
    font-size: 13px;
    line-height: 18px;
    text-align: center;
    color: var(--secondary-text-color);
    min-width: 0;
    max-width: 100%;
    overflow-wrap: anywhere;
  }
  ha-card[data-layout="horizontal"] .body {
    grid-template-columns: auto minmax(0, 1fr);
    grid-template-areas: "gauge value" "gauge advice";
    grid-template-rows: 1fr 1fr;
    justify-items: start;
    column-gap: 16px;
    row-gap: 2px;
  }
  ha-card[data-layout="horizontal"] .gauge {
    width: 160px;
    align-self: center;
  }
  ha-card[data-layout="horizontal"] .value {
    grid-area: value;
  }
  ha-card[data-layout="horizontal"] .advice {
    text-align: left;
    align-self: start;
  }
  /* Footer: the sun protection window, highlighted while it is on. */
  .extra {
    display: flex;
    justify-content: center;
    font-size: 12px;
    line-height: 16px;
    color: var(--secondary-text-color);
  }
  .protection {
    min-width: 0;
    padding: 4px 0;
    text-align: center;
    overflow-wrap: anywhere;
  }
  /* Active: plain text in the level's colour with its dot, no frame (it is not a button). */
  .protection[data-active] {
    color: var(--uv-text-color);
    font-weight: 500;
  }
  .protection[data-active]::before {
    content: "";
    display: inline-block;
    width: 8px;
    height: 8px;
    margin-right: 6px;
    border-radius: 50%;
    background: var(--uv-text-color);
  }
  /* Illustrated header (default; illustration: false keeps the classic one). 90 px high, edge to edge at the
     top of the card: the badge, the title and the status on the sky at the left, the beach scene at the right
     (200 x 80 at most, 66 % of the card; the text may run over its faded left edge), a 10 px sand strip under the whole banner. --uv-u is one unit of the
     scene's picture, so the icon placed over it scales with it on a narrow card. */
  ha-card[data-illustration] {
    padding-top: 0;
    overflow: hidden;
    justify-content: flex-start;
  }
  ha-card[data-illustration] .body {
    flex: 1 1 auto;
    align-content: center;
  }
  ha-card[data-illustration][data-align="top"] .body {
    align-content: start;
  }
  .mdi,
  .uv-scene,
  .uv-ground {
    display: none;
  }
  .banner {
    --uv-u: min(1px, 0.33cqw);
    --uv-scene-w: calc(200 * var(--uv-u));
    position: relative;
    flex: none;
    height: 90px;
    margin: 0 -12px;
    /* The text stops short of the scene; to keep a short title and its pill on one row it may run up to 24 px further
       over the scene's faded left edge. */
    padding: 0 max(calc(var(--uv-scene-w) * 0.86 - 24px), min(calc(var(--uv-scene-w) * 0.86), calc(100cqw - 210px))) 10px 12px;
    box-sizing: border-box;
    overflow: hidden;
    color: #0d2a45;
    background: linear-gradient(90deg, #f1f8ff 0%, #e2f1fd 34%, #b9def8 70%, #9fd0f3 100%);
    /* The badge icon in the level's colour, darkened (day) or lightened (night) to read on the sky. */
    --uv-icon: color-mix(in srgb, var(--uv-color) 72%, #0d2a45);
    --uv-muted: #3b5b78;
  }
  .banner.night {
    color: #fff;
    background: linear-gradient(90deg, #1b2f52 0%, #15284a 36%, #0f1f3d 72%, #0a1830 100%);
    --uv-icon: color-mix(in srgb, var(--uv-color) 62%, #fff);
    --uv-muted: rgba(255, 255, 255, 0.78);
  }
  .banner .name {
    color: inherit;
  }
  .banner .sub {
    color: var(--uv-muted);
  }
  .banner .label {
    display: none;
  }
  /* Status pill on the title row (illustrated header): a dot and the risk level in the level's colour on a frosted
     tint. Where it goes is measured by the card (see _fitLabel). */
  .pill {
    display: none;
  }
  .banner .pill {
    --c: var(--uv-color);
    display: inline-flex;
    align-items: center;
    gap: 4px;
    flex: none;
    min-width: 0;
    max-width: none;
    padding: 1px 8px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 500;
    line-height: 16px;
    white-space: nowrap;
    overflow: hidden;
    box-sizing: border-box;
    background: color-mix(in srgb, var(--c) 18%, rgba(255, 255, 255, 0.78));
    color: color-mix(in srgb, var(--c) 45%, #0d2a45);
  }
  .banner.night .pill {
    background: color-mix(in srgb, var(--c) 30%, rgba(8, 18, 38, 0.55));
    color: color-mix(in srgb, var(--c) 35%, #ffffff);
  }
  .banner .pill[hidden] {
    display: none;
  }
  .pill::before {
    content: "";
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--c);
    flex: none;
  }
  .pill .txt {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .banner .pill[data-dot] {
    padding: 0;
    background: none;
  }
  .banner .pill[data-dot] .txt {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
  }
  .banner .badge {
    color: var(--uv-icon);
    background: rgba(255, 255, 255, 0.62);
    box-shadow: inset 0 0 0 1px rgba(47, 128, 237, 0.18);
  }
  .banner.night .badge {
    background: rgba(255, 255, 255, 0.12);
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.14);
  }
  .banner .mdi {
    display: grid;
    place-items: center;
  }
  .mdi svg {
    width: 24px;
    height: 24px;
    fill: currentColor;
    display: block;
  }
  /* The card's animated icon, in the scene's sky at the top right (x 150-190, y 6-46 of the picture). */
  .banner .icon {
    position: absolute;
    z-index: 1;
    right: calc(10 * var(--uv-u));
    bottom: calc(10px + 34 * var(--uv-u));
    width: calc(40 * var(--uv-u));
    height: calc(40 * var(--uv-u));
  }
  .banner .uv-scene {
    display: block;
    position: absolute;
    right: 0;
    bottom: 10px;
    width: var(--uv-scene-w);
    height: calc(80 * var(--uv-u));
    -webkit-mask-image: linear-gradient(90deg, transparent 0, #000 14%);
    mask-image: linear-gradient(90deg, transparent 0, #000 14%);
  }
  .uv-scene svg {
    display: block;
    width: 100%;
    height: 100%;
  }
  .uv-stars, .uv-haze { display: none; }
  .night .uv-stars { display: inline; }
  .uv-star { fill: #fff; opacity: 0.8; }
  .uv-star.tw { animation: uv-twinkle 3.2s ease-in-out infinite alternate; }
  .uv-sea { fill: #4fb3e8; }
  .night .uv-sea { fill: #173a5e; }
  .uv-wave { fill: none; stroke: #b5e2fa; stroke-width: 1.2; animation: uv-wave 3s ease-in-out infinite; }
  .night .uv-wave { stroke: #2b5a86; }
  .uv-sand { fill: #f3dca4; }
  .night .uv-sand { fill: #5a4e3a; }
  .uv-pole { stroke: #8a5a3a; stroke-width: 1.4; fill: none; }
  .uv-parasol { fill: #2f80ed; }
  .uv-towel { fill: #e5484d; }
  /* The sun's glow grows with the level; none at night or without a value. */
  .uv-glow { opacity: 0; transition: opacity 0.6s ease; }
  ha-card[data-level="1"] .uv-glow { opacity: 0.25; }
  ha-card[data-level="2"] .uv-glow { opacity: 0.45; }
  ha-card[data-level="3"] .uv-glow { opacity: 0.65; }
  ha-card[data-level="4"] .uv-glow { opacity: 0.85; }
  .night .uv-glow { opacity: 0 !important; }
  /* High and above: heat rising over the sand (faster from Very high). */
  ha-card:is([data-level="2"], [data-level="3"], [data-level="4"]) .banner:not(.night) .uv-haze { display: inline; }
  .uv-haze path { fill: none; stroke: #fff; stroke-width: 0.9; stroke-linecap: round; opacity: 0; animation: uv-haze 3.2s ease-out infinite; }
  .uv-haze path:nth-child(2) { animation-delay: -0.8s; }
  .uv-haze path:nth-child(3) { animation-delay: -1.6s; }
  .uv-haze path:nth-child(4) { animation-delay: -2.4s; }
  ha-card:is([data-level="3"], [data-level="4"]) .uv-haze path { animation-duration: 2.2s; }
  ha-card[data-paused] .uv-scene * { animation-play-state: paused; }
  @keyframes uv-wave { 50% { transform: translateX(-6px); } }
  @keyframes uv-twinkle { from { opacity: 0.35; } to { opacity: 1; } }
  @keyframes uv-haze { 0% { opacity: 0; transform: translateY(2px); } 40% { opacity: 0.7; } 100% { opacity: 0; transform: translateY(-6px); } }
  /* The sand strip under the whole banner. */
  .banner .uv-ground {
    display: block;
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 10px;
    background: #f0d9a6 radial-gradient(#d9b979 0.8px, transparent 1px) 0 0 / 7px 5px;
    box-shadow: inset 0 2px 0 #f8e8c4;
  }
  .banner.night .uv-ground {
    background-color: #4a3f2c;
    background-image: radial-gradient(#5c4f38 0.8px, transparent 1px);
    box-shadow: inset 0 2px 0 #5a4d36;
  }
  /* A narrow card gives the scene less room, so the title keeps its own. */
  @container (max-width: 299px) {
    .banner { --uv-u: min(1px, 0.28cqw); }
  }
  /* On its own line the banner's pill may run over the faded left edge of the scene. */
  .banner[data-wrap] .pill {
    max-width: calc(100cqw - 76px);
    margin-top: 3px;
  }
  /* Very narrow banner: only the pill's dot (its text stays for screen readers and in the tooltip). */
  @container (max-width: 200px) {
    .banner .pill {
      padding: 0;
      background: none;
    }
    .banner .pill .txt {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .marker, .tick, .seg, .dot, .value, .badge { transition: none; }
    .halo, .uv-wave, .uv-star.tw, .uv-haze path { animation: none !important; }
    .uv-glow { transition: none; }
  }
  /* A horizontal card too narrow for the gauge and a text column side by side
     stacks them like the vertical layout. */
  @container (max-width: 299px) {
    ha-card[data-layout="horizontal"] .body {
      grid-template-columns: minmax(0, 1fr);
      grid-template-areas: "gauge" "advice";
      grid-template-rows: auto;
      justify-items: center;
      row-gap: 4px;
    }
    ha-card[data-layout="horizontal"] .gauge {
      width: min(100%, 220px);
    }
    ha-card[data-layout="horizontal"] .value {
      grid-area: gauge;
    }
    ha-card[data-layout="horizontal"] .advice {
      text-align: center;
    }
  }
  /* Narrow card: a smaller value, the advice on smaller text. */
  @container (max-width: 160px) {
    .value {
      font-size: 30px;
    }
    .advice {
      font-size: 12px;
      line-height: 16px;
    }
    .header {
      gap: 8px;
    }
  }
  /* Very narrow card (3 columns of a phone section): the badge, its gap, 4
     characters of title and the pill no longer fit, the badge goes (the gauge
     stays) so the title stays inside the card. */
  @container (max-width: 89px) {
    .badge {
      display: none;
    }
  }
`;

export function iconSvg(index) {
  return ICONS[String(index)] || ICONS.default;
}

// The UV index text of an entity: a sensor's state, or the uv_index attribute
// of a weather entity (Met.no, OpenWeatherMap...), whose state is the condition.
export function uvText(entityId, stateObj) {
  if (!stateObj) return "";
  if (String(entityId).startsWith("weather.")) {
    if (stateObj.state === "unavailable" || stateObj.state === "unknown") return "";
    const uv = stateObj.attributes?.uv_index;
    return uv === undefined || uv === null ? "" : String(uv).trim();
  }
  return String(stateObj.state).trim();
}

// Time format options following Home Assistant's 12/24 h setting.
export function timeOptions(hass) {
  const options = { hour: "2-digit", minute: "2-digit" };
  const tf = hass?.locale?.time_format;
  if (tf === "12") options.hour12 = true;
  else if (tf === "24") options.hour12 = false;
  return options;
}

export function formatWith(lang, options, date) {
  try {
    return new Intl.DateTimeFormat(lang, options).format(date);
  } catch {
    // An unknown language tag or time zone: the browser's language, local time.
    delete options.timeZone;
    return new Intl.DateTimeFormat(undefined, options).format(date);
  }
}

// A time of day ("13:20" / "1:20 PM") in the card language, following Home
// Assistant's 12/24 h setting and, when the profile asks for it, the server time zone.
export function formatTime(value, hass, lang) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "";
  const options = timeOptions(hass);
  if (hass?.locale?.time_zone === "server" && hass.config?.time_zone) options.timeZone = hass.config.time_zone;
  return formatWith(lang, options, date);
}

// A wall-clock hour ("11:00" / "11:00 AM") for the advice: no time zone, it is
// the local midday window the WHO advice speaks of.
export function formatHour(hour, hass, lang) {
  return formatWith(lang, timeOptions(hass), new Date(2000, 0, 1, hour, 0));
}

export function reducedMotion() {
  return !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

export class UvIndexCard extends HTMLElement {
  // Visual editor: Home Assistant's native form.
  static getConfigForm() {
    const ha = document.querySelector("home-assistant");
    const lang = (ha?.hass?.language) || "en";
    const t = (key) => localize(key, lang);
    return {
      schema: [
        { name: "entity", required: true, selector: { entity: { domain: ["sensor", "weather"] } } },
        { name: "name", selector: { text: {} } },
        { name: "max_entity", selector: { entity: { domain: "sensor" } } },
        { name: "protection_entity", selector: { entity: { domain: "binary_sensor" } } },
        {
          type: "grid",
          name: "",
          schema: [
            { name: "layout", selector: { select: { mode: "dropdown", options: [
              { value: "vertical", label: t("ed_vertical") },
              { value: "horizontal", label: t("ed_horizontal") },
            ] } } },
            { name: "align", selector: { select: { mode: "dropdown", options: [
              { value: "center", label: t("ed_center") },
              { value: "top", label: t("ed_top") },
            ] } } },
          ],
        },
        { name: "icon", selector: { icon: {} } },
        { name: "illustration", default: true, selector: { boolean: {} } },
        { name: "illustration_theme", selector: { select: { mode: "dropdown", options: ["auto", "day", "night"].map((v) => ({ value: v, label: t(`theme_${v}`) })) } } },
        { name: "show_title", default: true, selector: { boolean: {} } },
        { name: "show_value", default: true, selector: { boolean: {} } },
        { name: "show_label", default: true, selector: { boolean: {} } },
        { name: "show_advice", default: true, selector: { boolean: {} } },
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
      show_title: config.show_title !== false,
      show_label: config.show_label !== false,
      show_value: config.show_value !== false,
      show_advice: config.show_advice !== false,
      // "vertical" = value inside the gauge, advice under it (default);
      // "horizontal" = gauge on the left, value and advice on the right.
      layout: config.layout === "horizontal" ? "horizontal" : "vertical",
      // Drop the card background, border and shadow for a transparent look.
      transparent: config.transparent === true,
      // "center" (default) or "top": vertical alignment inside the card,
      // useful to line the card up with others in a horizontal-stack.
      align: config.align === "top" ? "top" : "center",
      // Illustrated header (beach scene) by default; false keeps the classic header.
      illustration: config.illustration !== false,
      // "auto" follows the Home Assistant theme (night with a dark one); "day" / "night" force the picture.
      illustration_theme: ["day", "night"].includes(config.illustration_theme) ? config.illustration_theme : "auto",
    };
    this._configSig = JSON.stringify(this._config);
    this._sig = null; // force a re-render on the next paint
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  connectedCallback() {
    this._observe();
    this._watchView();
    this._onVisibility ||= () => this._syncAnimation();
    document.addEventListener?.("visibilitychange", this._onVisibility);
  }

  disconnectedCallback() {
    this._resizeObserver?.disconnect();
    this._resizeObserver = null;
    if (this._fitFrame) cancelAnimationFrame(this._fitFrame);
    this._fitFrame = 0;
    this._viewObserver?.disconnect();
    this._viewObserver = null;
    this._offscreen = false;
    if (this._onVisibility) document.removeEventListener?.("visibilitychange", this._onVisibility);
  }

  // The SMIL rays and the marker pulse keep the page repainting even where
  // nobody sees them: pause them while the card is scrolled out of view (or in
  // a hidden view / closed stack) and while the browser tab is hidden.
  _watchView() {
    if (this._viewObserver || !this._els || typeof IntersectionObserver !== "function") return;
    this._viewObserver = new IntersectionObserver((entries) => {
      this._offscreen = !entries[entries.length - 1]?.isIntersecting;
      this._syncAnimation();
    });
    this._viewObserver.observe(this._els.card);
  }

  _animationPaused() {
    return this._offscreen === true || document.visibilityState === "hidden";
  }

  // Pause or resume the animations. With reduced motion the icon stays frozen
  // (the pulse is turned off by the stylesheet).
  _syncAnimation() {
    if (!this._els) return;
    this._els.card.toggleAttribute("data-paused", this._animationPaused());
    const svg = this._els.icon.querySelector("svg");
    if (!svg || reducedMotion()) return;
    if (this._animationPaused()) svg.pauseAnimations?.();
    else svg.unpauseAnimations?.();
  }

  // Re-fit the risk level when the card width changes (sections resize,
  // phone rotation, editor preview). Only a width change counts, and the fit
  // runs in the next animation frame, not in the callback: without a fixed
  // height (masonry, stacks) the text <-> dot switch changes the card height,
  // and resizing the observed card inside its own callback is a "ResizeObserver
  // loop completed with undelivered notifications" error.
  _observe() {
    if (this._resizeObserver || !this._els || typeof ResizeObserver !== "function") return;
    this._fitWidth = undefined;
    this._resizeObserver = new ResizeObserver((entries) => {
      const width = entries[entries.length - 1]?.contentRect.width;
      if (width !== undefined && width === this._fitWidth) return;
      this._fitWidth = width;
      if (this._fitFrame) cancelAnimationFrame(this._fitFrame);
      this._fitFrame = requestAnimationFrame(() => {
        this._fitFrame = 0;
        this._fitLabel();
      });
    });
    this._resizeObserver.observe(this._els.card);
  }

  // The status pill (the risk level) goes right after the title only when the whole title and its whole label fit
  // on that row; otherwise on its own line under the subtitle (data-wrap). It shows as its colored dot (beside the
  // title) when the banner has no room for that line above its sand strip, when the label does not fit even alone,
  // and on a card of 200 px or less, instead of a cut "M…". Measured with fractional widths: scrollWidth /
  // clientWidth are rounded and miss a text cut by less than a pixel (still drawn with an ellipsis).
  _fitLabel() {
    const { label: classic, pill, header } = this._els;
    const banner = this._config.illustration;
    const label = banner ? pill : classic;
    (label === pill ? classic : pill).toggleAttribute("data-dot", false);
    header.toggleAttribute("data-wrap", false);
    label.toggleAttribute("data-dot", false);
    label.removeAttribute("role");
    label.removeAttribute("aria-label");
    if (label.hidden || !label.getBoundingClientRect) return;
    const width = this._els.card.getBoundingClientRect?.().width;
    let dot = !banner && width > 0 && width <= 200;
    if (!dot && !this._pillBeside(label)) {
      header.toggleAttribute("data-wrap", true);
      if (!this._labelFits(label) || (banner && this._pillOut())) {
        header.toggleAttribute("data-wrap", false);
        dot = true;
      }
    }
    label.toggleAttribute("data-dot", dot);
    // A dot is an image named by the level; the text names itself otherwise.
    if (dot) {
      label.setAttribute("role", "img");
      label.setAttribute("aria-label", label.textContent);
    }
  }

  // Whether the whole title and the pill's whole label fit on the title row.
  _pillBeside(pill) {
    const row = pill.parentElement;
    const name = this._els.name;
    const shown = name && !name.hidden && getComputedStyle(name).display !== "none";
    const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
    name.style.flex = "none";
    const title = shown ? name.getBoundingClientRect().width + gap : 0;
    name.style.flex = "";
    pill.style.width = "max-content";
    const need = pill.getBoundingClientRect().width;
    pill.style.width = "";
    return title + need <= row.getBoundingClientRect().width + 0.01;
  }

  // Whether the banner's titles (the pill on its own line) run below the top of the sand strip or out of the banner.
  _pillOut() {
    const { header, name, sub, pill } = this._els;
    const b = header.getBoundingClientRect();
    const floor = b.bottom - 10 + 0.5;
    return [name, sub, pill].some((e) => {
      const r = e.getBoundingClientRect();
      return !e.hidden && r.height && (r.bottom > floor || r.top < b.top - 0.5 || r.right > b.right + 0.5);
    });
  }

  // Whether the label shows its whole text where it is.
  _labelFits(label) {
    const have = label.getBoundingClientRect().width;
    label.style.maxWidth = "none";
    label.style.width = "max-content";
    label.style.flex = "none";
    const need = label.getBoundingClientRect().width;
    label.style.maxWidth = "";
    label.style.width = "";
    label.style.flex = "";
    return need <= have + 0.01;
  }

  // Cheap fingerprint of everything that affects the rendered output, so we
  // only touch the DOM when it changes.
  _signature(stateObj, text) {
    const states = this._hass?.states || {};
    const max = states[this._config.max_entity];
    const protection = states[this._config.protection_entity];
    const locale = this._hass?.locale;
    return JSON.stringify([
      this._configSig,
      text,
      stateObj ? stateObj.state : null,
      stateObj ? stateObj.attributes.friendly_name : null,
      this._hass ? this._hass.language : null,
      max ? [max.state, max.attributes?.time] : null,
      protection ? [protection.state, protection.attributes?.start_time, protection.attributes?.end_time] : null,
      locale ? [locale.time_format, locale.time_zone] : null,
      this._config.illustration ? isNight(this._hass, this._config) : null,
    ]);
  }

  // The optional protection window footer.
  _hasExtra() {
    return !!this._config?.protection_entity;
  }

  getCardSize() {
    const size = this._config && this._config.layout === "horizontal" ? 4 : 5;
    return size + (this._hasExtra() ? 1 : 0) + (this._config?.illustration ? 1 : 0);
  }

  getGridOptions() {
    const horizontal = this._config && this._config.layout === "horizontal";
    const extra = this._hasExtra();
    // Horizontal: the gauge beside its text fits 3 rows, the footer takes a
    // 4th; vertical: the gauge with the value inside and the advice take 4.
    // The illustrated header (90 px) takes one more row.
    const rows = (horizontal ? (extra ? 4 : 3) : extra ? 5 : 4) + (this._config?.illustration ? 1 : 0);
    return horizontal
      ? { columns: 9, min_columns: 6, rows, min_rows: rows }
      : { columns: 6, min_columns: 4, rows, min_rows: rows };
  }

  static getStubConfig(hass) {
    const ids = hass ? Object.keys(hass.states) : [];
    const uv =
      ids.find((id) => id.startsWith("sensor.") && /(^|_|\.)uv(_|$)/.test(id)) ||
      ids.find((id) => id.startsWith("weather.") && hass.states[id].attributes?.uv_index !== undefined);
    return { entity: uv || "sensor.uv_index" };
  }

  // Builds the card once: the static stylesheet and the DOM skeleton. Later
  // renders only update text, attributes and the card's variables, so the
  // marker glides to its new place and the icon (and its SMIL animation) is
  // only swapped when the UV index changes.
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
    const mdi = el("div", "mdi", badge);
    const icon = el("div", "icon", badge);
    const titles = el("div", "titles", header);
    // The title row: the title, then (illustrated header) the status pill right after it.
    const trow = el("div", "trow", titles);
    const name = el("div", "name", trow);
    const pill = el("span", "pill", trow);
    const pillText = el("span", "txt", pill);
    // The classic header's pill, on the same title row.
    const label = el("div", "label", trow);
    const sub = el("div", "sub", titles);
    // The illustration (shown by the banner styles only) and its sand strip.
    this._uid ||= ++uvUid;
    const scene = el("div", "uv-scene", header);
    scene.innerHTML = uvSceneSvg(this._uid);
    el("div", "uv-ground", header);
    const body = el("div", "body", card);
    const gauge = el("div", "gauge", body);
    gauge.innerHTML = GAUGE_SVG;
    const value = el("div", "value", body);
    const advice = el("div", "advice", body);
    const extra = el("div", "extra", card);
    const protection = el("span", "protection", extra);
    // The entity is read when the event fires, so a config change needs no rebind.
    card.addEventListener("click", () => this._openMoreInfo(this._config.entity));
    // Keyboard: Enter or Space opens the entity dialog, like a button
    card.addEventListener("keydown", (ev) => {
      if (ev.key !== "Enter" && ev.key !== " ") return;
      ev.preventDefault();
      this._openMoreInfo(this._config.entity);
    });
    this._els = { card, header, name, pill, pillText, sub, mdi, icon, label, gauge, value, advice, extra, protection };
    this._iconKey = null;
    this._mdiKey = null;
    if (this.isConnected) {
      this._observe();
      this._watchView();
    }
  }

  // The banner badge: the `icon` option, else the MDI sun (its colour follows the level, from the stylesheet).
  _renderMdi() {
    const { mdi } = this._els;
    const custom = this._config.illustration ? this._config.icon || "" : null;
    if (custom === this._mdiKey) return;
    this._mdiKey = custom;
    if (custom === null) mdi.innerHTML = "";
    else if (custom) {
      mdi.innerHTML = "";
      mdi.appendChild(document.createElement("ha-icon")).setAttribute("icon", custom);
    } else mdi.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${MDI_SUN}"/></svg>`;
  }

  // The animated Meteocons icon of the index: in the classic badge (where the `icon` option replaces it), or in
  // the banner's sky.
  _renderIcon(index) {
    const { icon } = this._els;
    const custom = this._config.illustration ? null : this._config.icon;
    const iconKey = custom ? `icon:${custom}` : String(index);
    if (iconKey === this._iconKey) return;
    this._iconKey = iconKey;
    if (custom) {
      icon.innerHTML = "";
      icon.appendChild(document.createElement("ha-icon")).setAttribute("icon", custom);
      return;
    }
    icon.innerHTML = iconSvg(index);
    // SMIL ignores CSS media queries: honour prefers-reduced-motion by
    // freezing the rays' rotation on its first frame.
    const svg = icon.querySelector("svg");
    if (reducedMotion()) {
      svg?.pauseAnimations?.();
      svg?.setCurrentTime?.(0);
    } else if (this._animationPaused()) {
      // A new icon starts animating: keep it paused off-screen.
      svg?.pauseAnimations?.();
    }
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
    const text = uvText(entityId, stateObj);
    const sig = this._signature(stateObj, text);
    if (sig === this._sig) return;
    this._sig = sig;

    // Number("") and Number(" ") are 0: an empty state is unavailable, not "0".
    const raw = text !== "" ? Number(text) : NaN;
    const available = !!stateObj && Number.isFinite(raw);

    // Round the UV index; a negative reading is shown as 0. The icons stop at 11.
    const rounded = available ? Math.max(0, Math.round(raw)) : NaN;
    const index = available ? Math.min(rounded, 11) : NaN;

    // Language: explicit config wins, otherwise follow the Home Assistant UI.
    const lang =
      this._config.language || (this._hass?.language) || "en";
    const t = (key) => localize(key, lang);

    // WHO bands are defined on whole numbers: use the value that is displayed.
    const level = available ? levelFor(rounded) : null;
    const levelIndex = level ? UV_LEVELS.indexOf(level) : -1;
    const name =
      this._config.name ||
      (stateObj?.attributes.friendly_name) ||
      t("name");

    // A sensor that has not reported yet ("unknown") is told apart from one
    // that is offline ("unavailable").
    const labelText = level ? t(level.key) : t(stateObj?.state === "unknown" ? "unknown" : "unavailable");

    const { card, label, value, advice, gauge } = this._els;
    card.setAttribute("data-layout", this._config.layout);
    card.setAttribute("data-align", this._config.align);
    card.toggleAttribute("data-transparent", this._config.transparent);
    card.toggleAttribute("data-unavailable", !level);
    if (level) {
      card.setAttribute("data-level", String(levelIndex));
      card.style.setProperty("--uv-angle", `${gaugeAngle(rounded).toFixed(2)}deg`);
    } else {
      card.removeAttribute("data-level");
    }
    card.style.setProperty("--uv-color", level ? `var(--uv-${level.key.replace("_", "-")})` : "var(--secondary-text-color)");
    this._els.name.textContent = name;
    this._els.name.hidden = !this._config.show_title;
    this._renderBanner(labelText);
    this._renderIcon(index);
    this._els.icon.setAttribute("title", labelText);
    gauge.setAttribute("title", labelText);

    value.textContent = available ? String(rounded) : "—";
    value.hidden = !this._config.show_value;
    label.textContent = labelText;
    label.setAttribute("title", labelText);
    label.hidden = !this._config.show_label;

    advice.textContent = level
      ? t(`advice_${level.key}`).replace("{from}", formatHour(11, this._hass, lang)).replace("{to}", formatHour(16, this._hass, lang))
      : "";
    advice.hidden = !this._config.show_advice || !level;

    this._renderMax(lang);
    this._renderProtection(lang);
    card.toggleAttribute("data-paused", this._animationPaused());
    this._fitLabel();
  }

  // The illustrated header: the banner class (night picture), the MDI badge and the status pill on the title row
  // (the risk level, "Very high"). The index itself is not repeated under the title: the gauge shows it big just
  // below; the subtitle keeps the day's max (see _renderMax).
  _renderBanner(labelText) {
    const { card, header, pill, pillText } = this._els;
    const on = this._config.illustration;
    header.className = on ? `header banner${isNight(this._hass, this._config) ? " night" : ""}` : "header";
    card.toggleAttribute("data-illustration", on);
    this._renderMdi();
    pillText.textContent = labelText;
    pill.setAttribute("title", labelText);
    pill.hidden = !on || !this._config.show_label;
  }

  // "Max 8 · 13:20" under the title from a max UV sensor (OpenUV: its "time"
  // attribute), and the max tick on the gauge.
  _renderMax(lang) {
    const { card, sub, header } = this._els;
    const maxObj = this._hass?.states?.[this._config.max_entity];
    const maxText = maxObj ? String(maxObj.state).trim() : "";
    const maxRaw = maxText !== "" ? Number(maxText) : NaN;
    const has = !!this._config.max_entity && Number.isFinite(maxRaw);
    if (has) {
      const rounded = Math.max(0, Math.round(maxRaw));
      const at = formatTime(maxObj.attributes?.time, this._hass, lang);
      sub.textContent = `${localize("max_uv", lang)} ${rounded}${at ? ` · ${at}` : ""}`;
      sub.setAttribute("title", sub.textContent);
      card.style.setProperty("--uv-max-angle", `${gaugeAngle(rounded).toFixed(2)}deg`);
    } else {
      sub.textContent = "";
    }
    sub.hidden = !has;
    header.toggleAttribute("data-sub", has);
    card.toggleAttribute("data-max", has);
  }

  // "Protection 10:45–16:30" from a protection window binary sensor (OpenUV:
  // start_time / end_time), highlighted while the window is on.
  _renderProtection(lang) {
    const { extra, protection } = this._els;
    const t = (key) => localize(key, lang);
    const protObj = this._hass?.states?.[this._config.protection_entity];
    const on = protObj?.state === "on";
    const start = formatTime(protObj?.attributes?.start_time, this._hass, lang);
    const end = formatTime(protObj?.attributes?.end_time, this._hass, lang);
    if (this._config.protection_entity && protObj && start && end) {
      protection.textContent = `${t("protection")} ${start}–${end}`;
    } else if (this._config.protection_entity && on) {
      protection.textContent = t("protection_now");
    } else {
      protection.textContent = "";
    }
    protection.hidden = protection.textContent === "";
    protection.toggleAttribute("data-active", on && !protection.hidden);
    extra.hidden = protection.hidden;
  }

  _openMoreInfo(entityId) {
    this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId }, bubbles: true, composed: true }));
  }
}

// Guarded: the resource may be loaded twice (HACS and /local/, or two ?v= URLs).
if (!customElements.get("ha-uv-card")) {
  pickerDefine("ha-uv-card", UvIndexCard);

  // Register the card so it shows up in the dashboard card picker.
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: "ha-uv-card",
    name: "UV Index Card",
    description: "Displays the current UV index on a WHO-coloured gauge, with the risk level and protection advice.",
    preview: true,
    documentationURL: "https://github.com/juju35/ha-uv-card",
  });

  console.info(
    `%c HA-UV-CARD %c v${CARD_VERSION} `,
    "color: white; background: #f9a825; font-weight: 700;",
    "color: #f9a825; background: white; font-weight: 700;"
  );
}
