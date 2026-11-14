# Changelog

## 1.10.0 - 2026-11-14

### Features
- **Gauge redesign**: the UV index is shown on a half-circle gauge from 0 to 11+ split into the five WHO bands (green 0–2, yellow 3–5, orange 6–7, red 8–10, violet 11+). The bands above the current value are dimmed, a round marker sits on the arc at the value and glides to a new one (CSS transition, the DOM is updated in place), with a gentle pulse at Very high and Extreme; the big value sits in the centre in the level's colour.
- WHO sun protection advice under the value, per level ("No protection needed", "Sunglasses · SPF 30+ at midday", "SPF 30+ · hat · shade at noon", "Avoid the sun 11:00–16:00", "Stay inside if possible"), in the 22 languages; new `show_advice` option (default `true`, also in the visual editor).
- Header: round tinted badge with the animated Meteocons icon, the title, a "Max 8 · 13:20" subtitle when `max_entity` is set, and the WHO risk level as a status pill on the right. A `max_entity` also puts a tick on the gauge at the day's max.
- New `icon` option (also in the visual editor) to show an icon of your choice in the badge instead of the animated one.
- The protection window (`protection_entity`) moves to a footer line, highlighted while it is on.
- Band colours are CSS variables, overridable from a theme: `--uv-low-color`, `--uv-moderate-color`, `--uv-high-color`, `--uv-very-high-color`, `--uv-extreme-color`.
- Unavailable sensor: dimmed gauge without marker, "Unavailable" (or "Unknown") pill.

### Changes
- The default layout is now `vertical` (value inside the gauge, advice under it). `layout: horizontal` puts the gauge on the left and the value and advice on the right, and stacks them on cards narrower than 300 px. Every existing option keeps working.
- Sections grid size: 6 columns × 4 rows by default (5 with a protection window); horizontal 9 columns × 3 rows (4 with a protection window).
- "Very High" is written "Very high" in English.
- README: new screenshots (light and dark) and one GIF per risk band showing the marker animation.

## 1.9.0 - 2026-11-12

### Features
- `show_title` option (also in the visual editor) hides the card's title (the name), for a card placed under a section heading of its own (asked in juju35/ha-vehicle-card#72).

## 1.8.1 — 2026-11-09

### Fixes
- Translations: the cards are defined once the page's language file has arrived (at most 1.5 s; Home Assistant builds a card when its element gets defined), so the first render is already translated instead of English then redrawn; until a language file is in, a missing text reads the English one wherever the card has no fallback of its own.

## 1.8.0 — 2026-11-09

### Performance
- **Translations load on demand**: the bundle keeps English only (63 KB → 52 KB) and each other language is its own `ha-uv-card.i18n.<lang>.js` file next to it, fetched the first time a card needs it. Home Assistant loads every dashboard resource on every dashboard, so each page used to download and parse all 22 languages to use one. Until a language file has arrived (a few milliseconds), texts fall back to English, and the cards redraw once it is there.

### Maintenance
- Build: `scripts/i18n-split.mjs` splits the built bundle and rebuilds every table from the split files to check them (the build fails on any difference); `src/` keeps every language as before.
- Release: every file of `dist/` is attached. Manual installation copies the translation files too.

## 1.7.1 — 2026-11-08

### Fixes
- A sensor that has not reported yet (`unknown` state) is now labelled "Unknown", in every language, instead of "Unavailable", which stays for a sensor that is offline.

## 1.7.0 — 2026-11-07

### Changes
- The card accepts a weather entity (Met.no and others) and reads its `uv_index` attribute; before, only sensors could be picked although the README listed Met.no.
- New `max_entity` and `protection_entity` options show the day's max UV and the sun protection window (e.g. from OpenUV) on a line under the value, highlighted while protection is needed.
- The icon animation is paused while the card is off-screen or the browser tab is hidden, which saves CPU.

## 1.6.9 — 2026-11-04

### Documentation
- README: images and links use absolute URLs, so the screenshots, icons, badges and links display in HACS (relative paths broke there).
- README: screenshots get a display size, so cards no longer show oversized in HACS and on GitHub.

