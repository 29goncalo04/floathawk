import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en/translation.json";
import pt from "./locales/pt/translation.json";
import es from "./locales/es/translation.json";
import fr from "./locales/fr/translation.json";

i18n
  .use(initReactI18next)
  .init({
    lng: localStorage.getItem("lang") || "en",
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
    resources: {
      en: { translation: en },
      pt: { translation: pt },
      es: { translation: es },
      fr: { translation: fr },
    },
  });

export default i18n;
