import styles from './index.module.scss';
import React, { Component } from 'react';

import {
  ApiGetAsset,
  ApiGetChains,
} from '../api';
import AssetIcon from '../components/cover.js';
import Loading from '../components/loading.js';
import background from "../statics/images/bg.png";
import { ReactComponent as AmountIcon } from '../statics/images/ic_amount.svg';

class Index extends Component {
  constructor(props) {
    super(props);

    this.state = {
      assetId: props.match.params.id,
      asset: {},
      amount: '',
      value: 0,
      memo: '',
      loading: true,
    };
  }

  async loadAsset() {
    let asset = await ApiGetAsset(this.state.assetId);
    if (asset.data) {
      return asset.data;
    }
    return this.loadAsset();
  }

  async loadChains() {
    let chains = await ApiGetChains();
    if (!chains.error) {
      return chains;
    }
    return this.loadChains();
  }

  async loadFullData() {
    var that = this;
    let chains = await that.loadChains();
    let asset = await that.loadAsset();
    asset.chain = chains[asset.chain_id];
    this.setState({ asset: asset, loading: false });
  }

  componentDidMount() {
    this.loadFullData();
  }

  render() {
    const i18n = window.i18n;
    let state = this.state;

    if (state.loading) {
      return (
        <Loading />
      );
    }

    return (
      <div className={ styles.transfer } style={{ backgroundImage: `url(${ background })` }}>
        <main>
          <div className={ styles.icon }>
            <AssetIcon asset={ state.asset } />
          </div>
          <div className={ styles.group }>
            { state.asset.symbol }
            <div className={ styles.value }>
              { state.asset.balance }
              &nbsp;
              { i18n.t('transfer.balance') }
            </div>
          </div>
          <div className={ `${styles.group} ${styles.amount}` }>
            <div className={ styles.body }>
              <input placeholder={ i18n.t('transfer.amount') } />
              <div className={ styles.value }>
                { state.value } USD
              </div>
            </div>
            <AmountIcon />
          </div>
          <div className={ `${styles.group} ${styles.memo}` }>
            <input placeholder={ i18n.t('transfer.memo') } />
          </div>
        </main>
      </div>
    );
  }
}

export default Index;