## 1.6.8 — 2026-11-04

### Changes
- Added Romanian, Danish, Swedish, Bulgarian, Russian, Ukrainian, Hungarian, Slovak, Czech, Slovenian, Latvian and Greek translations, with their native names in the editor's language selector.

## 1.6.7 — 2026-11-01

### Changes
- In the sections view the card now fills its cell with the default `center` alignment too, so it is as tall as its neighbours and its content is really centered (before, only `top` filled the cell).
- On narrow cards the risk level stays on one line inside the card. Before, Polish, Serbian, German, Spanish, Italian and Dutch levels wrapped onto two lines or ran past the card edge.
  - A narrow horizontal card (up to 6 columns on a phone) puts the level on its own row under the icon and the value, so every level shows in full at the default 6 columns.
  - When a level still cannot fit (4 columns on a phone, or 3 to 4 when vertical), it shows as its colored dot instead of a cut "M…", the level staying in its tooltip and for screen readers. A short level that fits keeps its text.
- On a very narrow card (about 4 columns on a phone, or 3 when vertical) the small header icon is left out, so the title stays inside the card instead of running past its edge.
- In a container that sizes the card to its content (an `inline-block`, a grid `auto` column, layout-card or button-card) the card keeps a usable width instead of shrinking to its title. In a two-column grid (grid card, layout-card), directly or wrapped in another element, it still shrinks to its column instead of running past the grid.
- In the masonry view or a stack, switching the risk level between its text and its dot no longer logs a "ResizeObserver loop" error.
- The card shows a focus ring when it is reached with the keyboard.

### Maintenance
- CI: Biome 2.6.4.
- The screenshot and GIF scripts only rewrite a capture when its pixels changed, so an unchanged card no longer shows up as modified files in a pull request.
- Browser tests (Chromium) for the card width in real containers, the risk level refit and the screenshot pixel comparison, run in the screenshots workflow.

## 1.6.6 — 2026-11-01

### Changes
- Added Polish translations. Italian, Dutch and European Portuguese were already there: every language is now checked against English (same keys and placeholders, no empty value).

## 1.6.5 — 2026-11-01

### Changes
- Added Serbian (Cyrillic and Latin) translations.
- A Home Assistant language set to `sr-Latn` now picks the Latin-script translation: the full language code is matched before its base code.

## 1.6.4 — 2026-11-01

### Changes
- The UV value, the risk level label and the header icon are now readable in every band, in light and dark themes: they use the band color mixed with the theme text color (at least 4.5:1), while the tinted backgrounds keep the pure band color. Moderate (yellow) on a light theme and Very High / Extreme (red, purple) on a dark theme were hard to read.
- With "reduce motion" enabled in the system or browser settings, the UV icon's rotating rays stay still.

### Maintenance
- CI: Biome 2.6.3 everywhere; the Lint workflow now reads the Biome version from `.pre-commit-config.yaml`.

## 1.6.3 — 2026-10-29

### Changes
- HACS now asks for Home Assistant 2024.11 or later, the version whose sections view reads the card's size (3 rows, 4 when vertical); on 2024.8 to 2024.10 the card was shown at the default size. The README prerequisite says so too.

## 1.6.2 — 2026-10-29

### Changes
- An empty sensor state now shows "Unavailable" instead of "0 / Low", and a negative reading is displayed as 0.
- The card is built once and then only updated: the UV icon animation no longer restarts when only the name, risk label, language or options change.

### Maintenance
- README: new screenshot of the unavailable state.
- CI: the Screenshots workflow works on pull requests from forks, re-runs when Playwright is bumped, retries the Chromium download and re-runs Lint, Validate and HACS after committing refreshed screenshots; Biome no longer runs twice in the Lint workflow.

## 1.6.1 — 2026-10-28

### Changes
- Visual editor: the language dropdown now starts with an "Auto (Home Assistant)" entry (translated in all seven languages), so a card can go back to following the Home Assistant language after a language was picked, without editing the YAML.
- Loading the card twice no longer logs its version banner twice.

