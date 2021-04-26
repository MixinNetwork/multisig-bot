import Polyglot from 'node-polyglot';
import en from './en.js';

class Locale {
  constructor(lang) {
    let locale = !!lang && lang.indexOf('zh') >= 0 ? 'zh' : 'en';
    this.polyglot = new Polyglot({locale: locale});
    this.polyglot.extend(en);
  }

  t(key, options) {
    return this.polyglot.t(key, options);
  }
}

export default Locale;
