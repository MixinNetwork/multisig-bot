import styles from './modal.module.scss';
import React, { Component } from 'react';
import Decimal from 'decimal.js';

import {
  ApiGetChains,
  ApiGetMultisigAssets,
  ApiGetAssets,
} from '../api';
import storage from '../api/storage.js';
import AssetIcon from '../components/cover.js';
import { ReactComponent as CloseIcon } from '../statics/images/ic_close.svg';
import { ReactComponent as SearchIcon } from '../statics/images/ic_search.svg';
import { ReactComponent as SelectIcon } from '../statics/images/ic_select.svg';
import { ReactComponent as SelectedIcon } from '../statics/images/ic_selected.svg';

class Modal extends Component {
  constructor(props) {
    super(props);

    this.state = {
      text: '',
      assets: [],
      selectedAssets: {},
    };

    this.handleChange = this.handleChange.bind(this);
    this.toggleSelect = this.toggleSelect.bind(this);
  }

  handleChange(e) {
    const {name, value} = e.target;
    this.setState({
      [name]: value
    });
  }

  filteredAssets() {
    let state = this.state;
    let text = state.text.toLowerCase()
    if (text.length > 0) {
      let assets = state.assets.filter(asset => {
        return asset.symbol.toLowerCase() === text
      })
      if (assets.length > 0) {
        return assets
      }
      assets = state.assets.filter(asset => {
        return asset.name.toLowerCase() === text
      })
      if (assets.length > 0) {
        return assets
      }
      assets = state.assets.filter(asset => {
        return asset.symbol.toLowerCase().includes(text)
      })
      if (assets.length > 0) {
        return assets
      }
      assets = state.assets.filter(asset => {
        return asset.name.toLowerCase().includes(text)
      })
      return assets
    }
    return state.assets
  }

  toggleSelect(asset) {
    let assets = this.state.selectedAssets;
    if (this.state.selectedAssets[asset] === 0) {
      delete assets[asset];
    } else {
      assets[asset] = 0;
    }
    this.setState({ selectedAssets: assets }, () => {
      storage.setSelectedAssets(assets);
    });
  }

  async loadChains() {
    let chains = await ApiGetChains();
    if (!chains.error) {
      return chains;
    }
    return this.loadChains();
  }

  async loadMultisigAssets() {
    let assets = await ApiGetMultisigAssets();
    if (assets.data) {
      return assets.data;
    }
    return this.loadMultisigAssets();
  }

  async loadAssets() {
    let assets = await ApiGetAssets();
    if (assets.data) {
      return assets.data;
    }
    return this.loadAssets();
  }

  async loadFullData() {
    let chains = await this.loadChains();
    let multisigAssets = await this.loadMultisigAssets();
    let multisigAssetSet = {};
    for (let i=0; i< multisigAssets.length; i++) {
      multisigAssetSet[multisigAssets[i].asset_id] = true;
    }
    let assets = await this.loadAssets();
    for (let i=0; i<assets.length; i++) {
      assets[i].chain = chains[assets[i].chain_id];
      assets[i].value = new Decimal((new Decimal(assets[i].balance)).times(assets[i].price_usd).toFixed(8)).toFixed();
      assets[i].change_usd = (new Decimal(assets[i].change_usd)).toFixed(2);
      assets[i].price_usd = (new Decimal(assets[i].price_usd)).toFixed();
      if ((new Decimal(assets[i].price_usd)).cmp(1) > 0) {
        assets[i].price_usd = new Decimal((new Decimal(assets[i].price_usd)).toFixed(2)).toFixed();
      }
    }
    assets = assets.filter(asset => {
      // All erc20 tokens are multisig asset
      return multisigAssetSet[asset.asset_id] || asset.chain_id === '43d61dcd-e413-450d-80b8-101d5e903357'
    }).sort((a, b) => {
      let value = (new Decimal(a.value)).cmp(b.value);
      if (value !== 0) {;
        return -value;
      }
      return -(new Decimal(a.price_usd)).cmp(b.price_usd);
    });
    this.setState({ assets: assets, selectedAssets: storage.getSelectedAssets() });
  }

  componentDidMount() {
    this.loadFullData();
  }

  render() {
    const i18n = window.i18n;
    let state  = this.state;

    let assets = this.filteredAssets().map((asset) => {
      return (
        <li className={ styles.item } key={ asset.asset_id } onClick={ () => this.toggleSelect(asset.asset_id) }>
          <div className={ styles.state }>
            { state.selectedAssets[asset.asset_id] === 0 ? <SelectedIcon /> : <SelectIcon /> }
          </div>
          <AssetIcon asset={ asset } />
          <div className={ styles.info }>
            { asset.balance } { asset.symbol }
            <div className={ styles.price }>
              ≈ ${ asset.value }
            </div>
          </div>
          <div className={ styles.value }>
            <div className={ asset.change_usd.indexOf('-')>-1 ? styles.red : styles.geen }>
              { asset.change_usd }%
            </div>
            <div className={ styles.price }>
              ${ asset.price_usd }
            </div>
          </div>
        </li>
      );
    });

    return (
      <div className={ styles.modal }>
        <div className={ styles.container }>
          <header>
            <div className={ styles.title }>
              { i18n.t('home.modal.title') }
            </div>
            <CloseIcon onClick={ () => this.props.handleModal(false) } />
          </header>
          <div className={ styles.search }>
            <SearchIcon> </SearchIcon>
            <input name="text" placeholder={ i18n.t('home.modal.search_placeholder') } value={ state.text } onChange={this.handleChange} />
          </div>
          <main>
            <ul>
              { assets }
            </ul>
          </main>
        </div>
      </div>
    );
  }
}

export default Modal;