### Maintenance
- README: new Animations section with one GIF per WHO risk band, rendered by `npm run gifs`; refreshed screenshots and a corrected "Dark" column header.
- CI: the release waits for the tests and only runs when `package.json` or `CHANGELOG.md` change, `hacs/action` is pinned on its 22.5.0 release, a Screenshots workflow re-renders stills and GIFs on pull requests, and the unused ruff tooling is gone.

## 1.6.0 — 2026-10-26

### Maintenance
- Build: the version and inlined icon SVGs are now injected with function replacements, so any `$` pattern (`$&`, `$$`, `$1`...) in a future icon or version string is inserted literally instead of being interpreted and silently corrupting `dist/ha-uv-card.js`.

## 1.5.0
### Changes
- Standard header like the other cards: a sun icon in a round badge tinted with the risk level color, then the name (16 px). The animated icon, value and risk level sit below it, side by side or stacked with `layout: vertical`. The card takes one more row in the sections view (3 rows, 4 when vertical).
- The UV index value is 30 px at regular weight (was 28 px medium), like the other cards' main value.
- Header geometry: the icon and value start 8 px under the header (was 10 px); badge 12 px from the top and left edges.

## 1.4.1

### Changes
- The card keeps the keyboard focus when its value changes, so Enter or Space still opens the entity dialog; a card without the focus never takes it.

### Maintenance
- New focus tests (7 in all); the screenshot script renders each capture in its own page, and the duplicate-code check ignores test folders.

## 1.4.0

### Changes
- The risk level now follows the value shown: a state of 2.4 displays "2" with *Low* (it used to say *Moderate*); the same at 5.4, 7.4 and 10.4.
- Loading the card twice (HACS and `/local/`, or two `?v=` URLs) no longer breaks it or lists it twice in the card picker.
- Keyboard access: the card can be focused and Enter or Space opens the entity dialog.
- Visual editor labels translated in German, Spanish, Italian, Dutch and Portuguese, like the card.

### Maintenance
- CI: actions pinned by commit SHA, read-only token permissions, Dependabot for GitHub Actions, duplicate-code annotations, and a `node --test` suite run on every push.

## 1.3.1

### Maintenance
- Tooling only, no functional change: Biome linting, pre-commit and a Lint CI (duplication checks). Card source modernized (optional chaining, template literals), identical behavior.

## 1.3.0

### Changes
- More compact layout with the same information, like the other ha-* cards: 12 px card padding, 36 px header icon, 16 px name and 12 px subtitle, 11 px pills, tighter tiles and sections.
- Animated icon 72 → 56 px, value 32 → 28 px.

## 1.2.0

### What's new
- Visual editor: pick the sensor and set the name, layout, alignment, value, risk level, transparent background and language from a form (English and French labels).

### Changes
- HACS now asks for Home Assistant 2024.8 or later, the version that brought the sections view the card supports; the README says so under **Prerequisites**.

### Maintenance
- CHANGELOG headings use the same plain English set as the other ha-* repositories.

## 1.1.0

### What's new
- Same sizes as the other cards: 18 px name, 32 px value, risk level as a pill tinted with its WHO colour.
- Sections view support (`getGridOptions`): 6 columns × 2 rows, 3 × 3 with `layout: vertical`.
- The card picker preselects a UV sensor when there is one.
- The name and labels are escaped.

### Maintenance
- Sources in `src/`, icons in `icons/`: `npm run build` inlines them into `dist/ha-uv-card.js`, which is no longer committed (the release attaches it).
- Pushing a new version to `main` publishes the release; release notes, stale issues and merged-branch cleanup workflows; issue templates.
- `npm run screenshots` renders the README screenshots.
- README follows the same plan as the other repositories.

## 1.0.1

- Release workflow can be run by hand.

## 1.0.0

- First release: animated UV index icon (0–11+), value and WHO risk level, horizontal or vertical layout, transparent mode, top alignment, 7 languages.
