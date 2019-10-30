import './index.scss';
import $ from 'jquery';
import Mixin from '../utils/mixin';

function Home(router, api) {
  this.router = router;
  this.templateIndex = require('./index.html');
  this.templateGuide = require('./guide.html');
  this.api = api;
}

Home.prototype = {
  index: function () {
    const self = this;
    self.api.account.conversation(function(resp) {
      console.log(resp);
      $('body').attr('class', 'home layout');
      if (resp.error && resp.error.code === 404 || resp.data && resp.data.category !== 'GROUP') {
        $('#layout-container').html(self.templateGuide());
        return true;
      } else if (resp.data && resp.data.category === 'GROUP') {
        $('#layout-container').html(self.templateIndex());
        return true;
      }
      self.router.updatePageLinks();
    }, new Mixin().conversationId());
  }
};

export default Home;
