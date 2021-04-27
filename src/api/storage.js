class Storage {
  setChains(chains) {
    window.localStorage.setItem('chains', JSON.stringify(chains));
  }

  getChains() {
    return window.localStorage.getItem('chains');
  }

  setChainsUpdatedAt() {
    window.localStorage.setItem('chains_updated_at', new Date());
  }

  getChainsUpdatedAt() {
    return window.localStorage.getItem('chains_updated_at');
  }

  setToken(token) {
    window.localStorage.setItem('token', token);
  }

  getToken() {
    return window.localStorage.getItem('token') || '';
  }

  getVerifier() {
    return window.localStorage.getItem("verifier");
  }

  getSelectedAssets() {
    let selected = window.localStorage.getItem('selected_assets');
    if (!!selected) {
      return { "c6d0c728-2624-429b-8e0d-d9d19b6592fa": 0, "c94ac88f-4671-3976-b60a-09064f1811e8": 0 };
    }
    console.log(selected, !!selected);
    return JSON.parse(selected);
  }

  setSelectedAssets(assets) {
    window.localStorage.setItem('selected_assets', JSON.stringify(assets));
  }
}

export default new Storage();
