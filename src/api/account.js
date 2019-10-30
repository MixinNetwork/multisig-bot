import sha256 from 'crypto-js/sha256';
import Base64 from 'crypto-js/enc-base64';
var CryptoJS = require("crypto-js");

function Account(api) {
  this.api = api;
}

Account.prototype = {
  authenticate: function (callback, authorizationCode) {
    var params = {
      "client_id": CLIENT_ID,
      "code": authorizationCode,
      "code_verifier": window.localStorage.getItem("verifier")
    };
    this.api.request('POST', '/oauth/token', params, function(resp) {
      if (resp.data) {
        if (resp.data.scope.indexOf('ASSETS:READ') < 0) {
          resp.error = { code: 403, description: 'Access denied.' };
          return callback(resp);
        }
        window.localStorage.setItem('token', resp.data.access_token);
      }
      return callback(resp);
    });
  },

  conversation: function (callback, id) {
    this.api.request('GET', '/conversations/'+id, undefined, function(resp) {
      return callback(resp);
    });
  },

  challenge: function () {
    var wordArray = CryptoJS.lib.WordArray.random(32);
    var verifier = this.base64URLEncode(wordArray);
    var challenge = this.base64URLEncode(this.sha256(wordArray));
    window.localStorage.setItem('verifier', verifier);
    return challenge;
  },

  token: function () {
    let str = window.localStorage.getItem('token');
    if (str == null || str == undefined) {
      return '';
    }
    return str;
  },

  clear: function (callback) {
    window.localStorage.clear();
    if (typeof callback === 'function') {
      callback();
    }
  },

  base64URLEncode: function (str) {
    return Base64.stringify(str)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  },

  sha256: function (buffer) {
    return sha256(buffer);
  },
};

export default Account;
