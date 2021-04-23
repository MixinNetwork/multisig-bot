<template>
  <div class="home" :style="{ backgroundImage: `url(${require('@/assets/images/bg_texture.png')})` }">
    <div class="balance">
      <div class="btc">
        {{ balanceBTC }} <span>BTC</span>
      </div>
      <div class="usd">
        ≈ ${{ balanceUSD }}
      </div>
    </div>
    <div class="main">
      <header>
        <div class="title">
          {{ $t('home.assets') }}
        </div>
        <inline-svg :src="require('@/assets/images/ic_setting.svg')"
         fill="#C4C4C4"
         width="32" />
      </header>
      <main>
        <ul>
          <li class="item" v-for="asset in assets" :key="asset.asset_id">
            <div class="icon">
              <img :src="asset.icon_url" class="asset" />
              <img :src="asset.chain.icon_url" class="chain" />
            </div>
            <div class="info">
              {{ asset.balance }} {{ asset.symbol }}
              <div class="price">
              ≈ ${{ asset.value }}
              </div>
            </div>
            <div class="value">
              <div class="change">
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

<style lang="scss" scoped>
.home {
  background-position: top;
  background-size: 100% auto;
  background-repeat: no-repeat;
  min-height: 100vh;
  padding: 0 1rem;
  display: flex;
  flex-direction: column;
}

.balance {
  color: white;
  text-align: center;
  padding: 7.2rem 0 5rem;
  .btc {
    font-size: 4rem;
    margin-bottom: 1.6rem;
    span {
      font-size: 1.6rem;
    }
  }
  .usd {
    color: rgba(255, 255, 255, 0.5);
    font-size: 2rem;
  }
}

.main {
  background: white;
  border-radius: 1.2rem 1.2rem 0 0;
  padding: 3rem 1.6rem;
  flex-grow: 1;
  header {
    display: flex;
    margin-bottom: 3rem;
    .title {
      flex-grow: 1;
    }
  }
  .info {
    flex-grow: 1;
    padding-left: 1.6rem;
  }
  .value {
    text-align: right;
  }
  .price {
    color: #B8BDC7;
    font-size: 1.4rem;
    margin-top: .4rem;
  }
}
.item {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 3.2rem;
  .icon {
    width: 4.2rem;
    position: relative;
    .chain {
      border: 2px solid white;
      border-radius: .8rem;
      width: 1.6rem;
      position: absolute;
      top: 60%;
      left: 0%;
      z-index: 99;
    }
  }
}
</style>

<script>
let Decimal = require('decimal.js');
import InlineSvg from 'vue-inline-svg'
import mixin from 'bot-api-js-client'
import { 
  ApiGetChains, 
  ApiGetConversation, 
  ApiGetMultisigsOutputs,
  ApiGetAsset,
} from '@/api'

export default {
  name: 'Home',
  components: {
    InlineSvg
  },

  data() {
    return {
      balanceBTC: 0,
      balanceUSD: 0,
      assets: [],
      ready: false,
    }
  },

  async mounted() {
    let chains = await this.loadChains()
    let conversation = await this.loadConversation()
    if (!conversation || conversation.category !== 'GROUP' || 
      this.parseThreshold(conversation.name) < 1 ||
      conversation.participants.length < 3) {
      this.$router.push('/guide')
    }
    let participantIds = []
    conversation.participants.forEach(p => {
      // old multisig bot
      if (process.env.VUE_APP_CLIENT_ID !== p.user_id && '37e040ec-df91-47a7-982e-0e118932fa8b' !== p.user_id) {
        participantIds.push(p.user_id)
      }
    })
    let outputs = await this.loadMultisigsOutputs(participantIds, this.parseThreshold(conversation.name), '', [])
    let assetSet = {}
    for (let i=0; i< outputs.length; i++) {
      if (!assetSet[outputs[i].asset_id]) {
        assetSet[outputs[i].asset_id] = 0
      }
      assetSet[outputs[i].asset_id] = (new Decimal(assetSet[outputs[i].asset_id])).plus(outputs[i].amount)
    }
    let assetIds = Object.keys(assetSet)
    if (assetIds.length === 0) {
      assetIds.push('c6d0c728-2624-429b-8e0d-d9d19b6592fa')
      assetSet['c6d0c728-2624-429b-8e0d-d9d19b6592fa'] = 0
    }
    let assets = await this.loadAssets(assetIds, 0, [])
    for (let i=0; i<assets.length; i++) {
      assets[i].balance = (new Decimal(assetSet[assets[i].asset_id])).toString()
      assets[i].value = (new Decimal(assets[i].balance)).times(assets[i].price_usd).toFixed(8)
      assets[i].change_usd = (new Decimal(assets[i].change_usd)).toFixed(2)
      assets[i].price_usd = (new Decimal(assets[i].price_usd)).toFixed(8)
      assets[i].chain = chains[assets[i].chain_id]
      this.balanceBTC = (new Decimal(assets[i].balance)).times(assets[i].price_btc).plus(this.balanceBTC)
      this.balanceUSD = (new Decimal(assets[i].value)).plus(this.balanceUSD)
    }
    this.balanceBTC = this.balanceBTC.toFixed(8)
    this.balanceUSD = this.balanceUSD.toFixed(8)
    this.assets = assets
  },

  methods: {
    parseThreshold(name) {
      name = name || ''
      var parts = name.split('^');
      if (parts.length != 2) {
        return -1;
      }
      var t = parseInt(parts[1]);
      return t ? t : -1;
    },
    async loadChains() {
      let chains = await ApiGetChains()
      if (!chains.error) {
        return chains
      }
      return this.loadChains()
    },

    async loadConversation() {
      let conversation = await ApiGetConversation(mixin.util.conversationId())
      if (conversation.data) {
        return conversation.data
      }
      if (conversation.error.code === 404) {
        return 
      }
      return this.loadConversation()
    },

    async loadAssets(ids, offset, output) {
      if (ids.length === offset) {
        return output
      }
      let asset = await ApiGetAsset(ids[offset])
      if (asset.data) {
        output.push(asset.data)
        offset+=1
      }
      return this.loadAssets(ids, offset, output)
    },

    async loadMultisigsOutputs(participants, threshold, offset, utxo) {
      let outputs = await ApiGetMultisigsOutputs(participants, threshold, 'unspent', threshold)
      if (outputs.data) {
        utxo.push(...outputs.data)
        if (outputs.data.length < 500) {
          return utxo
        }
        let output = outputs.data[outputs.data.length-1]
        if (output) {
          offset = output.created_at
        }
      }
      this.loadMultisigsOutputs(participants, threshold, offset, utxo)
    }
  }
}
</script>
