<template>
  <div class="modal">
    <div class="container">
      <header>
        <div class="title">
          {{ $t('home.modal.title') }}
        </div>
        <inline-svg @click="hideModal" :src="require('@/assets/images/ic_close.svg')" fill="#C4C4C4" />
      </header>
      <div class="search">
        <inline-svg :src="require('@/assets/images/ic_search.svg')" />
          <input :placeholder="$t('home.modal.search_placeholder')" v-model="text">
      </div>
      <main>
        <ul>
          <li class="item" v-for="asset in getAssets" :key="asset.asset_id" v-on:click="toggleSelect(asset.asset_id)">
            <div class="state">
              <inline-svg v-if="asset.selected" :src="require('@/assets/images/ic_selected.svg')" > </inline-svg>
              <inline-svg v-else :src="require('@/assets/images/ic_select.svg')" > </inline-svg>

            </div>
            <asset-icon :asset="asset"> </asset-icon>
            <div class="info">
              {{ asset.balance }} {{ asset.symbol }}
              <div class="price">
                ≈ ${{ asset.value }}
              </div>
            </div>
            <div class="value">
              <div :class="['change', asset.change_usd.indexOf('-')>-1 ? 'red' : 'geen']">
                {{ asset.change_usd }}%
              </div>
              <div class="price">
                ${{ asset.price_usd }}
              </div>
            </div>
          </li>
        </ul>
      </main>
    </div>
  </div>
</template>

<script>
let Decimal = require('decimal.js');
import AssetIcon from '@/components/AssetIcon'

import { 
  ApiGetChains, 
  ApiGetAssets,
} from '@/api'
import Storage from '@/api/storage'

export default {
  name: 'AssetsModal',
  props: {
    modalValue: Boolean,
  },
  data() {
    return {
      storage: new Storage(),
      text: '',
      assets: [],
      selectedAssets: {},
    }
  },
  components: {
    AssetIcon,
  },
  async mounted() {
    let chains = await this.loadChains()
    let assets = await this.loadAssets()
    for (let i=0; i<assets.length; i++) {
      assets[i].chain = chains[assets[i].chain_id]
      assets[i].value = new Decimal((new Decimal(assets[i].balance)).times(assets[i].price_usd).toFixed(8)).toFixed()
      assets[i].change_usd = (new Decimal(assets[i].change_usd)).toFixed(2)
      assets[i].price_usd = (new Decimal(assets[i].price_usd)).toFixed()
      if ((new Decimal(assets[i].price_usd)).cmp(1) > 0) {
        assets[i].price_usd = new Decimal((new Decimal(assets[i].price_usd)).toFixed(2)).toFixed()
      }
    }
    this.assets = assets.sort((a, b) => {
      let value = (new Decimal(a.value)).cmp(b.value)
      if (value !== 0) {
        return -value
      }
      return -(new Decimal(a.price_usd)).cmp(b.price_usd)
    })

    this.selectedAssets = this.storage.getSelectedAssets()
  },
  computed: {
    getAssets() {
      let assets = this.filteredAssets()
      for (let i=0; i<assets.length; i++) {
        assets[i].selected = this.selectedAssets[assets[i].asset_id] === 0
      }
      return assets
    },
  },
  methods: {
    hideModal() {
      this.$emit('update:modelValue', false)
    },
    filteredAssets() {
      let text = this.text.toLowerCase()
      if (this.text.length > 0) {
        let assets = this.assets.filter(asset => {
          return asset.symbol.toLowerCase() === text
        })
        if (assets.length > 0) {
          return assets
        }
        assets = this.assets.filter(asset => {
          return asset.name.toLowerCase() === text
        })
        if (assets.length > 0) {
          return assets
        }
        assets = this.assets.filter(asset => {
          return asset.symbol.toLowerCase().includes(text)
        })
        if (assets.length > 0) {
          return assets
        }
        assets = this.assets.filter(asset => {
          return asset.name.toLowerCase().includes(text)
        })
        return assets
      }
      return this.assets
    },
    toggleSelect(asset) {
      let assets = this.selectedAssets
      if (this.selectedAssets[asset] === 0) {
        delete assets[asset]
      } else {
        assets[asset] = 0
      }
      this.selectedAssets = assets
      this.storage.setSelectedAssets(this.selectedAssets)
    },
    async loadChains() {
      let chains = await ApiGetChains()
      if (!chains.error) {
        return chains
      }
      return this.loadChains()
    },
    async loadAssets() {
      let assets = await ApiGetAssets()
      if (assets.data) {
        return assets.data
      }
      return this.loadAssets()
    }
  },
}
</script>

<style lang="scss" scoped>
.modal {
  background: rgba(0, 0, 0, 0.6);
  position: fixed;
  top: 0;
  left: 0;
  z-index: 999;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}
.container {
  background: white;
  border-radius: 1.3rem 1.3rem 0 0;
  height: 90%;
  padding: 3rem 1.6rem;
  display: flex;
  flex-direction: column;
}
.search {
  background: #F5F7FA;
  border-radius: 2rem;
}
main {
  flex-grow: 1;
  overflow: auto;
}
header {
  display: flex;
  margin-bottom: 2rem;
  .title {
    flex-grow: 1;
  }
}
.search {
  margin-bottom: 3rem;
  padding: 1.2rem 1.6rem;
  display: flex;
  align-items: center;
  input {
    background: #F5F7FA;
    border: none;
    font-size: 1.6rem;
    padding: 0 1.2rem;
  }
}
.item {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 3.2rem;
  .state {
    padding-right: 1.2rem;
  }
  .price {
    color: #B8BDC7;
    font-size: 1.4rem;
    margin-top: .4rem;
  }
  .red {
    color: #E57874;
  }
  .green {
    color: #5DBC7A;
  }
  .info {
    flex-grow: 1;
    padding-left: 1.6rem;
  }
  .value {
    text-align: right;
  }
}
</style>
