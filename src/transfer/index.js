import styles from "./index.module.scss";
import React, { Component } from "react";
import { Redirect } from "react-router-dom";
import Decimal from "decimal.js";
import mixin from "bot-api-js-client";
import { v4 as uuidv4 } from "uuid";
import {Base64} from 'js-base64';

import {
  ApiGetAsset,
  ApiGetChains,
  ApiGetConversation,
  ApiPostPayments,
  ApiGetCode,
} from "../api";
import util from "../api/util.js";
import Header from "../components/header.js";
import AssetIcon from "../components/cover.js";
import Loading from "../components/loading.js";
import background from "../statics/images/bg.png";
import { ReactComponent as AmountIcon } from "../statics/images/ic_amount.svg";

/*
 * Transfer in from wallet
 * Pay by others
 */
class Index extends Component {
  constructor(props) {
    super(props);

    const type = props.location.pathname.includes("transfer")
      ? "transfer"
      : "recipient";

    this.state = {
      assetId: props.match.params.id,
      conversation: {},
      asset: {},
      amount: "",
      value: 0,
      memo: "",
      type: type,
      loading: true,
      home: false,
    };
  }

  handleChange = (e) => {
    const { name, value } = e.target;
    let state = { [name]: value };
    if (name === "amount") {
      let val = value || "0";
      let v = new Decimal(
        new Decimal(val).times(this.state.asset.price_usd).toFixed(8)
      ).toFixed();
      state["value"] = v;
    }
    this.setState(state);
  }

  handleSubmit = () => {
    let participantIds = [];
    this.state.conversation.participants.forEach((p) => {
      // skip current and old multisig bot
      if (
        process.env.REACT_APP_CLIENT_ID !== p.user_id &&
        "37e040ec-df91-47a7-982e-0e118932fa8b" !== p.user_id
      ) {
        participantIds.push(p.user_id);
      }
    });
    let params = {
      asset_id: this.state.asset.asset_id,
      amount: this.state.amount,
      trace_id: uuidv4(),
      memo: this.state.memo || "",
      opponent_multisig: {
        receivers: participantIds,
        threshold: util.parseThreshold(this.state.conversation.name),
      },
    };
    if (params.memo.trim().length === 0) {
      params.memo = this.state.type === "transfer" ? window.i18n.t("transfer.default.memo.transfer") : window.i18n.t("transfer.default.memo.recipient");
    }
    ApiPostPayments(params).then((resp) => {
      if (resp.error) {
        return;
      }

      let text = `https://mixin.one/codes/${resp.data.code_id}`;
      console.log(text);
      if (this.state.type === "transfer") {
        window.open(text);
        this.loadCode(resp.data.code_id);
        return;
      }

      let description = window.i18n.t("transfer.card.description", {
        body: this.state.conversation.name,
      });

      let data = `{
      "action": "${text}",
      "app_id": "${process.env.REACT_APP_CLIENT_ID}",
      "icon_url": "https://mixin-images.zeromesh.net/TZ04DRR2tAb7UTHYSzGW_ygMjXpHJnfQvSASFA7jC_biVLCqJBsucuNDg09jKL3nuMQPt6ZmUOabsN-ORnWit4Ml7QEpR9E0HTl1qQ=s256",
      "description": "${description.slice(0, 128)}",
      "title": "${window.i18n.t("transfer.card.title")}"
      }`;
      window.open(
        "mixin://send?category=app_card&data=" + encodeURIComponent(Base64.encode(data))
      );
      this.setState({ home: true });
    });
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async loadCode(codeId) {
    let code = await ApiGetCode(codeId);
    if (code.data && code.data.status === "paid") {
      this.setState({ home: true });
    }
    await this.sleep(1000);
    return this.loadCode(codeId);
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
      return <Loading />;
    }

    if (state.home) {
      return <Redirect to="/" />;
    }

    let ready = state.amount !== "" && (new Decimal(state.amount)).gt(new Decimal("0"));
    let transfer = (
      <button
        onClick={this.handleSubmit}
        className={`submit ${ ready } ${state.submitting}`}
      >
        {i18n.t("transfer.pay")}
      </button>
    );

    let recipient = (
      <button
        onClick={this.handleSubmit}
        className={`submit ${ ready } ${state.submitting}`}
      >
        {i18n.t("transfer.forward")}
      </button>
    );

    return (
      <div
        className={styles.transfer}
        style={{ backgroundImage: `url(${background})` }}
      >
        <Header to='/' name={ i18n.t(`transfer.header.${ state.type }`) } />
        <main>
          <div className={styles.icon}>
            <AssetIcon asset={state.asset} />
          </div>
          <div className={styles.group}>
            {state.asset.symbol}
            <div className={styles.value}>
              {state.asset.balance}
              &nbsp;
              {i18n.t("transfer.balance")}
            </div>
          </div>
          <div className={`${styles.group} ${styles.amount}`}>
            <div className={styles.body}>
              <input
                placeholder={i18n.t("transfer.amount")}
                type="number"
                name="amount"
                min="0"
                value={state.amount}
                onChange={this.handleChange}
              />
              <div className={styles.value}>{state.value} USD</div>
            </div>
            <AmountIcon />
          </div>
          <div className={`${styles.group} ${styles.memo}`}>
            <input
              placeholder={i18n.t("transfer.memo")}
              name="memo"
              value={state.memo}
              onChange={this.handleChange}
            />
          </div>
          <div className={styles.action}>
            {state.type === "transfer" && transfer}
            {state.type === "recipient" && recipient}
          </div>
        </main>
      </div>
    );
  }
}

export default Index;
