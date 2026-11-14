// The README still shots, kept free of Playwright and dist/ so the tests can check them.
// Each <file>-dark shot is the dark twin of <file>: same width, config and states, only the theme changes.
export const uv = (value) => ({
  "sensor.uv_index": { entity_id: "sensor.uv_index", state: String(value), attributes: { friendly_name: "UV index", unit_of_measurement: "UV index" } },
});

// OpenUV's daily max UV and protection window sensors, for the extra line.
export const extra = {
  "sensor.max_uv_index": { entity_id: "sensor.max_uv_index", state: "7.6", attributes: { time: "2026-07-01T13:20:00" } },
  "binary_sensor.protection_window": {
    entity_id: "binary_sensor.protection_window",
    state: "on",
    attributes: { start_time: "2026-07-01T10:45:00", end_time: "2026-07-01T16:30:00" },
  },
};
const extraConfig = { entity: "sensor.uv_index", max_entity: "sensor.max_uv_index", protection_entity: "binary_sensor.protection_window" };

// Still shots: each one in light and dark, with the same state.
const pairs = [
  // The default (vertical) gauge, with OpenUV's max UV (tick and subtitle) and protection window (footer).
  { file: "card", width: 360, config: extraConfig, hass: { states: { ...uv(9), ...extra }, locale: { time_format: "24" } } },
  // Horizontal: the gauge on the left, the value and the advice on the right.
  { file: "card-horizontal", width: 460, config: { ...extraConfig, layout: "horizontal" }, hass: { states: { ...uv(4), ...extra }, locale: { time_format: "24" } } },
  // A small card with only the UV sensor.
  { file: "card-compact", width: 240, config: { entity: "sensor.uv_index", name: "UV" }, hass: { states: uv(2) } },
  { file: "card-unavailable", width: 360, config: { entity: "sensor.uv_index" }, hass: { states: uv("unavailable") } },
];

export const SHOTS = pairs.flatMap((s) => [
  { ...s, type: "ha-uv-card", theme: "light" },
  { ...s, file: `${s.file}-dark`, type: "ha-uv-card", theme: "dark" },
]);
