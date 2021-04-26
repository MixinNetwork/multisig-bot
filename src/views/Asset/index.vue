<template>
  <loading v-if="!ready" ></loading>
  <div v-else class="asset" :style="{ backgroundImage: `url(${require('@/statics/images/bg.png')})` }">
    <div class="info">
      <asset-icon class="icon" :asset="asset" > </asset-icon>
      <div class="balance">
        {{ asset.balance }} <span>{{asset.symbol}}</span>
      </div>
      <div class="value">
        ≈ ${{ asset.value }}
      </div>
      <div class="actions">
        {{ $t('asset.action.send') }}
        <div class="divide">
        </div>
        {{ $t('asset.action.receive') }}
      </div>
    </div>
    <div class="blank">
      <inline-svg :src="require('@/statics/images/ic_transaction.svg')" > </inline-svg>
      <div class="text">
        {{ $t('asset.blank') }}
      </div>
    </div>
  </div>
</template>

<script>
const Decimal = require('decimal.js');
import mixin from 'bot-api-js-client'

import { 
  ApiGetAsset,
  ApiGetChains,
  ApiGetMultisigsOutputs,
  ApiGetConversation,
} from '@/api'
import util from '@/api/util'
import AssetIcon from '@/components/AssetIcon'
import Loading from '@/components/Loading'

export default {
  name: 'Asset',
  components: {
    AssetIcon,
    Loading,
  },
  data() {
    return {
      assetId: this.$route.params.id,
      asset: {},
      ready: false,
    }
  },

  async mounted() {
    let that = this;
    let conversation = await that.loadConversation()
    let participants = []
    conversation.participants.forEach(p => {
      if (process.env.VUE_APP_CLIENT_ID !== p.user_id && '37e040ec-df91-47a7-982e-0e118932fa8b' !== p.user_id) {
        participants.push(p.user_id)
      }
    })
    let outputs = await that.loadMultisigsOutputs(participants, util.parseThreshold(conversation.name), '', [])
    let balance = outputs.reduce((a, c) => {
      if (c.asset_id === that.assetId && c.state === 'unspent') {
        return a.plus(c.amount)
      }
      return a
    }, new Decimal('0'))

    let chains = await this.loadChains()
    let asset = await this.loadAsset()
    asset.balance = balance.toFixed()
    asset.value = (new Decimal(balance.times(asset.price_usd).toFixed(8))).toFixed()
    asset.chain = chains[asset.chain_id]
    this.asset = asset
    this.ready = true
  },

  methods: {
    async loadConversation() {
      let conversation = await ApiGetConversation(mixin.util.conversationId())
      if (conversation.data) {
        return conversation.data
      }
      if (conversation.error.code === 404) {
        return  // TODO should handle 404
      }
      return this.loadConversation()
    },
    async loadAsset() {
      let asset = await ApiGetAsset(this.assetId)
      if (asset.data) {
        return asset.data
      }
      return this.loadAsset()
    },
    async loadChains() {
      let chains = await ApiGetChains()
      if (!chains.error) {
        return chains
      }
      return this.loadChains()
    },
    async loadMultisigsOutputs(participants, threshold, offset, utxo) {
      let outputs = await ApiGetMultisigsOutputs(participants, threshold, '', threshold)
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
    },
  }
}
</script>

<style lang="scss" scoped>
.asset {
  background-position: top;
  background-size: 100% auto;
  background-repeat: no-repeat;
  min-height: 100vh;
  padding: 0 1rem;
  display: flex;
  flex-direction: column;
}
.info {
  background: white;
  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
  border-radius: 1.6rem;
  padding: 4rem 4.2rem 1.6rem;
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.icon {
  margin-bottom: .6rem;
}
.balance {
  font-size: 3.2rem;
  margin-bottom: .6rem;
  span {
    font-size: 1.6rem;
  }
}
.value {
  font-size: 1.4rem;
  color: #B8BDC7;
  margin-bottom: 1.6rem;
}
.actions {
  background: #F5F7FA;
  border-radius: 1.4rem;
  padding: 1.4rem 0 1.5rem;
  display: flex;
  justify-content: space-evenly;
  width: 100%;
}
.divide {
  width: 2px;
  background: rgba(0, 0, 0, 0.04);
}
.blank {
  background: white;
  color: #B8BDC7;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
.text {
  margin-top: 2.4rem;
}
</style>
