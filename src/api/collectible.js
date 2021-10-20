import { SHA3 } from 'sha3';

function Collectible(api) {
  this.api = api;
}

Collectible.prototype = {
  list: function (callback, members, threshold, offset, limit) {
    const self = this;
    var path = '/collectibles/outputs?offset=' + offset + '&limit=' + limit + '&members=' + self.hashMembers(members) + '&threshold=' + threshold;
    this.api.request('GET', path, undefined, function(resp) {
      return callback(resp);
    });
  },
  hashMembers: function (ids) {
    ids = ids.sort((a, b) => a > b ? 1 : -1)
    return this.newHash(ids.join(''))
  },
  newHash: function (str) {
    return new SHA3(256).update(str).digest('hex')
  },
};

export default Collectible;
