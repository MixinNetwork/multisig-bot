import styles from './index.module.scss';
import React, { Component } from 'react';
import Decimal from 'decimal.js';
import mixin from 'bot-api-js-client';
import { v4 as uuidv4 } from 'uuid';

import {
  ApiGetAsset,
  ApiGetChains,
  ApiGetConversation,
  ApiPostPayments,
} from '../api';
import util from '../api/util.js';
import AssetIcon from '../components/cover.js';
import Loading from '../components/loading.js';
import background from "../statics/images/bg.png";
import { ReactComponent as AmountIcon } from '../statics/images/ic_amount.svg';

class Index extends Component {
  constructor(props) {
    super(props);

    this.state = {
      assetId: props.match.params.id,
      conversation: {},
      asset: {},
      amount: '',
      value: 0,
      memo: '',
      loading: true,
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(e) {
    const { name, value } = e.target;
    let state = { [name]: value };
    if (name === 'amount') {
      let v = (new Decimal((new Decimal(value)).times(this.state.asset.price_usd).toFixed(8))).toFixed();
      state['value'] = v;
    }
    this.setState(state);
  }

  handleSubmit() {
    let participantIds = [];
    this.state.conversation.participants.forEach(p => {
      // skip current and old multisig bot
      if (process.env.REACT_APP_CLIENT_ID !== p.user_id && '37e040ec-df91-47a7-982e-0e118932fa8b' !== p.user_id) {
        participantIds.push(p.user_id);
      }
    });
    let params = {
      asset_id: this.state.asset.asset_id,
      amount: this.state.amount,
      trace_id: uuidv4(),
      memo: this.state.memo,
      opponent_multisig: {
        receivers: participantIds,
        threshold: util.parseThreshold(this.state.conversation.name),
      },
    }
    ApiPostPayments(params).then((resp) => {
      console.log(resp);
    });
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

  async loadConversation() {
    let conversation = await ApiGetConversation(mixin.util.conversationId());
    if (conversation.data) {
      return conversation.data;
    }
    if (conversation.error.code === 404) {
      return; // TODO
    }
    return this.loadConversation();
  }

  async loadFullData() {
    var that = this;
    let conversation = await that.loadConversation();
    let chains = await that.loadChains();
    let asset = await that.loadAsset();
    asset.chain = chains[asset.chain_id];
    this.setState({ conversation: conversation, asset: asset, loading: false });
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
              <input placeholder={ i18n.t('transfer.amount') } type="number" name="amount" min="0" value={ state.amount } onChange={ this.handleChange } />
              <div className={ styles.value }>
                { state.value } USD
              </div>
            </div>
            <AmountIcon />
          </div>
          <div className={ `${styles.group} ${styles.memo}` }>
            <input placeholder={ i18n.t('transfer.memo') } name="memo" value={ state.memo } onChange={ this.handleChange } />
          </div>
          <div className={ styles.action }>
            <button onClick={this.handleSubmit} className={`${ styles.submit } ${state.submitting}`}>{i18n.t('transfer.forward')}</button>
          </div>
        </main>
      </div>
    );
  }
}

export default Index;
