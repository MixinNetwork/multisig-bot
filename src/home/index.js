import styles from './index.module.scss'; // styles is create-react-app
import React, { Component } from 'react';
import Decimal from 'decimal.js';
import mixin from 'bot-api-js-client'
import { Link } from 'react-router-dom';

import {
  ApiGetChains,
  ApiGetConversation,
  ApiGetMultisigsOutputs,
  ApiGetAsset,
} from '../api';
import util from '../api/util.js';
import storage from '../api/storage.js';
import AssetIcon from '../components/cover.js';
import background from "../statics/images/bg_texture.png";
import { ReactComponent as SettingIcon } from '../statics/images/ic_setting.svg';
import Modal from './modal.js';

class Index extends Component {
  constructor(props) {
    super(props);

    this.state = {
      balanceBTC: 0,
      balanceUSD: 0,
      assets: [],
      modal: true,
      loading: true,
    };
  }

  async loadFullData() {
    let conversation = await this.loadConversation()
    if (!conversation || conversation.category !== 'GROUP' ||
      util.parseThreshold(conversation.name) < 1 ||
      conversation.participants.length < 3) {
      this.$router.push('/guide')
    }
    let participantIds = []
    conversation.participants.forEach(p => {
      // skip current and old multisig bot
      if (process.env.REACT_APP_CLIENT_ID !== p.user_id && '37e040ec-df91-47a7-982e-0e118932fa8b' !== p.user_id) {
        participantIds.push(p.user_id)
      }
    })
    // multisig output assets will always display
    let outputs = await this.loadMultisigsOutputs(participantIds, util.parseThreshold(conversation.name), '', [])
    let assetSet = storage.getSelectedAssets()
    for (let i=0; i<outputs.length; i++) {
      if (!assetSet[outputs[i].asset_id]) {
        assetSet[outputs[i].asset_id] = 0
      }
      assetSet[outputs[i].asset_id] = (new Decimal(assetSet[outputs[i].asset_id])).plus(outputs[i].amount)
    }
    let chains = await this.loadChains()
    let assetIds = Object.keys(assetSet)
    let assets = await this.loadAssets(assetIds, 0, [])
    let balanceBTC = this.state.balanceBTC
    let balanceUSD = this.state.balanceUSD
    for (let i=0; i<assets.length; i++) {
      assets[i].balance = (new Decimal(assetSet[assets[i].asset_id])).toFixed()
      assets[i].value = new Decimal((new Decimal(assets[i].balance)).times(assets[i].price_usd).toFixed(8)).toFixed()
      assets[i].change_usd = (new Decimal(assets[i].change_usd)).toFixed(2)
      assets[i].price_usd = (new Decimal(assets[i].price_usd)).toFixed()
      if ((new Decimal(assets[i].price_usd)).cmp(1) > 0) {
        assets[i].price_usd = new Decimal((new Decimal(assets[i].price_usd)).toFixed(2)).toFixed()
      }
      assets[i].chain = chains[assets[i].chain_id]
      balanceBTC = (new Decimal(assets[i].balance)).times(assets[i].price_btc).plus(balanceBTC)
      balanceUSD = (new Decimal(assets[i].value)).plus(balanceUSD)
    }
    balanceBTC = balanceBTC.toFixed()
    balanceUSD = balanceUSD.toFixed()
    assets = assets.sort((a, b) => {
      let value = (new Decimal(a.value)).cmp(b.value)
      if (value !== 0) {
        return -value
      }
      return -(new Decimal(a.price_usd)).cmp(b.price_usd)
    })
    this.setState({balanceBTC: balanceBTC, balanceUSD: balanceUSD, assets: assets, loading: false});
  }
  async loadConversation() {
    let conversation = await ApiGetConversation(mixin.util.conversationId())
    if (conversation.data) {
      return conversation.data
    }
    if (conversation.error.code === 404) {
      return
    }
    return this.loadConversation()
  }
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
  async loadChains() {
    let chains = await ApiGetChains()
    if (!chains.error) {
      return chains
    }
    return this.loadChains()
  }
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
  }

  componentDidMount() {
    this.loadFullData();
  }

  render() {
    const i18n = window.i18n;
    let state  = this.state;

    let assets = state.assets.map((asset) => {
      return (
        <li key={ asset.asset_id }>
          <Link className={ styles.item } to={ `/assets/${asset.asset_id}` }>
            <AssetIcon asset={ asset } />
            <div className={ styles.info }>
              { asset.balance } { asset.symbol }
              <div className={ styles.price }>
                ≈ ${ asset.value }
              </div>
            </div>
            <div className={ styles.value }>
              <div className={ asset.change_usd.indexOf('-')>=0 ? styles.red : styles.green }>
                { asset.change_usd }%
              </div>
              <div className={ styles.price }>
                ${ asset.price_usd }
              </div>
            </div>
          </Link>
        </li>
      );
    });

    return (
      <div className={ styles.home } style={{ backgroundImage: `url(${ background })` }}>
        <div className={ styles.balance }>
          <div className={ styles.btc }>
            { state.balanceBTC } <span>BTC</span>
          </div>
          <div className={ styles.usd }>
            ≈ ${ state.balanceUSD }
          </div>
        </div>
        <div className={ styles.main }>
          <header>
            <div className={ styles.title }>
              { i18n.t('home.assets') }
            </div>
            <SettingIcon />
          </header>
          <main>
            <ul>
              { assets }
            </ul>
          </main>
        </div>
        <Modal />
      </div>
    );
  }
}

export default Index
