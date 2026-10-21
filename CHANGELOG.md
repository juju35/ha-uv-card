# Changelog

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
