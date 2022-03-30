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
  this.templateIndex = require('./index.html');
  this.templateSend = require('./send.html');
  this.templateSign = require('./sign.html');
  this.templateState = require('./state.html');
  this.templateEmpty = require('./empty.html');
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
        var members = [self.api.account.me().user_id];
        self.loadWallet(members, 1);
        return true;
      } else if (resp.data && resp.data.category === 'GROUP') {
        self.loadUsers(resp.data.participants, function (users) {
          var members = self.memberIds(conv.participants);
          var threshold = self.parseThreshold(conv.name);
          self.loadWallet(members, threshold);
        });
        return true;
      }
      self.router.updatePageLinks();
    }, new Mixin().conversationId());
  },

  loadWallet: function (members, threshold) {
    const self = this;
    self.loadUTXOs(undefined, members, threshold, {}, function (utxos) {
      if (Object.keys(utxos).length == 0) {
        $('body').attr('class', 'home layout');
        $('#layout-container').html(self.templateEmpty());
      } else {
        self.loadTokens(0, Object.keys(utxos), {}, function (tokens) {
          self.renderWalletForAll(tokens, utxos);
        });
      }
    });
  },

  renderWalletForAll: function (tokens, utxos) {
    const self = this;
    var assetsView = [];
    for (var id in utxos) {
      var item = self.buildTokenItem(tokens[id], utxos[id]);
      assetsView.push(item);
    }
    $('body').attr('class', 'home layout');
    $('#layout-container').html(self.templateIndex({tokens: assetsView}));
    $('.assets.list .wallet.item').on('click', function (e) {
      e.preventDefault();
      var id = $(this).attr('data-id');
      $('body').attr('class', 'loading layout');
      $('#layout-container').html(self.partialLoading());
      self.loadContacts(function (contacts) {
        self.renderWalletForToken(tokens[id], utxos[id], contacts);
      });
    });
  },

  renderWalletForToken: function (token, utxos, contacts) {
    const self = this;
    if (Decimal.sign(token.signed) > 0) {
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
          multi.token = token;
          multi.finished = signers.length >= utxo.receivers_threshold;
          console.log(multi);
          $('body').attr('class', 'home layout');
          $('#layout-container').html(self.templateSign(multi));
          $('textarea').each(function() {
            $(this).height($(this).prop('scrollHeight'));
          });
          $('form').submit(function (event) {
            event.preventDefault();
            if (multi.signers.length < utxo.receivers_threshold) {
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
      contacts.sort(function (a, b) {
        var ai = parseInt(a.identity_number);
        var bi = parseInt(b.identity_number);
        return ai - bi;
      });
      token.isMetaToken = token.token_id === '2f8aa18a-3cb8-31d5-95bc-5a4f2e25dc2f';
      $('body').attr('class', 'home layout');
      $('#layout-container').html(self.templateSend({contacts: contacts, token: token}));
      $('form').submit(function (event) {
        event.preventDefault();
        var members = [];
        $('input:radio:checked').each(function () {
          members.push($(this).val());
        });
        var tx = {
          version: 2,
          asset: token.mixin_id,
          inputs: [],
          outputs: [],
          extra: token.nfo,
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
        var ghostRequests = [{
          receivers: members,
          index: 0
        }, {
          receivers: utxo.receivers,
          index: 1
        }];
        console.log(ghostRequests);
        self.loadGhostKeys(ghostRequests, function (keysData) {
          console.log(keysData);
          var output = {
            mask: keysData[0].mask,
            keys: keysData[0].keys
          };
          output.amount = amount.toString();
          output.script = self.buildThresholdScript(parseInt($('input[name="threshold"]').val()));
          tx.outputs.push(output)
          if (inputAmount.cmp(amount) > 0) {
            var output = {
              mask: keysData[1].mask,
              keys: keysData[1].keys
            };
            var utxo = utxos[Object.keys(utxos)[0]];
            output.amount = inputAmount.sub(amount).toString();
            output.script = self.buildThresholdScript(utxo.receivers_threshold);
            tx.outputs.push(output)
          }
          console.log(JSON.stringify(tx));
          var raw = mixinGo.buildTransaction(JSON.stringify(tx));
          console.log(raw);
          self.handleMultisigRequest(raw, 'sign');
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
        var params = {method: "sendrawtransaction", params: [resp.data.raw_transaction]};
        self.api.request('POST', '/external/proxy', params, function (resp) {});
        $('#layout-container').html(self.templateState({status: 'check'}));
      } else {
        setTimeout(function() { self.waitForAction(codeId); }, 1500);
      }
    });
  },

  buildTokenItem: function (asset, utxos) {
    var total = new Decimal(0), signed = new Decimal(0), pending = new Decimal(0);
    for (var id in utxos) {
      total = total.add(new Decimal(utxos[id].amount));
      if (utxos[id].state === 'signed') {
        signed = signed.add(new Decimal(utxos[id].amount));
      }
    }
    if (asset.meta.icon_url.indexOf('zVDjOxNTQvVsA8h2B4ZVxuHoCF3DJszufYKWpd9duXUSbSapoZadC7_13cnWBqg0EmwmRcKGbJaUpA8wFfpgZA') > 0) {
      asset.meta.icon_url = generateIdenticon(asset.meta.hash);
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
    this.api.request('POST', '/collectibles/requests', {raw: raw, action: action}, function (resp) {
      if (resp.error) {
        return;
      }
      callback(resp.data);
    });
  },

  loadGhostKeys: function(ghosts, callback) {
    this.api.request('POST', '/outputs', ghosts, function (resp) {
      if (resp.error) {
        return;
      }
      callback(resp.data);
    });
  },

  loadUTXOs: function (offset, members, threshold, filter, callback) {
    const self = this;
    var key = members.sort().join('');
    self.api.collectible.list(function (resp) {
      if (resp.error) {
        return false;
      }
      for (var i in resp.data) {
        var utxo = resp.data[i];
        if (utxo.receivers.sort().join("") !== key) {
          continue;
        }
        if (utxo.receivers_threshold !== threshold) {
          continue;
        }
        if (utxo.state === 'spent') {
          continue;
        }
        if (!filter[utxo.token_id]) {
          filter[utxo.token_id] = {};
        }
        filter[utxo.token_id][utxo.output_id] = utxo;
      }
      if (resp.data.length < 100) {
        return callback(filter);
      }
      self.loadUTXOs(resp.data[resp.data.length-1].created_at, members, threshold, filter, callback);
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

  loadTokens: function (offset, ids, output, callback) {
    if (offset == ids.length) {
      return callback(output);
    }
    const self = this;
    const key = 'token-' + ids[offset];
    var token = localStorage.getItem(key);
    if (token) {
      output[ids[offset]] = JSON.parse(token);
      return self.loadTokens(offset+1, ids, output, callback);
    }
    self.api.request('GET', '/collectibles/tokens/' + ids[offset], undefined, function (resp) {
      if (resp.error) {
        return false;
      }
      var key = 'token-' + resp.data.token_id;
      localStorage.setItem(key, JSON.stringify(resp.data));
      output[resp.data.token_id] = resp.data;
      self.loadTokens(offset+1, ids, output, callback);
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

// see code in action: https://jsfiddle.net/desaroxx/jp4pmd2u/

/* Configuration variables */
var MAX_COLOR 		= 16;				// Max value for a color component
var MIN_COLOR 		= 200; 				// Min value for a color component
var SQUARE 		= 32; 				// Size of a grid square in pixels
var GRID 		= 8; 				// Number of squares width and height
var PADDING 		= SQUARE / 2; 			// Padding on the edge of the canvas in px
var SIZE 		= SQUARE * GRID + PADDING * 2; 	// Size of the canvas
var FILL_COLOR 		= '#F0ECE6';			// canvas background color

/* Create a temporary canvas */
function setupCanvas() {
  var canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;

  // Fill canvas background
  var context = canvas.getContext('2d');
  context.beginPath();
  context.rect(0, 0, SIZE, SIZE);
  context.fillStyle = FILL_COLOR;
  context.fill();
  return canvas;
}

/* Fill in a square of the canvas */
function fillBlock(x, y, color, context) {
  context.beginPath();
  context.rect(PADDING + x * SQUARE, PADDING + y * SQUARE, SQUARE, SQUARE);
  context.fillStyle = 'rgb(' + color.join(',') + ')';
  context.fill();
}

/* Generate a random color with low saturation. */
function generateColor(val) {
  var rgb = [ ];
  for (var i = 1; i <= 3; i++) {
    var e = (val * i * i) % 255;
    rgb.push(e);
  }
  return rgb;
};

/* Generate a random identicon */
function generateIdenticon(hex) {
  var bytes = hexToBytes(hex);
  var canvas = setupCanvas();
  var context = canvas.getContext('2d');

  // Iterate through squares on left side
  for (var x = 0; x < Math.ceil(GRID / 2); x++) {
    for (var y = 0; y < GRID; y++) {
      // Randomly fill squares
      var bi = bytes[x * GRID + y];
      var color = generateColor(bi);
      if (bi % 3 > 0) {
        fillBlock(x, y, color, context);

        // Fill right side symmetrically
        if (x < Math.floor(GRID / 2)) {
          fillBlock((GRID - 1) - x, y, color, context);
        }
      }
    }
  }
  return canvas.toDataURL();
}

// Convert a hex string to a byte array
function hexToBytes(hex) {
  for (var bytes = [], c = 0; c < hex.length; c += 2) {
    bytes.push(parseInt(hex.substr(c, 2), 16));
  }
  return bytes;
}
