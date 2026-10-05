# German UI Language Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show the BoardGameTracker web UI in German, make German (`de-de`) the default UI language, and make the Settings language picker actually drive the UI text.

**Architecture:** Add a complete `de-DE` translation set next to the existing i18next locale folders. Replace browser language detection with an explicit default (`de-DE`) plus a small hook in the root route that applies `settings.uiLanguage` via `i18n.changeLanguage`. On the backend, seed a `de-de` language row (EF migration) and change the `ui_language` config default.

**Tech Stack:** React 19 + i18next 26 / react-i18next / i18next-http-backend, TanStack Query & Router, Vitest; ASP.NET Core (.NET 10), EF Core (Npgsql), xUnit + FluentAssertions. No local .NET SDK — backend commands run in the `mcr.microsoft.com/dotnet/sdk:10.0` Docker image.

Spec: `docs/superpowers/specs/2026-10-04-german-language-design.md`

## Implementation status (2026-10-05)

- Frontend Tasks 1–6 implemented in commit `c12195c4`; translation commits grouped with the runtime changes. The existing pnpm lockfile is used instead of introducing an npm lockfile. React remains at the repository's current version (18).
- All 26 German namespaces pass key parity and per-key interpolation, nesting, and markup checks. Full frontend suite: 86 files / 1,091 tests passed; subsequent focused run including four additional integration tests: 4 files / 80 tests passed. Typecheck and production build passed; the build includes all 26 German locale files.
- Strict repository-wide Biome fails on existing line-ending formatting (452 diagnostics at the initial run). Repository-wide lint with formatting disabled passes; all seven changed TypeScript files pass the full Biome check. No unrelated source formatting was applied.
- Hook and root-route failing tests were verified before implementation. Initial locale red test hit the global setup's browser requirement; untranslated-namespace red runs were not repeated. Backend red test was blocked by NuGet DNS. These historical steps remain unchecked.
- Backend Task 7 implemented in commit `7b603825`: default, language seed, generated migration, and model snapshot. Migration Up/Down only insert/delete German language row 3, with no unrelated model drift. Configuration tests: 30 passed; final compile including the generated migration and full backend suite: 1,741 passed. Host build passed. Migration generation required placeholder DB connection variables and explicit container DNS in this environment.
- HTTP smoke check passed for German HTML and served German common/settings resources. Interactive browser and Settings save smoke test remains outstanding because the browser execution tool is unavailable. No deployment or live database migration was performed.
- Report-only English scan found `No results` in `src/routes/game-nights/-components/MultiSelectField.tsx:157`.
- Push remains blocked by missing GitHub credentials: Git Credential Manager waited for interactive sign-in; the noninteractive retry failed with `unable to get password from user`. Implementation commits are local on `feat/german-language`. After authenticating Git, run `git push -u origin feat/german-language`.

## Global Constraints

- Branch: `feat/german-language`. Remote `origin` = `FlorianSchneiderIU/BoardGameTracker`, `upstream` = `mregni/BoardGameTracker`.
- Frontend commands run from `boardgametracker.client/`. Code style: tabs, double quotes, Biome (`npm run lint`).
- Language codes: backend/settings use lowercase `de-de`; locale folder and i18next code are `de-DE`.
- Translation source is `public/locales/base/` (NOT `en-US/`, which is missing keys).
- Every `de-DE/<ns>.json` must have exactly the same nested key set as `base/<ns>.json`. 2-space indentation, UTF-8 without BOM, trailing newline, real umlauts (ä ö ü ß), never `ae/oe/ue`.
- Translation rules: keep `{{placeholders}}` verbatim (names unchanged, e.g. `{{count}}`, `{{title}}`); keep `$t(...)` nesting references verbatim; keep Trans tags (`<0>…</0>`, `<1/>`) and HTML verbatim; keep plural suffixes (`_one`, `_other`, `_zero`) as keys — German uses `_one`/`_other` like English; keep i18next format params (`{{value, capitalize}}`) verbatim; brand/product names untranslated (BoardGameGeek, BGG, Ollama, OIDC, Sentry, Docker, ChangeDetection.io).
- Tone: address the user formally ("Sie") only when a pronoun is unavoidable; prefer neutral/imperative UI German ("Spiel hinzufügen", "Speichern", "Keine Partien gefunden").
- Glossary (use consistently):

  | English | German |
  |---|---|
  | game | Spiel |
  | expansion | Erweiterung |
  | session / play | Partie |
  | player | Spieler |
  | winner / win / loss | Gewinner / Sieg / Niederlage |
  | score | Punkte / Punktzahl |
  | game night | Spieleabend |
  | shelf/pile of shame | Pile of Shame |
  | loan / borrower | Ausleihe / Ausleiher |
  | location | Ort |
  | badge | Abzeichen |
  | RSVP | Zusage |
  | dashboard | Übersicht |
  | statistics | Statistiken |
  | settings | Einstellungen |
  | compare / head-to-head | Vergleich / Direktvergleich |
  | manual | Anleitung |
  | collection | Sammlung |
  | wishlist | Wunschliste |
  | duration / playtime | Dauer / Spielzeit |
  | add / edit / delete / save / cancel | Hinzufügen / Bearbeiten / Löschen / Speichern / Abbrechen |

