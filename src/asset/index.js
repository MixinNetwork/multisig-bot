import styles from "./index.module.scss";
import React, { Component } from "react";
import Decimal from "decimal.js";
import mixin from "bot-api-js-client";
import { Link } from "react-router-dom";

import {
  ApiGetAsset,
  ApiGetChains,
  ApiGetMultisigsOutputs,
  ApiGetConversation,
} from "../api";
import util from "../api/util.js";
import Header from "../components/header.js";
import AssetIcon from "../components/cover.js";
import Loading from "../components/loading.js";
import Modal from "./modal.js";
import Contacts from "./contacts.js";
import background from "../statics/images/bg.png";
import { ReactComponent as TransactionIcon } from "../statics/images/ic_transaction.svg";

class Index extends Component {
  constructor(props) {
    super(props);

    this.state = {
      assetId: props.match.params.id,
      asset: {},
      outputs: [],
      receive: false,
      send: false,
      loading: true,
    };

    this.handleReceive = this.handleReceive.bind(this);
    this.handleSend = this.handleSend.bind(this);
  }

  handleReceive(b) {
    this.setState({ receive: b });
  }

  handleSend(b) {
    this.setState({ send: b });
  }

  async loadConversation() {
    let conversation = await ApiGetConversation(mixin.util.conversationId());
    if (conversation.data) {
      return conversation.data;
    }
    if (conversation.error.code === 404) {
      return; // TODO should handle 404
    }
    return this.loadConversation();
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

  async loadMultisigsOutputs(participants, threshold, offset, utxo) {
    let outputs = await ApiGetMultisigsOutputs(
      participants,
      threshold,
      "",
      offset
    );
    if (outputs.data) {
      utxo.push(...outputs.data);
      if (outputs.data.length < 500) {
        return utxo;
      }
      let output = outputs.data[outputs.data.length - 1];
      if (output) {
        offset = output.created_at;
      }
    }
    this.loadMultisigsOutputs(participants, threshold, offset, utxo);
  }

  async loadFullData() {
    let that = this;
    let conversation = await that.loadConversation();
    let participants = [];
    conversation.participants.forEach((p) => {
      if (
        process.env.REACT_APP_CLIENT_ID !== p.user_id &&
        "37e040ec-df91-47a7-982e-0e118932fa8b" !== p.user_id
      ) {
        participants.push(p.user_id);
      }
    });
    console.log(conversation.participants, participants,
      process.env)
    let transactions = [];
    let outputs = await that.loadMultisigsOutputs(
      participants,
      util.parseThreshold(conversation.name),
      "",
      []
    );
    let balance = outputs.reduce((a, c) => {
      if (c.asset_id === that.state.assetId) {
        if (transactions.length < 500) {
          transactions.push(c); // Only list latest 500 transactions
        }
        if (c.state === "unspent") {
          return a.plus(c.amount);
        }
      }
      return a;
    }, new Decimal("0"));
    let chains = await that.loadChains();
    let asset = await that.loadAsset();
    asset.balance = balance.toFixed();
    asset.value = new Decimal(
      balance.times(asset.price_usd).toFixed(8)
    ).toFixed();
    asset.chain = chains[asset.chain_id];
    this.setState({ asset: asset, outputs: transactions, loading: false });
  }

  componentDidMount() {
    this.loadFullData();
  }

  render() {
    const i18n = window.i18n;
    let state = this.state;

    if (state.loading) {
      return <Loading />;
    }

    let blank = (
      <div className={styles.blank}>
        <TransactionIcon />
        <div className={styles.text}>{i18n.t("asset.blank")}</div>
      </div>
    );

    let hint = 100;
    let transactionList = state.outputs.sort((a, b) => {
      if ((new Date(a.updated_at)) > (new Date(b.updated_at))) {
        return -1;
      }
      if ((new Date(a.updated_at)) < (new Date(b.updated_at))) {
        return 1;
      }
      return 0;
    }).map((o) => {
      let created = new Date(o.updated_at);
      let divide = hint !== created.getDate();
      let style = o.state === "unspent" ? "green" : "red";
      hint = created.getDate();
      return (
        <li key={o.utxo_id}>
          {divide && (
            <div className={styles.hint}>
              {`${
                created.getMonth() + 1
              }/${created.getDate()}/${created.getFullYear()}`}
            </div>
          )}
          <Link to={{ pathname: "/transfer", utxo: o }} >
            <div className={`${styles.item} ${styles[o.state]}`}>
              <div className={styles.memo }>
                <div>{o.memo || i18n.t("asset.memo")}</div>
                { o.state === "signed" && <div className={ styles.state }>{ i18n.t("asset.signed") }</div> }
              </div>
              <div className={ `${styles.amount} ${ style }`} >
                { o.state === "unspent" ? "+" : "-" }
                { o.amount }
              </div>
              <div className={styles.symbol}>{state.asset.symbol}</div>
            </div>
          </Link>
        </li>
      );
    });

    let transactions = (
      <div className={styles.transactions}>
        <header> {i18n.t("asset.transactions")} </header>
        <ul>{transactionList}</ul>
      </div>
    );

    return (
      <div
        className={styles.asset}
        style={{ backgroundImage: `url(${background})` }}
      >
        <Header to='/' name={ i18n.t('asset.header.title') } />
        <div className={styles.info}>
          <AssetIcon asset={state.asset} />
          <div className={styles.balance}>
            {state.asset.balance} <span>{state.asset.symbol}</span>
          </div>
          <div className={styles.value}>≈ ${state.asset.value}</div>
          <div className={styles.actions}>
            <div onClick={() => this.handleSend(true)}>
              {i18n.t("asset.action.send")}
            </div>
            <div className={styles.divide}></div>
            <div onClick={() => this.handleReceive(true)}>
              {i18n.t("asset.action.receive")}
            </div>
          </div>
        </div>
        {state.outputs.length === 0 && blank}
        {state.outputs.length > 0 && transactions}
        {state.receive && (
          <Modal asset={state.asset} handleReceive={this.handleReceive} />
        )}
        {state.send && (
          <Contacts asset={state.asset} handleSend={this.handleSend} />
        )}
      </div>
    );
  }
}

export default Index;
