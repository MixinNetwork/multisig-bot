module.exports = {
  chainWebpack: config => {
    config
      .plugin('html')
      .tap(args => {
        args[0].title= 'Multisig Wallet base on Mixin Network'
        return args
      })
  },
  css: {
    requireModuleExtension: false
  }
}