---

## File Map

| File | Responsibility |
|---|---|
| `boardgametracker.client/public/locales/de-DE/*.json` (26, new) | German translations |
| `boardgametracker.client/public/locales/{base,en-US,es-ES,nl-BE,nl-NL}/language.json` | add `"german"` label |
| `boardgametracker.client/src/utils/locales.test.ts` (new) | de-DE ↔ base key parity |
| `boardgametracker.client/src/utils/i18n.ts` | default language, supported languages, load path |
| `boardgametracker.client/index.html` | default `<html lang>` |
| `boardgametracker.client/src/hooks/useUiLanguageSync.ts` (+ `.test.ts`, new) | apply `uiLanguage` to i18next and `<html lang>` |
| `boardgametracker.client/src/routes/__root.tsx` (+ `__root.test.tsx`) | fetch settings, mount sync hook |
| `BoardGameTracker.Core/Datastore/MainDbContext.cs` | seed `de-de` language |
| `BoardGameTracker.Core/Datastore/Migrations/Postgres/*_AddGermanLanguage*.cs` (generated) | migration |
| `BoardGameTracker.Common/Configuration/ConfigDefaults.cs` | `ui_language` default |
| `BoardGameTracker.Tests/Configuration/ConfigDefaultsTests.cs` | expected default |

---

### Task 1: Locale parity test + small namespaces + language labels

**Files:**
- Create: `boardgametracker.client/src/utils/locales.test.ts`
- Create: `boardgametracker.client/public/locales/de-DE/{auth,bgg-import,chat,common,compare,dashboard,error,expansions,images,language,location,log-levels,not-found,rsvp,sessions,shames,statistics,version}.json`
- Modify: `boardgametracker.client/public/locales/{base,en-US,es-ES,nl-BE,nl-NL}/language.json`

**Interfaces:**
- Produces: test file `src/utils/locales.test.ts` whose test names are `de-DE/<namespace>.json matches base keys`, filterable with `-t`.

- [x] **Step 1: Write the parity test**

`boardgametracker.client/src/utils/locales.test.ts`:

```ts
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const localesDir = join(process.cwd(), "public", "locales");
const namespaces = readdirSync(join(localesDir, "base")).filter((file) => file.endsWith(".json"));

const collectKeys = (value: unknown, prefix = ""): string[] => {
	if (value === null || typeof value !== "object" || Array.isArray(value)) {
		return [prefix];
	}
	return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
		collectKeys(child, prefix ? `${prefix}.${key}` : key),
	);
};

const readKeys = (lang: string, file: string): string[] =>
	collectKeys(JSON.parse(readFileSync(join(localesDir, lang, file), "utf-8"))).sort();

describe("de-DE locale", () => {
	it.each(namespaces)("de-DE/%s matches base keys", (file) => {
		expect(existsSync(join(localesDir, "de-DE", file))).toBe(true);
		expect(readKeys("de-DE", file)).toEqual(readKeys("base", file));
	});

	it.each(namespaces)("de-DE/%s keeps every {{placeholder}} from base", (file) => {
		const placeholders = (lang: string) =>
			(readFileSync(join(localesDir, lang, file), "utf-8").match(/{{[^}]+}}/g) ?? []).sort();
		expect(placeholders("de-DE")).toEqual(placeholders("base"));
	});
});
```

