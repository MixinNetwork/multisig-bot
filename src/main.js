import '@/statics/scss/index.scss'
import { createApp } from 'vue'
import InlineSvg from 'vue-inline-svg'

import router from './router'
import App from './App.vue'
import i18n from './i18n'

const app = createApp(App)
app.use(router)
app.use(i18n)

app.component('inline-svg', InlineSvg)
app.mount('#app')
