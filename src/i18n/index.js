import { createI18n } from 'vue-i18n'
import en from './en'

let lang = navigator.language
let locale = !!lang && lang.indexOf('zh') >= 0 ? 'zh' : 'en'

const i18n = createI18n({
  locale: locale,
  messages: { en },
  fallbackLocale: 'en'
})

export default i18n
