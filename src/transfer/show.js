import styles from "./show.module.scss";
import Decimal from "decimal.js";

import {
  ApiGetAsset,
  ApiGetChains,
  ApiPostUsersFetch,
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

  async loadFullData() {
    let chains = await this.loadChains();
    let asset = await this.loadAsset();
    asset.chain = chains[asset.chain_id];
    asset.value = new Decimal(
      new Decimal(this.state.utxo.amount).times(asset.price_usd).toFixed(8)
    ).toFixed();
    let memberIds = [...this.state.utxo.members];
    memberIds.push(this.state.utxo.user_id);
    memberIds.push(this.state.utxo.sender);
    let users = await this.loadUsers(memberIds);
    let usersMap = {};
    for (let i in users) {
      usersMap[users[i].user_id] = users[i];
    }
    this.setState({ asset: asset, users: usersMap, loading: false });
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
          <div className={ styles.group }>
            <div className={ styles.title }>
              { i18n.t("transfer.detail.signers") }
            </div>
            { state.utxo.utxo_id }
          </div>
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
        </div>
      </div>
    );
  }
}

export default Show;