- [ ] **Step 2: Run it to verify it fails**

Run (in `boardgametracker.client/`): `npx vitest run src/utils/locales.test.ts`
Expected: FAIL — 52 failing tests (`existsSync(...)` is `false` for every namespace).

- [x] **Step 3: Add the `german` label to every locale's `language.json`**

Replace the content of each of `public/locales/{base,en-US,es-ES,nl-BE,nl-NL}/language.json` with:

```json
{
  "english": "English",
  "dutch": "Nederlands",
  "german": "Deutsch"
}
```

- [x] **Step 4: Translate the 18 small namespaces**

For each of `auth, bgg-import, chat, common, compare, dashboard, error, expansions, images, language, location, log-levels, not-found, rsvp, sessions, shames, statistics, version`: read `public/locales/base/<ns>.json` and write `public/locales/de-DE/<ns>.json` with identical structure and German values, following every rule in Global Constraints. `de-DE/language.json` is exactly the JSON from Step 3.

- [x] **Step 5: Run the parity test for these namespaces**

Run: `npx vitest run src/utils/locales.test.ts -t "auth|bgg-import|chat|common|compare|dashboard|error|expansions|images|language|location|log-levels|not-found|rsvp|sessions|shames|statistics|version"`
Expected: PASS for all 36 matching tests. (Unfiltered, the remaining 8 namespaces still fail until Tasks 2–3; that is expected.)

Note: `-t` is a regex over test names. None of these alternatives is a substring of an untranslated namespace (`game`/`player` are deliberately absent).

- [x] **Step 6: Commit**

```bash
git add boardgametracker.client/src/utils/locales.test.ts boardgametracker.client/public/locales
git commit -m "feat(i18n): add German translations for core namespaces"
```

---

### Task 2: Translate game/player namespaces

**Files:**
- Create: `boardgametracker.client/public/locales/de-DE/{badges,game,games,game-nights,loans,player,player-session}.json`

**Interfaces:**
- Consumes: `src/utils/locales.test.ts` from Task 1.

- [ ] **Step 1: Run the parity test for these namespaces to see it fail**

Run (in `boardgametracker.client/`): `npx vitest run src/utils/locales.test.ts -t "badges|game|loans|player"`
Expected: FAIL for the 7 target files (`game`, `games`, `game-nights`, `player`, `player-session`, `badges`, `loans`).

- [x] **Step 2: Translate**

For each of `badges, game, games, game-nights, loans, player, player-session`: read `public/locales/base/<ns>.json`, write `public/locales/de-DE/<ns>.json` with identical structure and German values per Global Constraints. In `badges.json`, badge titles are short nouns ("Sammler", "Marathon") and descriptions full sentences.

- [x] **Step 3: Run the parity test**

Run: `npx vitest run src/utils/locales.test.ts -t "badges|game|loans|player"`
Expected: PASS (14 tests).

- [x] **Step 4: Commit**

```bash
git add boardgametracker.client/public/locales/de-DE
git commit -m "feat(i18n): add German translations for game and player namespaces"
```

---

### Task 3: Translate settings namespace

**Files:**
- Create: `boardgametracker.client/public/locales/de-DE/settings.json`

**Interfaces:**
- Consumes: `src/utils/locales.test.ts` from Task 1.

- [ ] **Step 1: Run the parity test to see it fail**

Run (in `boardgametracker.client/`): `npx vitest run src/utils/locales.test.ts -t "settings"`
Expected: FAIL (2 tests).

- [x] **Step 2: Translate**

