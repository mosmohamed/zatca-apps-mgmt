import i18n from "i18next"
import { initReactI18next } from "react-i18next"

import ar from "@/locales/ar.json"
import en from "@/locales/en.json"
import {
  applyDocumentLocale,
  getStoredLocale,
  type AppLocale,
} from "@/lib/locale"

export const defaultNS = "translation"

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ar: { translation: ar },
  },
  lng: getStoredLocale(),
  fallbackLng: "en",
  defaultNS,
  interpolation: {
    escapeValue: false,
  },
})

applyDocumentLocale(i18n.language as AppLocale)

i18n.on("languageChanged", (language) => {
  applyDocumentLocale(language as AppLocale)
})

export default i18n
