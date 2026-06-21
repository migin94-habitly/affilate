import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import ru from './locales/ru'
import en from './locales/en'
import kz from './locales/kz'
import uz from './locales/uz'
import kg from './locales/kg'
import tj from './locales/tj'
import tr from './locales/tr'

i18n.use(initReactI18next).init({
  resources: {
    ru: { translation: ru },
    en: { translation: en },
    kz: { translation: kz },
    uz: { translation: uz },
    kg: { translation: kg },
    tj: { translation: tj },
    tr: { translation: tr }
  },
  lng: localStorage.getItem('tap-language') || 'ru',
  fallbackLng: 'ru',
  interpolation: { escapeValue: false }
})

export default i18n
