import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

vi.unmock("i18next");

// Load the actual locale files without relying on an HTTP server.
vi.mock("i18next-http-backend", () => ({
	default: class {
		static type = "backend";
		read(language: string, namespace: string, callback: (error: Error | null, data?: unknown) => void) {
			try {
				callback(
					null,
					JSON.parse(readFileSync(join(process.cwd(), "public", "locales", language, `${namespace}.json`), "utf8")),
				);
			} catch (error) {
				callback(error as Error);
			}
		}
	},
}));

import i18n, { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from "./i18n";

describe("UI translations", () => {
	it("starts in German and switches labels and plurals in both directions", async () => {
		await vi.waitFor(() => expect(i18n.isInitialized).toBe(true));
		expect(DEFAULT_LANGUAGE).toBe("de-DE");
		expect(SUPPORTED_LANGUAGES).toContain("de-DE");
		expect(i18n.language).toBe("de-DE");
		expect(i18n.t("save")).toBe("Speichern");
		expect(i18n.t("sessions", { count: 1 })).toBe("1 Partie");
		expect(i18n.t("sessions", { count: 2 })).toBe("2 Partien");
		await i18n.changeLanguage("en-US");
		expect(i18n.t("save")).toBe("Save");
		await i18n.changeLanguage("de-DE");
		expect(i18n.t("save")).toBe("Speichern");
	});

	it("loads German files in development and the English source as fallback", () => {
		const backend = i18n.options.backend as { loadPath: (languages: string[], namespaces: string[]) => string };
		expect(backend.loadPath(["de-DE"], ["settings"])).toBe("/locales/de-DE/settings.json");
		expect(backend.loadPath(["en-US"], ["common"])).toBe("/locales/base/common.json");
		expect(backend.loadPath(["nl-BE"], ["game"])).toBe("/locales/nl-BE/game.json");
	});
});
