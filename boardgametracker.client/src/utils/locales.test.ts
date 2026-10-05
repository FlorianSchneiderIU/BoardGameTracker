import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const localesDir = join(process.cwd(), "public", "locales");
const namespaces = readdirSync(join(localesDir, "base")).filter((file) => file.endsWith(".json"));

const collectEntries = (value: unknown, prefix = ""): [string, string][] => {
	if (typeof value === "string") return [[prefix, value]];
	if (value === null || typeof value !== "object" || Array.isArray(value)) {
		throw new Error(`Invalid translation at ${prefix}`);
	}
	return Object.entries(value).flatMap(([key, child]) => collectEntries(child, prefix ? `${prefix}.${key}` : key));
};

const readEntries = (lang: string, file: string) =>
	collectEntries(JSON.parse(readFileSync(join(localesDir, lang, file), "utf-8")));

describe("de-DE locale", () => {
	it.each(namespaces)("de-DE/%s matches base keys", (file) => {
		expect(existsSync(join(localesDir, "de-DE", file))).toBe(true);
		expect(
			readEntries("de-DE", file)
				.map(([key]) => key)
				.sort(),
		).toEqual(
			readEntries("base", file)
				.map(([key]) => key)
				.sort(),
		);
	});

	it.each(namespaces)("de-DE/%s preserves interpolation, nesting and markup per key", (file) => {
		const translations = new Map(readEntries("de-DE", file));
		for (const [key, source] of readEntries("base", file)) {
			const tokens = (text: string) => (text.match(/{{[^}]+}}|\$t\([^)]*\)|<[^>]+>/g) ?? []).sort();
			expect(tokens(translations.get(key) ?? ""), key).toEqual(tokens(source));
		}
	});
});