Read `public/locales/base/settings.json` (338 lines), write `public/locales/de-DE/settings.json` per Global Constraints. Technical terms that German admins expect in English stay English: "API Key" → "API-Schlüssel", "Base URL" → "Basis-URL", "Embedding" stays "Embedding", "Top K" stays, "OIDC Provider" → "OIDC-Anbieter", "Client ID/Secret" stay.

- [x] **Step 3: Run the full parity test**

Run: `npx vitest run src/utils/locales.test.ts`
Expected: PASS (52 tests).

- [x] **Step 4: Commit**

```bash
git add boardgametracker.client/public/locales/de-DE/settings.json
git commit -m "feat(i18n): add German translations for settings"
```

---

### Task 4: i18n configuration (German default, dev load path)

**Files:**
- Modify: `boardgametracker.client/src/utils/i18n.ts`
- Modify: `boardgametracker.client/index.html:2`
- Modify: `boardgametracker.client/package.json` (remove `i18next-browser-languagedetector`)

**Interfaces:**
- Produces: `export const DEFAULT_LANGUAGE = "de-DE"` and `export const SUPPORTED_LANGUAGES` from `@/utils/i18n`.

- [x] **Step 1: Replace the header and `init` of `src/utils/i18n.ts`**

Keep the `namespaces` array and the `capitalize` formatter unchanged. Replace the imports, the `translationFilePath` block and the `init` call with:

```ts
import i18n from "i18next";
import Backend from "i18next-http-backend";
import { initReactI18next } from "react-i18next";

export const DEFAULT_LANGUAGE = "de-DE";
export const SUPPORTED_LANGUAGES = ["de-DE", "en-US", "nl-NL", "nl-BE"];
```

(namespaces array unchanged)

```ts
// In DEV, English is served from the Crowdin source folder; other languages from their own folder.
const loadPath = (languages: string[], ns: string[]) => {
	const language = languages[0];
	const folder = import.meta.env.DEV && language === "en-US" ? "base" : language;
	return `/locales/${folder}/${ns[0]}.json`;
};

void i18n
	.use(Backend)
	.use(initReactI18next)
	.init({
		debug: false,
		lng: DEFAULT_LANGUAGE,
		supportedLngs: SUPPORTED_LANGUAGES,
		fallbackLng: "en-US",
		load: "currentOnly",
		ns: [...namespaces],
		defaultNS: "common",
		interpolation: {
			escapeValue: false,
		},
		backend: {
			loadPath,
		},
		react: {
			useSuspense: true,
		},
	});
```

- [x] **Step 2: Remove the unused detector dependency**

Run (in `boardgametracker.client/`): `npm uninstall i18next-browser-languagedetector`
Expected: `package.json` and `package-lock.json` no longer list it.

- [x] **Step 3: Default `<html lang>`**

In `boardgametracker.client/index.html` line 2 change `<html lang="en" class="dark-theme">` to `<html lang="de" class="dark-theme">`.

- [x] **Step 4: Typecheck and lint**

Run: `npm run typecheck && npm run lint`
Expected: exit code 0, no errors.

- [x] **Step 5: Commit**

```bash
git add boardgametracker.client/src/utils/i18n.ts boardgametracker.client/index.html boardgametracker.client/package.json boardgametracker.client/package-lock.json
git commit -m "feat(i18n): default UI language to German"
```

---

### Task 5: `useUiLanguageSync` hook

**Files:**
- Create: `boardgametracker.client/src/hooks/useUiLanguageSync.ts`
- Test: `boardgametracker.client/src/hooks/useUiLanguageSync.test.ts`

**Interfaces:**
- Produces: `export const toI18nLanguage = (code: string): string` (`"de-de"` → `"de-DE"`) and `export const useUiLanguageSync = (uiLanguage: string | undefined | null): void`.

- [x] **Step 1: Write the failing test**

`boardgametracker.client/src/hooks/useUiLanguageSync.test.ts`:

