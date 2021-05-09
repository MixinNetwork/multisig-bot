import styles from "./show.module.scss";
import Decimal from "decimal.js";

import {
  ApiGetAsset,
  ApiGetChains,
  ApiPostUsersFetch,
  ApiPostMultisigsRequests,
  ApiPostExternalProxy,
} from "../api";
import React, { Component } from "react";
import { Redirect } from "react-router-dom";

import Loading from "../components/loading.js";
import background from "../statics/images/bg.png";
import Header from "../components/header.js";
import AssetIcon from "../components/cover.js";

class Show extends Component {
  constructor(props) {
    super(props);

    this.state = {
      utxo: props.location.utxo,
      asset: {},
      users: {},
      loading: true,
    };
  }

  async loadAsset() {
    let id = this.props.location.utxo.asset_id;
    let asset = await ApiGetAsset(id);
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

  async loadUsers(members) {
    let users = await ApiPostUsersFetch(members);
    if (!users.error)  {
      return users.data;
    }
    return this.loadUsers(members);
  }

  async postMultisigsRequest() {
    let request = await ApiPostMultisigsRequests("sign", this.state.utxo.signed_tx);
    if (!request.error) {
      return request.data;
    }
    return this.postMultisigsRequest();
  }

  async loadFullData() {
    let utxo = this.state.utxo;
    let chains = await this.loadChains();
    let asset = await this.loadAsset();
    asset.chain = chains[asset.chain_id];
    asset.value = new Decimal(
      new Decimal(this.state.utxo.amount).times(asset.price_usd).toFixed(8)
    ).toFixed();
    let memberIds = [...this.state.utxo.members];
    memberIds.push(this.state.utxo.user_id);
    memberIds.push(this.state.utxo.sender);
    if (this.state.utxo.state === "signed") {
      let request = await this.postMultisigsRequest();
      utxo.signers = request.signers;
      utxo.receivers = request.receivers;
      memberIds.push(...request.signers);
      memberIds.push(...request.receivers);
    }
    let users = await this.loadUsers(memberIds);
    let usersMap = {};
    for (let i in users) {
      usersMap[users[i].user_id] = users[i];
    }
    this.setState({ utxo: utxo, asset: asset, users: usersMap, loading: false });
  }

  sendRawTransaction = () => {
    ApiPostExternalProxy(this.state.utxo.signed_tx).then((resp) => {
      if (resp.error) {
        return;
      }
      let utxo = this.state.utxo;
      utxo.state = "spent";
      this.setState({ utxo: utxo });
    });
  }

  componentDidMount() {
    if (!!this.state.utxo) {
      this.loadFullData();
    }
  }

  render() {
    const i18n = window.i18n;
    let state = this.state;

    if (!state.utxo) {
      return (
        <Redirect to="/" />
      );
    }

    if (state.loading) {
      return <Loading />
    }

    let members = state.utxo.members.map((m) => {
      let user = state.users[m];
      if (!user) {
        return "";
      }
      return (
        <img className={ styles.user } src={ user.avatar_url } alt={ user.full_name } key={ user.user_id } />
      );
    });

    let signers;
    if (state.utxo.signers && state.utxo.signers.length > 0) {
      signers = state.utxo.signers.map((m) => {
        let user = state.users[m];
        if (!user) {
          return "";
        }
        return (
          <img className={ styles.user } src={ user.avatar_url } alt={ user.full_name } key={ user.user_id } />
        );
      });
    }

    let receivers;
    if (state.utxo.receivers && state.utxo.receivers.length > 0) {
      receivers = state.utxo.receivers.map((m) => {
        let user = state.users[m];
        if (!user) {
          return "";
        }
        return (
          <img className={ styles.user } src={ user.avatar_url } alt={ user.full_name } key={ user.user_id } />
        );
      });
    }

    let sendRawTransactionButton = (
      <button onClick={ this.sendRawTransaction } className={ `submit` }>
        { i18n.t("transfer.detail.send") }
      </button>
    );

    return (
      <div className={ styles.show }
        style={{ backgroundImage: `url(${background})` }}
      >
        <Header to='/' name={ i18n.t('transfer.header.show') } />

        <div className={styles.info}>
          <AssetIcon asset={state.asset} />
          <div className={styles.balance}>
            { state.utxo.state === "unspent" ? "+" : "-" }
            {state.utxo.amount}
            <span>{state.asset.symbol}</span>
          </div>
          <div className={styles.value}>≈ ${state.asset.value}</div>
        </div>
        <div className={ styles.detail }>
          <div className={ styles.group }>
            <div className={ styles.title }>
              { i18n.t("transfer.detail.transaction_id") }
            </div>
            { state.utxo.utxo_id }
          </div>
          <div className={ styles.group }>
            <div className={ styles.title }>
              { i18n.t("transfer.detail.asset_type") }
            </div>
            { state.asset.name }
          </div>
          <div className={ styles.group }>
            <div className={ styles.title }>
              { i18n.t("transfer.detail.state") }
            </div>
            { state.utxo.state }
          </div>
          <div className={ styles.group }>
            <div className={ styles.title }>
              { i18n.t("transfer.detail.threshold") }
            </div>
            { state.utxo.threshold }
          </div>
          <div className={ styles.group }>
            <div className={ styles.title }>
              { i18n.t("transfer.detail.members") }
            </div>
            { members }
          </div>
          {
            state.utxo.state === "signed" && (
              <div className={ styles.group }>
                <div className={ styles.title }>
                  { i18n.t("transfer.detail.receivers") }
                </div>
                { receivers }
              </div>
            )
          }
          {
            state.utxo.state === "signed" && (
              <div className={ styles.group }>
                <div className={ styles.title }>
                  { i18n.t("transfer.detail.signers") }
                </div>
                { signers }
              </div>
            )
          }
          <div className={ styles.group }>
            <div className={ styles.title }>
              { i18n.t("transfer.detail.memo") }
            </div>
            { state.utxo.memo }
          </div>
          <div className={ styles.group }>
            <div className={ styles.title }>
              { i18n.t("transfer.detail.time") }
            </div>
            { state.utxo.updated_at }
          </div>
          <div className={ styles.action }>
            { state.utxo.state === "signed" && state.utxo.signers.length >= state.utxo.threshold && sendRawTransactionButton }
          </div>
        </div>
      </div>
    );
  }
}

export default Show;
