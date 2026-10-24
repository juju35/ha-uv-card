# Changelog

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
