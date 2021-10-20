import './index.scss';
import $ from 'jquery';
import { v4 as uuidv4 } from 'uuid';
import Decimal from 'decimal.js';
import Mixin from '../utils/mixin.js';
import FormUtils from '../utils/form.js';
require('../utils/transaction.js');

function Home(router, api) {
  this.router = router;
  this.partialLoading = require('../loading.html');
  this.templateGuide = require('./guide.html');
  this.templateIndex = require('./index.html');
  this.templateSend = require('./send.html');
  this.templateSign = require('./sign.html');
  this.templateState = require('./state.html');
  this.templateEmpty = require('./empty.html');
  this.templateReceive = require('./receive.html');
  this.api = api;
}

Home.prototype = {
  index: function () {
    const self = this;
    self.loadConversation(function(resp) {
      if (resp.error && resp.error.code === 404
        || resp.data && resp.data.category !== 'GROUP'
        || resp.data && self.parseThreshold(resp.data.name) < 1
        || resp.data && resp.data.participants.length < 3) {
        $('body').attr('class', 'home layout');
        $('#layout-container').html(self.templateGuide());
        return true;
      } else if (resp.data && resp.data.category === 'GROUP') {
        self.loadUsers(resp.data.participants, function (users) {
          self.loadUTXOs(undefined, resp.data, {}, function (utxos) {
            if (Object.keys(utxos).length == 0) {
              $('body').attr('class', 'home layout');
              $('#layout-container').html(self.templateEmpty());
              $('.bottom.button input:submit').click(function () {self.renderReceive(resp.data);});
            } else {
              self.loadAssets(0, Object.keys(utxos), {}, function (assets) {
                self.renderWalletForAll(resp.data, users, assets, utxos);
              });
            }
          });
        });
        return true;
      }
      self.router.updatePageLinks();
    }, new Mixin().conversationId());
  },

  renderReceive: function (conv) {
    const self = this;
    $('#layout-container').html(self.templateReceive({
      assets: [{
        asset_id: 'c6d0c728-2624-429b-8e0d-d9d19b6592fa',
        symbol: 'BTC'
      },{
        asset_id: '43d61dcd-e413-450d-80b8-101d5e903357',
        symbol: 'ETH'
      },{
        asset_id: 'eea900a8-b327-488c-8d8d-1428702fe240',
        symbol: 'MOB'
      },{
        asset_id: 'c94ac88f-4671-3976-b60a-09064f1811e8',
        symbol: 'XIN'
      },{
        asset_id: '4d8c508b-91c5-375b-92b0-ee702ed2dac5',
        symbol: 'USDT-ERC20'
      },{
        asset_id: '815b0b1a-2764-3736-8faa-42d694fa620a',
        symbol: 'USDT-Omni'
      },{
        asset_id: 'f5ef6b5d-cc5a-3d90-b2c0-a2fd386e7a3c',
        symbol: 'BOX'
      },{
        asset_id: '3edb734c-6d6f-32ff-ab03-4eb43640c758',
        symbol: 'PRS'
      },{
        asset_id: '2566bf58-c4de-3479-8c55-c137bb7fe2ae',
        symbol: 'ONE'
      },{
        asset_id: '9b180ab6-6abe-3dc0-a13f-04169eb34bfa',
        symbol: 'USDC'
      },{
        asset_id: 'f6f1c01c-8489-3346-b127-dc0dc09b9ce7',
        symbol: 'LINK'
      },{
        asset_id: 'a31e847e-ca87-3162-b4d1-322bc552e831',
        symbol: 'UNI'
      },{
        asset_id: '6eece248-09db-3417-8f70-767896cf5217',
        symbol: 'WGT'
      },{
        asset_id: '965e5c6e-434c-3fa9-b780-c50f43cd955c',
        symbol: 'CNB'
      }, {
        asset_id: '6cfe566e-4aad-470b-8c9a-2fd35b49c68d',
        symbol: 'EOS'
      }, {
        asset_id: '336d5d97-329c-330d-8e62-2b7c9ba40ea0',
        symbol: 'IQ'
      }, {
        asset_id: 'f1d987df-1835-3f03-aefd-5e3e4132d11e',
        symbol: 'HT'
      }, {
        asset_id: '4e7068df-a483-38af-8b16-cd83ce711184',
        symbol: 'KEY'
      }, {
        asset_id: '44adc71b-0c37-3b42-aa19-fe2d59dae5fd',
        symbol: 'EPC'
      }, {
        asset_id: '88b29aef-6059-3351-abbd-0ecfcc574280',
        symbol: 'GRT'
      }, {
        asset_id: 'ceeaa170-b2fe-3bc1-91a5-5ffa468a1f33',
        symbol: 'LEO'
      }, {
        asset_id: '31d2ea9c-95eb-3355-b65b-ba096853bc18',
        symbol: 'pUSD'
      }],
      trace_id: uuidv4()
    }));
    $('form').submit(function (event) {
      event.preventDefault();
      var params = new FormUtils().serialize($(this));
      params.opponent_multisig = { receivers: [], threshold: self.parseThreshold(conv.name) };
      for (var i in conv.participants) {
        var id = conv.participants[i].user_id;
        if (id === CLIENT_ID) {
          continue;
        }
        params.opponent_multisig.receivers.push(id);
      }
      console.log(params);
      self.api.request('POST', '/payments', params, function (resp) {
        if (resp.error) {
          return;
        }
        console.log(resp.data);
        var text = `https://mixin.one/codes/${resp.data.code_id}`;
        window.location = `mixin://send?text=${encodeURIComponent(text)}`;
      });
    });
    $('input[type=submit]').click(function (event) {
      event.preventDefault();
      $('.submitting.overlay').show();
      $(this).parents('form').submit();
    });
  },

  renderWalletForAll: function (conv, users, assets, utxos) {
    const self = this;
    var assetsView = [];
    for (var id in utxos) {
      var item = self.buildAssetItem(assets[id], utxos[id]);
      assetsView.push(item);
    }
    $('body').attr('class', 'home layout');
    $('#layout-container').html(self.templateIndex({assets: assetsView}));
    $('.bottom.button input:submit').click(function () {self.renderReceive(conv);});
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
    if (Decimal.sign(asset.signed) > 0) {
      var utxo = undefined;
      for (var i in utxos) {
        if (utxos[i].signed_tx.length > 0) {
          utxo = utxos[i];
          break;
        }
      }
      self.createMultisigRequest(utxo.signed_tx, 'sign', function (multi) {
        var participants = [];
        for (var i in multi.senders) {
          participants.push({user_id: multi.senders[i]});
        }
        for (var i in multi.receivers) {
          participants.push({user_id: multi.receivers[i]});
        }
        self.loadUsers(participants, function (users) {
          var senders = [], receivers = [], signers = [];
          for (var i in users) {
            var u = users[i];
            u.firstLetter = u.avatar_url === '' ? (u.full_name.trim()[0] || '^_^') : undefined;
          }
          for (var i in multi.senders) {
            senders.push(users[multi.senders[i]]);
          }
          for (var i in multi.receivers) {
            receivers.push(users[multi.receivers[i]]);
          }
          for (var i in multi.signers) {
            signers.push(users[multi.signers[i]]);
          }
          multi.senders = senders;
          multi.receivers = receivers;
          multi.signers = signers;
          multi.asset = asset;
          multi.finished = signers.length >= utxo.threshold;
          console.log(multi);
          $('body').attr('class', 'home layout');
          $('#layout-container').html(self.templateSign(multi));
          $('textarea').each(function() {
            $(this).height($(this).prop('scrollHeight'));
          });
          $('form').submit(function (event) {
            event.preventDefault();
            if (multi.signers.length < utxo.threshold) {
              setTimeout(function() { self.waitForAction(multi.code_id); }, 1500);
              window.location.replace('mixin://codes/' + multi.code_id);
              return;
            }
            var params = {method: "sendrawtransaction", params: [multi.raw_transaction]};
            self.api.request('POST', '/external/proxy', params, function (resp) {
              if (resp.data && resp.data.hash === multi.transaction_hash) {
                $('#layout-container').html(self.templateState({status: 'check'}));
              } else {
                $('#layout-container').html(self.templateState({status: 'close'}));
              }
              return true;
            });
          });
          $('input[type=submit]').click(function (event) {
            event.preventDefault();
            $('.submitting.overlay').show();
            $(this).parents('form').submit();
          });
        });
      });
    } else {
      contacts.push(self.api.account.me());
      $('body').attr('class', 'home layout');
      $('#layout-container').html(self.templateSend({contacts: contacts, asset: asset}));
      $('form').submit(function (event) {
        event.preventDefault();
        var members = [];
        $('input:radio:checked').each(function () {
          members.push($(this).val());
        });
        var tx = {
          version: 2,
          asset: asset.mixin_id,
          inputs: [],
          outputs: [],
          extra: self.toHex($('input[name="memo"]').val()),
        };
        var inputAmount = new Decimal(0), amount = new Decimal($('input[name="amount"]').val());
        for (var i in utxos) {
          var utxo = utxos[i];
          inputAmount = inputAmount.add(new Decimal(utxo.amount));
          tx.inputs.push({
            hash: utxo.transaction_hash,
            index: utxo.output_index
          });
          if (inputAmount.cmp(amount) >= 0) {
            break;
          }
        }
        if (inputAmount.cmp(amount) < 0) {
          alert('TOO MUCH');
          return;
        }
        self.loadGhostKeys(members, 0, function (output) {
          output.amount = amount.toString();
          output.script = self.buildThresholdScript(parseInt($('input[name="threshold"]').val()));
          tx.outputs.push(output)
          if (inputAmount.cmp(amount) > 0) {
            var utxo = utxos[Object.keys(utxos)[0]];
            self.loadGhostKeys(utxo.members, 1, function(output) {
              output.amount = inputAmount.sub(amount).toString();
              output.script = self.buildThresholdScript(utxo.threshold);
              tx.outputs.push(output)
              console.log(JSON.stringify(tx));
              var raw = mixinGo.buildTransaction(JSON.stringify(tx));
              console.log(raw);
              self.handleMultisigRequest(raw, 'sign');
            });
          } else {
            console.log(JSON.stringify(tx));
            var raw = mixinGo.buildTransaction(JSON.stringify(tx));
            console.log(raw);
            self.handleMultisigRequest(raw, 'sign');
          }
        });
      });
      $('input[type=submit]').click(function (event) {
        event.preventDefault();
        $('.submitting.overlay').show();
        $(this).parents('form').submit();
      });
    }
  },

  handleMultisigRequest: function(raw, action) {
    const self = this;
    self.createMultisigRequest(raw, action, function (multi) {
      console.log(multi);
      setTimeout(function() { self.waitForAction(multi.code_id); }, 1500);
      window.location.replace('mixin://codes/' + multi.code_id);
    });
  },

  waitForAction: function (codeId) {
    const self = this;
    self.api.request('GET', '/codes/' + codeId, undefined, function(resp) {
      if (resp.error && resp.error.code === 404) {
        $('#layout-container').html(self.templateState({status: 'close'}));
      } else if (resp.data && resp.data.state !== 'initial') {
        $('#layout-container').html(self.templateState({status: 'check'}));
      } else {
        setTimeout(function() { self.waitForAction(codeId); }, 1500);
      }
    });
  },

  buildAssetItem: function (asset, utxos) {
    var total = new Decimal(0), signed = new Decimal(0), pending = new Decimal(0);
    for (var id in utxos) {
      total = total.add(new Decimal(utxos[id].amount));
      if (utxos[id].state === 'signed') {
        signed = signed.add(new Decimal(utxos[id].amount));
      }
    }
    asset.total = total.toString();
    asset.signed = signed.toString();
    asset.pending = pending.toString();
    return asset;
  },

  buildThresholdScript: function (t) {
    var s = t.toString(16);
    if (s.length === 1) {
      s = '0' + s;
    }
    if (s.length > 2) {
      alert('INVALID THRESHOLD ' + t);
    }
    return 'fffe' + s;
  },

  createMultisigRequest: function(raw, action, callback) {
    this.api.request('POST', '/multisigs', {raw: raw, action: action}, function (resp) {
      if (resp.error) {
        return;
      }
      callback(resp.data);
    });
  },

  loadGhostKeys: function(members, index, callback) {
    this.api.request('POST', '/outputs', {receivers: members, index: index}, function (resp) {
      if (resp.error) {
        return;
      }
      var keys = {
        mask: resp.data.mask,
        keys: resp.data.keys
      };
      callback(keys);
    });
  },

  loadUTXOs: function (offset, conv, filter, callback) {
    const self = this;
    var key = self.makeUnique(conv.participants);
    var members = self.memberIds(conv.participants);
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
      self.loadUTXOs(resp.data[resp.data.length-1].created_at, conv, filter, callback);
    }, members, threshold, offset, 100);
  },

  loadContacts: function (callback) {
    const self = this;
    const key = 'friends-list';
    var friends = localStorage.getItem(key);
    if (friends) {
      callback(JSON.parse(friends));
      self.api.request('GET', '/friends', undefined, function (resp) {
        if (resp.error) {
          return false;
        }
        for (var i in resp.data) {
          var u = resp.data[i];
          u.firstLetter = u.avatar_url === '' ? (u.full_name.trim()[0] || '^_^') : undefined;
        }
        localStorage.setItem(key, JSON.stringify(resp.data));
      });
    } else {
      self.api.request('GET', '/friends', undefined, function (resp) {
        if (resp.error) {
          return false;
        }
        for (var i in resp.data) {
          var u = resp.data[i];
          u.firstLetter = u.avatar_url === '' ? (u.full_name.trim()[0] || '^_^') : undefined;
        }
        localStorage.setItem(key, JSON.stringify(resp.data));
        callback(resp.data);
      });
    }
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
      if (resp.error) {
        return false;
      }
      var users = {};
      for (var i in resp.data) {
        var u = resp.data[i];
        users[u.user_id] = u;
      }
      localStorage.setItem(key, JSON.stringify(users));
      return callback(users);
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

  memberIds: function (ps) {
    var ids = [];
    for (var i in ps) {
      var id = ps[i].user_id;
      if (id === CLIENT_ID) {
        continue;
      }
      ids.push(ps[i].user_id)
    }
    return ids.sort();
  },

  toHex: function(s) {
    if (typeof(s) !== 'string') {
      return '';
    }
    var s = unescape(encodeURIComponent(s))
    var h = ''
    for (var i = 0; i < s.length; i++) {
      h += s.charCodeAt(i).toString(16)
    }
    return h
  },
};

export default Home;
