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

export const SHOTS = [
  { file: "card", type: "ha-uv-card", theme: "light", width: 460, config: { entity: "sensor.uv_index" }, hass: { states: uv(6) } },
  { file: "card-dark", type: "ha-uv-card", theme: "dark", width: 460, config: { entity: "sensor.uv_index" }, hass: { states: uv(6) } },
  { file: "card-vertical", type: "ha-uv-card", theme: "light", width: 380, config: { entity: "sensor.uv_index", layout: "vertical", name: "UV" }, hass: { states: uv(2) } },
  { file: "card-vertical-dark", type: "ha-uv-card", theme: "dark", width: 380, config: { entity: "sensor.uv_index", layout: "vertical", name: "UV" }, hass: { states: uv(2) } },
  { file: "card-extra", type: "ha-uv-card", theme: "light", width: 460, config: extraConfig, hass: { states: { ...uv(6), ...extra }, locale: { time_format: "24" } } },
  { file: "card-extra-dark", type: "ha-uv-card", theme: "dark", width: 460, config: extraConfig, hass: { states: { ...uv(6), ...extra }, locale: { time_format: "24" } } },
  { file: "card-unavailable", type: "ha-uv-card", theme: "light", width: 460, config: { entity: "sensor.uv_index" }, hass: { states: uv("unavailable") } },
  { file: "card-unavailable-dark", type: "ha-uv-card", theme: "dark", width: 460, config: { entity: "sensor.uv_index" }, hass: { states: uv("unavailable") } },
];