```ts
import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const i18nMock = vi.hoisted(() => ({
	language: "de-DE",
	changeLanguage: vi.fn(),
}));

vi.mock("react-i18next", () => ({
	useTranslation: () => ({ t: (key: string) => key, i18n: i18nMock }),
}));

import { toI18nLanguage, useUiLanguageSync } from "./useUiLanguageSync";

describe("toI18nLanguage", () => {
	it("uppercases the region", () => {
		expect(toI18nLanguage("de-de")).toBe("de-DE");
		expect(toI18nLanguage("en-us")).toBe("en-US");
	});

	it("leaves already-canonical and region-less codes alone", () => {
		expect(toI18nLanguage("nl-BE")).toBe("nl-BE");
		expect(toI18nLanguage("de")).toBe("de");
	});
});

describe("useUiLanguageSync", () => {
	beforeEach(() => {
		i18nMock.language = "de-DE";
		i18nMock.changeLanguage.mockReset();
		document.documentElement.lang = "";
	});

	it("does nothing while settings are not loaded", () => {
		renderHook(() => useUiLanguageSync(undefined));

		expect(i18nMock.changeLanguage).not.toHaveBeenCalled();
		expect(document.documentElement.lang).toBe("");
	});

	it("switches i18next to the settings language", () => {
		renderHook(() => useUiLanguageSync("en-us"));

		expect(i18nMock.changeLanguage).toHaveBeenCalledWith("en-US");
		expect(document.documentElement.lang).toBe("en");
	});

	it("does not call changeLanguage when already active", () => {
		renderHook(() => useUiLanguageSync("de-de"));

		expect(i18nMock.changeLanguage).not.toHaveBeenCalled();
		expect(document.documentElement.lang).toBe("de");
	});

	it("follows later changes of the settings language", () => {
		const { rerender } = renderHook(({ lang }) => useUiLanguageSync(lang), {
			initialProps: { lang: "de-de" },
		});
		rerender({ lang: "nl-be" });

		expect(i18nMock.changeLanguage).toHaveBeenCalledWith("nl-BE");
	});
});
```

- [x] **Step 2: Run it to verify it fails**

Run (in `boardgametracker.client/`): `npx vitest run src/hooks/useUiLanguageSync.test.ts`
Expected: FAIL — cannot resolve `./useUiLanguageSync`.

- [x] **Step 3: Implement**

`boardgametracker.client/src/hooks/useUiLanguageSync.ts`:

```ts
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

// Settings store lowercase codes ("de-de"); locale folders use "de-DE".
export const toI18nLanguage = (code: string): string => {
	const [language, region] = code.split("-");
	return region ? `${language.toLowerCase()}-${region.toUpperCase()}` : language.toLowerCase();
};

export const useUiLanguageSync = (uiLanguage: string | undefined | null) => {
	const { i18n } = useTranslation();

	useEffect(() => {
		if (!uiLanguage) return;

		const language = toI18nLanguage(uiLanguage);
		if (i18n.language !== language) {
			void i18n.changeLanguage(language);
		}
		document.documentElement.lang = language.split("-")[0];
	}, [uiLanguage, i18n]);
};
```

