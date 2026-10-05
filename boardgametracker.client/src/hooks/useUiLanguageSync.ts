import { useEffect } from "react";
import { useTranslation } from "react-i18next";

// Settings store lowercase codes; locale folders use canonical region casing.
export const toI18nLanguage = (code: string): string => {
	const [language, region] = code.split("-");
	return region ? `${language.toLowerCase()}-${region.toUpperCase()}` : language.toLowerCase();
};

export const useUiLanguageSync = (uiLanguage: string | undefined | null): void => {
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
