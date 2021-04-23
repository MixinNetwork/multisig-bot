class Storage {
  setChains(chains) {
    window.localStorage.setItem('chains', JSON.stringify(chains))
  }

  getChains() {
    return window.localStorage.getItem('chains')
  }

  setChainsUpdatedAt() {
    window.localStorage.setItem('chains_updated_at', new Date())
  }

  getChainsUpdatedAt() {
    return window.localStorage.getItem('chains_updated_at')
  }

  setToken(token) {
    window.localStorage.setItem('token', token);
  }

  getToken() {
    return window.localStorage.getItem('token') || ''
  }

  getVerifier() {
    return window.localStorage.getItem("verifier")
  }
}

export default Storage;

// 43d61dcd-e413-450d-80b8-101d5e903357