- [x] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/hooks/useUiLanguageSync.test.ts`
Expected: PASS (6 tests).

- [x] **Step 5: Commit**

```bash
git add boardgametracker.client/src/hooks/useUiLanguageSync.ts boardgametracker.client/src/hooks/useUiLanguageSync.test.ts
git commit -m "feat(i18n): add hook that applies the settings UI language"
```

---

### Task 6: Mount the sync in the root route

**Files:**
- Modify: `boardgametracker.client/src/routes/__root.tsx`
- Test: `boardgametracker.client/src/routes/__root.test.tsx`

**Interfaces:**
- Consumes: `useUiLanguageSync(uiLanguage)` from `@/hooks/useUiLanguageSync` (Task 5); `getSettings()` from `@/services/queries/settings` (existing, `queryKey: [QUERY_KEYS.settings]`, returns `Settings` with `uiLanguage: string`). Saving settings already invalidates this query (`routes/settings/-hooks/useSettingsData.ts:25`), so a changed language propagates automatically.

- [x] **Step 1: Extend the root test mocks**

In `src/routes/__root.test.tsx`:

1. Add to the `vi.hoisted` object: `getSettingsCall: vi.fn(),` and `useUiLanguageSync: vi.fn(),`.
2. In the `@/services/settingsService` mock replace `getSettingsCall: vi.fn(),` with `getSettingsCall: () => mocks.getSettingsCall(),`.
3. Add a mock next to the other `vi.mock` calls (before `import "./__root";`):

```ts
vi.mock("@/hooks/useUiLanguageSync", () => ({
	useUiLanguageSync: (language: string | undefined) => mocks.useUiLanguageSync(language),
}));
```

4. In the top-level `beforeEach`, add: `mocks.getSettingsCall.mockResolvedValue({ uiLanguage: "de-de" });`

- [x] **Step 2: Add the failing tests**

Append inside `describe("RootComponent", ...)`:

```ts
	describe("UI language", () => {
		it("applies the settings language once settings are loaded", async () => {
			render(<mocks.captured.Root />);

			await waitFor(() => {
				expect(mocks.useUiLanguageSync).toHaveBeenLastCalledWith("de-de");
			});
		});

		it("does not fetch settings while unauthenticated with auth enabled", async () => {
			mocks.authState.authStatus = { authEnabled: true };
			mocks.authState.isAuthenticated = false;
			render(<mocks.captured.Root />);

			await waitFor(() => {
				expect(mocks.navigate).toHaveBeenCalled();
			});
			expect(mocks.getSettingsCall).not.toHaveBeenCalled();
			expect(mocks.useUiLanguageSync).not.toHaveBeenCalledWith("de-de");
		});
	});
