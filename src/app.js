import 'simple-line-icons/scss/simple-line-icons.scss';
import './layout.scss';
import $ from 'jquery';
import Navigo from 'navigo';
import Locale from './locale';
import API from './api';
import Home from './home';
import Auth from './auth';

const PartialLoading = require('./loading.html');
const Error404 = require('./404.html');
const router = new Navigo(WEB_ROOT);
const api = new API(router, API_ROOT);

window.i18n = new Locale(navigator.language);

router.replace = function(url) {
  this.resolve(url);
  this.pause(true);
  this.navigate(url);
  this.pause(false);
};

router.hooks({
  before: function(done, params) {
    $('body').attr('class', 'loading layout');
    $('#layout-container').html(PartialLoading());
    setTimeout(function() {
      $('title').html(APP_NAME);
      done(true);
    }, 100);
  },
  after: function(params) {
    router.updatePageLinks();
  }
});

router.on({
  '/auth': function () {
    new Auth(router, api).render();
  },
  '/': function () {
    new Home(router).index();
  }
}).notFound(function () {
  $('#layout-container').html(Error404());
  $('body').attr('class', 'error layout');
  router.updatePageLinks();
}).resolve();
