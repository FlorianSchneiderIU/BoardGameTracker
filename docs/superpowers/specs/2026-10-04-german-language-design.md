# German UI language (default)

## Goal

The web UI is shown in German. German (`de-de`) is the default UI language for new installs,
and the language chosen in Settings actually drives the UI text.

## Current state

- Translations: `boardgametracker.client/public/locales/<lang>/<namespace>.json` (26 namespaces).
  `base/` is the Crowdin source and the most complete set (it has keys `en-US` lacks).
- `utils/i18n.ts` uses the browser `LanguageDetector`, `supportedLngs: ["en-US","nl-NL","nl-BE"]`,
  `fallbackLng: "en-US"`. In DEV it always loads `locales/base`.
- `i18n.changeLanguage` is never called: the Settings language picker (`ui_language`) only affects
  date-fns locales, not labels.
- Backend seeds `Languages` (`en-us`, `nl-be`) via `HasData` in `MainDbContext.SeedLanguages`.
  `ConfigDefaults` sets `ui_language = en-us`; `SeedConfigAsync` only inserts missing keys.

## Design

### Translations
- New `public/locales/de-DE/` with all 26 namespaces translated from `base/`, identical key sets,
  `{{placeholders}}` and i18next plural suffixes preserved. Informal "du" is not used; UI copy uses
  neutral/imperative German (e.g. "Spiel hinzufügen").
- `language.json` in every locale gains `"german": "Deutsch"`.

### Frontend
- `utils/i18n.ts`: remove `LanguageDetector`; `lng: "de-DE"` (first paint before settings load is
  German); `supportedLngs` adds `"de-DE"`; `fallbackLng` stays `"en-US"` so an untranslated key
  shows English rather than a raw key. `loadPath` becomes a function: in DEV, `en-US` reads `base/`,
  every other language reads its own folder; in production unchanged.
- New hook `hooks/useUiLanguageSync.ts`: given `uiLanguage` from the settings query, calls
  `i18n.changeLanguage(uiLanguage)` when it differs from the current language, and sets
  `document.documentElement.lang`. Mounted in `routes/__root.tsx` once auth allows fetching settings.
  i18next normalises `de-de` → `de-DE`.
- `index.html` `lang` default becomes `de`.

### Backend
- `SeedLanguages` adds `new Language { Id = 3, Key = "de-de", TranslationKey = "german" }`;
  new Postgres EF migration `AddGermanLanguage` (generated with `dotnet ef` in the .NET 10 SDK container).
- `ConfigDefaults` `ui_language` → `de-de` (new installs only; existing installs keep their value and
  can switch in Settings).

### Tests
- Vitest: `useUiLanguageSync` calls `changeLanguage` / sets `lang`; a locale-parity test asserting every
  `de-DE` file has exactly the key set of `base/`.
- xUnit: `ConfigDefaultsTests` expects `de-de`.
- Run frontend lint, typecheck, tests; backend build + tests (Docker SDK image).

## Out of scope
Enabling `es-ES`, locale-aware number/currency formatting, Crowdin configuration, hard-coded English
strings outside the translation files (to be listed if found, not fixed here).
