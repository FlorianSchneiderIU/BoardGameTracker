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