```

- [x] **Step 3: Run to verify failure**

Run (in `boardgametracker.client/`): `npx vitest run src/routes/__root.test.tsx`
Expected: FAIL — "applies the settings language" (`useUiLanguageSync` never called).

- [x] **Step 4: Implement in `__root.tsx`**

Add imports:

```ts
import { useQuery } from "@tanstack/react-query";
import { useUiLanguageSync } from "@/hooks/useUiLanguageSync";
```

and change `import { getEnvironment } from "@/services/queries/settings";` to `import { getEnvironment, getSettings } from "@/services/queries/settings";`.

In `RootComponent`, directly after the third `useEffect` (the one fetching `getEnvironment`) and before `if (!authChecked) {`, add:

```tsx
	const canLoadSettings = authChecked && (isAuthenticated || !authStatus?.authEnabled);
	const { data: settings } = useQuery({ ...getSettings(), enabled: canLoadSettings });
	useUiLanguageSync(settings?.uiLanguage);
```

- [x] **Step 5: Run tests**

Run: `npx vitest run src/routes/__root.test.tsx`
Expected: PASS (all existing tests plus the 2 new ones).

- [x] **Step 6: Commit**

```bash
git add boardgametracker.client/src/routes/__root.tsx boardgametracker.client/src/routes/__root.test.tsx
git commit -m "feat(i18n): apply settings UI language in root route"
```

---

### Task 7: Backend — seed German, default to German

**Files:**
- Modify: `BoardGameTracker.Common/Configuration/ConfigDefaults.cs:14`
- Modify: `BoardGameTracker.Tests/Configuration/ConfigDefaultsTests.cs:17`
- Modify: `BoardGameTracker.Core/Datastore/MainDbContext.cs:350-353`
- Create (generated): `BoardGameTracker.Core/Datastore/Migrations/Postgres/<timestamp>_AddGermanLanguage.cs`, `.Designer.cs`; Modify (generated): `MainDbContextModelSnapshot.cs`

**Interfaces:**
- Produces: language row `{ Id = 3, Key = "de-de", TranslationKey = "german" }` returned by `GET` languages endpoint; frontend label key `language:german` (Task 1).

All `dotnet` commands run from the repo root in Git Bash through Docker:

```bash
DOTNET='MSYS_NO_PATHCONV=1 docker run --rm -v C:/Repositories/BoardGameTrackerFork:/src -v bgt-nuget:/root/.nuget/packages -w /src mcr.microsoft.com/dotnet/sdk:10.0'
```

(use as `eval "$DOTNET dotnet test ..."`). The `bgt-nuget` volume caches packages between runs.

- [x] **Step 1: Update the expected default in the test**

`BoardGameTracker.Tests/Configuration/ConfigDefaultsTests.cs` line 17:

```csharp
        yield return new object[] { AppConfig.UiLanguage, "de-de" };
```

- [ ] **Step 2: Run to verify it fails**

Run: `eval "$DOTNET dotnet test BoardGameTracker.Tests --filter FullyQualifiedName~ConfigDefaultsTests"`
Expected: FAIL — `Expected entry!.Value to be "de-de" ... but "en-us"`.

- [x] **Step 3: Change the default**

`BoardGameTracker.Common/Configuration/ConfigDefaults.cs` line 14:

```csharp
        new(AppConfig.UiLanguage, "de-de"),
```

- [x] **Step 4: Run to verify it passes**

Run: `eval "$DOTNET dotnet test BoardGameTracker.Tests --filter FullyQualifiedName~ConfigDefaultsTests"`
Expected: PASS.

- [x] **Step 5: Seed the language**

`BoardGameTracker.Core/Datastore/MainDbContext.cs`, `SeedLanguages`:

```csharp
            .HasData(
                new Language {Id = 1, Key = "en-us", TranslationKey = "english"},
                new Language {Id = 2, Key = "nl-be", TranslationKey = "dutch"},
                new Language {Id = 3, Key = "de-de", TranslationKey = "german"}
            );
```

- [x] **Step 6: Generate the migration**

Run:

```bash
eval "$DOTNET bash -c 'dotnet tool install --global dotnet-ef --version 10.* >/dev/null && /root/.dotnet/tools/dotnet-ef migrations add AddGermanLanguage --project BoardGameTracker.Core --startup-project BoardGameTracker.Host --output-dir Datastore/Migrations/Postgres'"
```

Expected: `Done.` and new files `*_AddGermanLanguage.cs` / `*_AddGermanLanguage.Designer.cs`; `MainDbContextModelSnapshot.cs` modified.

- [x] **Step 7: Inspect the migration**

`*_AddGermanLanguage.cs` `Up` must contain only:

```csharp
            migrationBuilder.InsertData(
                table: "Languages",
                columns: new[] { "Id", "Key", "TranslationKey" },
                values: new object[] { 3, "de-de", "german" });
```

and `Down` the matching `DeleteData(table: "Languages", keyColumn: "Id", keyValue: 3)`. If anything else appears (unrelated model drift), stop and report it rather than committing it.

- [x] **Step 8: Build and run all backend tests**

Run: `eval "$DOTNET dotnet test BoardGameTracker.Tests"`
Expected: build succeeds, all tests pass.

- [x] **Step 9: Commit**

```bash
git add BoardGameTracker.Common BoardGameTracker.Core BoardGameTracker.Tests
git commit -m "feat: seed German language and make it the default UI language"
```

---

### Task 8: Full verification

**Files:** none modified unless a check fails.

- [ ] **Step 1: Frontend checks** (in `boardgametracker.client/`)

Run: `npm run typecheck && npm run lint && npx vitest run`
Expected: all exit 0; full Vitest suite passes.

- [x] **Step 2: Production build**

Run: `npm run build`
Expected: build succeeds; `dist/locales/de-DE/` contains 26 files (`ls dist/locales/de-DE | wc -l` → `26`).

- [x] **Step 3: Hard-coded English scan (report only)**

Run: `grep -rnE '>[A-Z][a-z]+( [a-z]+)*<' src --include=*.tsx | grep -v test | head -50`
Record any user-visible literal English strings in the final report as follow-ups; do not fix them in this branch.

- [ ] **Step 4: Manual smoke test**

Run `npm run dev` (frontend only, backend not required for the first check) and open `http://localhost:5443`: navigation labels render in German. With the backend running (`docker compose -f docker-compose.build.yml up --build`), open Settings → Sprache, pick "English", save: UI switches to English; switch back to "Deutsch": UI returns to German.

- [ ] **Step 5: Push the branch**

```bash
git push -u origin feat/german-language
```
