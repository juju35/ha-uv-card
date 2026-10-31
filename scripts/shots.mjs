// The README still shots, kept free of Playwright and dist/ so the tests can check them.
// Each <file>-dark shot is the dark twin of <file>: same width, config and states, only the theme changes.
export const uv = (value) => ({
  "sensor.uv_index": { entity_id: "sensor.uv_index", state: String(value), attributes: { friendly_name: "UV index", unit_of_measurement: "UV index" } },
});

export const SHOTS = [
  { file: "card", type: "ha-uv-card", theme: "light", width: 460, config: { entity: "sensor.uv_index" }, hass: { states: uv(6) } },
  { file: "card-dark", type: "ha-uv-card", theme: "dark", width: 460, config: { entity: "sensor.uv_index" }, hass: { states: uv(9) } },
  { file: "card-vertical", type: "ha-uv-card", theme: "light", width: 380, config: { entity: "sensor.uv_index", layout: "vertical", name: "UV" }, hass: { states: uv(2) } },
  { file: "card-vertical-dark", type: "ha-uv-card", theme: "dark", width: 380, config: { entity: "sensor.uv_index", layout: "vertical", name: "UV" }, hass: { states: uv(2) } },
  { file: "card-unavailable", type: "ha-uv-card", theme: "light", width: 460, config: { entity: "sensor.uv_index" }, hass: { states: uv("unavailable") } },
  { file: "card-unavailable-dark", type: "ha-uv-card", theme: "dark", width: 460, config: { entity: "sensor.uv_index" }, hass: { states: uv("unavailable") } },
];
