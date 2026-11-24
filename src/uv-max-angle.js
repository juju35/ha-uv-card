// --uv-max-angle on ha-card) so their moves are transitions, not redraws.
import { BOUNDS, CX, CY, GAUGE_MAX, R, UV_LEVELS, arcPoint } from "./core.js";

export const GAP = 0.006;
export const GAUGE_SVG = `<svg viewBox="0 0 200 112" aria-hidden="true">${UV_LEVELS.map((l, i) => {
  const t0 = BOUNDS[i] / GAUGE_MAX + (i ? GAP : 0);
  const t1 = BOUNDS[i + 1] / GAUGE_MAX - (i < UV_LEVELS.length - 1 ? GAP : 0);
  return `<path class="seg s${i}" style="stroke: var(--uv-${l.key.replace("_", "-")})" d="M ${arcPoint(t0)} A ${R} ${R} 0 0 1 ${arcPoint(t1)}"/>`;
}).join("")}<g class="tick"><line x1="${CX - R - 11}" y1="${CY}" x2="${CX - R + 11}" y2="${CY}"/></g><g class="marker"><circle class="halo" cx="${CX - R}" cy="${CY}" r="9"/><circle class="dot" cx="${CX - R}" cy="${CY}" r="9"/></g></svg>`;

// The illustrated header ("banner"): a beach at the right of a 200 x 80 picture (sea with a rolling wave, sand,
// a parasol and a towel), under a sky that is the banner's own background, and a 10 px sand strip edge to edge
// at the bottom. The card's own animated Meteocons icon (rays turning, the index in its badge) stands in the sky
// at the top right; a glow behind it and a heat haze over the sand grow with the risk level. Night: stars, dark
// sea and sand, no glow. `uid` keeps each card's gradient id apart.
export const UV_STARS = [[12, 8], [44, 18], [96, 6], [132, 24], [168, 10], [188, 30], [70, 30]];
export const UV_WAVE = `M0 58${" q5 -2 10 0"}${" t10 0".repeat(21)}`;
export const uvSceneSvg = (uid) => `<svg viewBox="0 0 200 80" preserveAspectRatio="xMaxYMax meet" aria-hidden="true" focusable="false">
  <defs><radialGradient id="uv-glow-${uid}"><stop offset="0" stop-color="#ffd54f" stop-opacity=".9"/><stop offset="1" stop-color="#ffd54f" stop-opacity="0"/></radialGradient></defs>
  <g class="uv-stars">${UV_STARS.map(([x, y], i) => `<circle class="uv-star${i % 3 ? "" : " tw"}" cx="${x}" cy="${y}" r=".6"/>`).join("")}</g>
  <circle class="uv-glow" cx="170" cy="26" r="30" fill="url(#uv-glow-${uid})"/>
  <rect class="uv-sea" y="56" width="200" height="14"/>
  <path class="uv-wave" d="${UV_WAVE}"/>
  <g class="uv-haze"><path d="M34 64q2-3 0-6t0-6"/><path d="M76 63q2-3 0-6t0-6"/><path d="M150 63q2-3 0-6t0-6"/><path d="M186 64q2-3 0-6t0-6"/></g>
  <path class="uv-sand" d="M0 70 Q100 62 200 68 V80 H0Z"/>
  <g transform="translate(110 70)"><path class="uv-pole" d="M0 0 V-28"/><path class="uv-parasol" d="M-16 -26 Q0 -38 16 -26Z"/></g>
  <rect class="uv-towel" x="122" y="66" width="22" height="3" rx="1"/>
</svg>`;

// Material Design Icons "weather-sunny": the banner badge icon (an `icon` option replaces it).
export const MDI_SUN =
  "M12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,2L14.39,5.42C13.65,5.15 12.84,5 12,5C11.16,5 10.35,5.15 9.61,5.42L12,2M3.34,7L7.5,6.65C6.9,7.16 6.36,7.78 5.94,8.5C5.5,9.24 5.25,10 5.11,10.79L3.34,7M3.36,17L5.12,13.23C5.26,14 5.53,14.78 5.95,15.5C6.37,16.24 6.91,16.86 7.5,17.37L3.36,17M20.65,7L18.88,10.79C18.74,10 18.47,9.23 18.05,8.5C17.63,7.78 17.1,7.15 16.5,6.64L20.65,7M20.64,17L16.5,17.36C17.09,16.85 17.62,16.22 18.04,15.5C18.46,14.77 18.73,14 18.87,13.21L20.64,17M12,22L9.59,18.56C10.33,18.83 11.14,19 12,19C12.82,19 13.63,18.83 14.37,18.56L12,22Z";

// Night picture: forced by illustration_theme, else Home Assistant's dark theme alone (a light theme keeps the day
// picture after sunset).
export function isNight(hass, config) {
  if (config.illustration_theme === "night") return true;
  if (config.illustration_theme === "day") return false;
  return !!hass?.themes?.darkMode;
}

// Static stylesheet, injected once. The per-render values are driven by the
