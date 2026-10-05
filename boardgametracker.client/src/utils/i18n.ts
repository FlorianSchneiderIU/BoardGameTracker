import i18n from "i18next";
import Backend from "i18next-http-backend";
import { initReactI18next } from "react-i18next";

export const DEFAULT_LANGUAGE = "de-DE";
export const SUPPORTED_LANGUAGES = ["de-DE", "en-US", "nl-NL", "nl-BE"];

const namespaces = [
	"version",
	"game-nights",
	"common",
	"shames",
	"loans",
	"dashboard",
	"expansions",
	"bgg-import",
	"chat",
	"compare",
	"game",
	"games",
	"images",
	"player",
	"error",
	"not-found",
	"location",
	"statistics",
	"sessions",
	"settings",
	"player-session",
	"language",
	"log-levels",
	"badges",
	"rsvp",
	"auth",
] as const;

// English uses the Crowdin source in development; other languages use their own folders.
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

i18n.services.formatter?.add(
	"capitalize",
	(value: string) => `${value.substring(0, 1).toUpperCase()}${value.substring(1)}`,
);

export default i18n;
