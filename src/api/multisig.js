function Multisig(api) {
  this.api = api;
}

Multisig.prototype = {
  list: function (callback, offset, limit) {
    var path = '/multisigs?offset=' + offset + '&limit=' + limit;
    this.api.request('GET', path, undefined, function(resp) {
      return callback(resp);
    });
  },
};

export default Multisig;
