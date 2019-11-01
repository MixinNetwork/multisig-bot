import './index.scss';
import $ from 'jquery';
import Decimal from 'decimal.js';
import Mixin from '../utils/mixin';

function Home(router, api) {
  this.router = router;
  this.partialLoading = require('../loading.html');
  this.templateGuide = require('./guide.html');
  this.templateIndex = require('./index.html');
  this.templateSend = require('./send.html');
  this.api = api;
}

Home.prototype = {
  index: function () {
    const self = this;
    self.loadConversation(function(resp) {
      if (resp.error && resp.error.code === 404 || resp.data && resp.data.category !== 'GROUP' || resp.data && self.parseThreshold(resp.data.name) < 1) {
        $('body').attr('class', 'home layout');
        $('#layout-container').html(self.templateGuide());
        return true;
      } else if (resp.data && resp.data.category === 'GROUP') {
        self.loadUsers(resp.data.participants, function (users) {
          self.loadUTXOs(undefined, resp.data, {}, function (utxos) {
            if (Object.keys(utxos).length == 0) {
              return;
            }
            self.loadAssets(0, Object.keys(utxos), {}, function (assets) {
              self.renderWalletForAll(users, assets, utxos);
            });
          });
        });
        return true;
      }
      self.router.updatePageLinks();
    }, new Mixin().conversationId());
  },

  renderWalletForAll: function (users, assets, utxos) {
    const self = this;
    var assetsView = [];
    for (var id in utxos) {
      var item = self.buildAssetItem(assets[id], utxos[id]);
      assetsView.push(item);
    }
    $('body').attr('class', 'home layout');
    $('#layout-container').html(self.templateIndex({assets: assetsView}));
    $('.assets.list .wallet.item').on('click', function (e) {
      e.preventDefault();
      var id = $(this).attr('data-id');
      $('body').attr('class', 'loading layout');
      $('#layout-container').html(self.partialLoading());
      self.loadContacts(function (contacts) {
        self.renderWalletForAsset(assets[id], utxos[id], contacts);
      });
    });
  },

  renderWalletForAsset: function (asset, utxos, contacts) {
    const self = this;
    $('body').attr('class', 'home layout');
    if (Decimal.sign(asset.signed) > 0) {
    } else {
      $('#layout-container').html(self.templateSend({contacts: contacts, asset: asset}));
    }
  },

  buildAssetItem: function (asset, utxos) {
    var total = new Decimal(0), signed = new Decimal(0), pending = new Decimal(0);
    for (var id in utxos) {
      total = total.add(new Decimal(utxos[id].amount));
      if (utxos[id].state === 'signed') {
        signed = signed.add(new Decimal(utxos[id].signed));
      }
    }
    asset.total = total.toString();
    asset.signed = signed.toString();
    asset.pending = pending.toString();
    return asset;
  },

  loadUTXOs: function (offset, conv, filter, callback) {
    const self = this;
    var key = self.makeUnique(conv.participants);
    var threshold = self.parseThreshold(conv.name);
    self.api.multisig.list(function (resp) {
      if (resp.error) {
        return false;
      }
      for (var i in resp.data) {
        var utxo = resp.data[i];
        if (utxo.members.sort().join("") !== key) {
          continue;
        }
        if (utxo.threshold !== threshold) {
          continue;
        }
        if (!filter[utxo.asset_id]) {
          filter[utxo.asset_id] = {};
        }
        filter[utxo.asset_id][utxo.utxo_id] = utxo;
      }
      if (resp.data.length < 100) {
        return callback(filter);
      }
      self.loadUTXOs(resp.data[resp.data.length-1].created_at, conv.participants, filter, callback);
    }, offset, 100);
  },

  loadContacts: function (callback) {
    const self = this;
    self.api.request('GET', '/friends', undefined, function (resp) {
      if (resp.error) {
        return false;
      }
      callback(resp.data);
    });
  },

  loadAssets: function (offset, ids, output, callback) {
    const self = this;
    const key = ids.sort().join('');
    var assets = localStorage.getItem(key);
    if (assets) {
      return callback(JSON.parse(assets));
    }
    if (offset === ids.length) {
      localStorage.setItem(key, JSON.stringify(output));
      return callback(output);
    }
    self.api.request('GET', '/assets/' + ids[offset], undefined, function (resp) {
      if (resp.error) {
        return false;
      }
      output[resp.data.asset_id] = resp.data;
      self.loadAssets(offset+1, ids, output, callback);
    });
  },

  loadUsers: function (ps, callback) {
    var ids = [];
    for (var i in ps) {
      ids.push(ps[i].user_id);
    }
    var key = ids.sort().join('');
    var users = localStorage.getItem(key);
    if (users) {
      return callback(JSON.parse(users));
    }
    this.api.request('POST', '/users/fetch', ids, function(resp) {
      if (resp.data) {
        localStorage.setItem(key, JSON.stringify(resp.data));
        return callback(resp.data);
      }
    });
  },

  loadConversation: function (callback, id) {
    const self = this;
    self.api.account.conversation(function(resp) {
      return callback(resp);
    }, id);
  },

  parseThreshold: function (name) {
    var parts = name.split('^');
    if (parts.length != 2) {
      return -1;
    }
    var t = parseInt(parts[1]);
    return t ? t : -1;
  },

  makeUnique: function (ps) {
    var ids = [];
    for (var i in ps) {
      var id = ps[i].user_id;
      if (id === CLIENT_ID) {
        continue;
      }
      ids.push(ps[i].user_id)
    }
    return ids.sort().join('');
  },
};

export default Home;
