import './index.scss';
import $ from 'jquery';

function Home(router, api) {
  this.router = router;
  this.templateIndex = require('./index.html');
  this.api = api;
}

Home.prototype = {
  index: function () {
    const self = this;
    $('body').attr('class', 'home layout');
    $('#layout-container').html(self.templateIndex({
      logoLargeURL: require('./logo-large.png'),
      logoSmallURL: require('./logo-small.png')
    }));
    self.api.account.me(function(resp) {
      console.log(resp);
    });
    self.router.updatePageLinks();
  }
};

export default Home;
