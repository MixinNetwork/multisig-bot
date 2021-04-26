class Util {
  parseThreshold(name) {
    name = name || '';
    var parts = name.split('^');
    if (parts.length !== 2) {
      return -1;
    }
    var t = parseInt(parts[1]);
    return t ? t : -1;
  }
}

export default new Util();
