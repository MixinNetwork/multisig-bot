import styles from "./index.module.scss";
import React, { Component } from "react";
import { Redirect } from "react-router-dom";
import Decimal from "decimal.js";
import mixin from "bot-api-js-client";
import {Base64} from 'js-base64';

import {
  ApiGetAsset,
  ApiGetChains,
  ApiGetMultisigsOutputs,
  ApiGetConversation,
  ApiPostUsersFetch,
  ApiPostGhostKeys,
  ApiPostMultisigsRequests,
  ApiGetCode,
} from "../api";
import util from "../api/util.js";
import Header from "../components/header.js";
import AssetIcon from "../components/cover.js";
import Loading from "../components/loading.js";
import background from "../statics/images/bg.png";
import { ReactComponent as AmountIcon } from "../statics/images/ic_amount.svg";

class Withdrawal extends Component {
  constructor(props) {
    super(props);

    this.state = {
      assetId: props.match.params.id,
      userId: props.match.params.user_id,
      conversation: {},
      asset: {},
      outputs: [],
      user: {},
      amount: "",
      value: 0,
      memo: "",
      loading: true,
      submit: "prepare", // prepare, ready, submitting
      back: false,
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

      let ready = value !== "" && (new Decimal(value)).gt(new Decimal("0")) && (new Decimal(value)).lt(new Decimal(this.state.asset.balance));
      if (this.state.submit !== "submitting") {
        state["submit"] = ready ? "ready" : "prepare";
      }
    }
    this.setState(state);
  }

  toHex(s) {
    if (typeof(s) !== 'string') {
      return '';
    }
    s = unescape(encodeURIComponent(s))
    let h = ''
    for (var i = 0; i < s.length; i++) {
      h += s.charCodeAt(i).toString(16)
    }
    return h
  }

  buildThresholdScript (t) {
    var s = t.toString(16);
    if (s.length === 1) {
      s = '0' + s;
    }
    if (s.length > 2) {
      alert('INVALID THRESHOLD ' + t);
    }
    return 'fffe' + s;
  }

  handleSubmit = () => {
    if (this.state.submit !== "ready") {
      return;
    }
    this.submit();
  }

  async submit() {
    let inputAmount = new Decimal(0);
    let amount = new Decimal(this.state.amount);
    let tx = {
      version: 2,
      asset: this.state.asset.mixin_id,
      inputs: [],
      outputs: [],
      extra: this.toHex(this.state.memo),
    }
    for (let i in this.state.outputs) {
      let utxo = this.state.outputs[i];
      inputAmount = inputAmount.add(new Decimal(utxo.amount));
      tx.inputs.push({
        hash: utxo.transaction_hash,
        index: utxo.output_index
      });
      if (inputAmount.cmp(amount) >= 0) {
        break;
      }
    }
    if (inputAmount.cmp(amount) < 0) {
      alert('TOO MUCH');
      return;
    }
    let receivers = await this.loadGhostKeys([this.state.userId], 0);
    let output = {
      mask: receivers.mask,
      keys: receivers.keys,
    };
    output.amount = amount.toString();
    output.script = this.buildThresholdScript(1);
    tx.outputs.push(output);
    if (inputAmount.cmp(amount) > 0) {
      let utxo = this.state.outputs[0];
      let members = await this.loadGhostKeys(utxo.members, 1);
      output = {
        mask: members.mask,
        keys: members.keys,
      };
      output.amount = inputAmount.sub(amount).toString();
      output.script = this.buildThresholdScript(utxo.threshold);
      tx.outputs.push(output)
    }
    console.log(JSON.stringify(tx));
    let raw = window.mixinGo.buildTransaction(JSON.stringify(tx));
    console.log(raw);
    ApiPostMultisigsRequests("sign", raw).then((resp) => {
      if (resp.error) {
        return;
      }
      let text = `https://mixin.one/codes/${resp.data.code_id}`;
      console.log(text);
      window.open('mixin://codes/' + resp.data.code_id);
      this.loadCode(resp.data.code_id);
    });
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async loadCode(codeId) {
    let code = await ApiGetCode(codeId);
    if (code.data && code.data.state === "signed") {
      let description = window.i18n.t("transfer.card.withdrawal", {
        amount: "",
        symbol: "",
        user: "",
      });
      let text = `https://multisig.mixin.zone/assets/${this.state.assetId}`;
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

      this.setState({ back: true });
      return;
    }
    await this.sleep(1000);
    return this.loadCode(codeId);
  }

  async loadGhostKeys(ids, index) {
    let keys = await ApiPostGhostKeys(ids, index);
    if (keys.data) {
      return keys.data;
    }
    return this.loadGhostKeys(ids, index);
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

  async loadMultisigsOutputs(participants, threshold, offset, utxo) {
    let outputs = await ApiGetMultisigsOutputs(
      participants,
      threshold,
      "unspent",
      offset,
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

  async loadUsers() {
    let user = await ApiPostUsersFetch([this.state.userId]);
    if (user.data) {
      return user.data;
    }
    return this.loadUsers();
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
    let outputs = await that.loadMultisigsOutputs(
      participants,
      util.parseThreshold(conversation.name),
      "",
      []
    );
    let balance = outputs.reduce((a, c) => {
      if (c.asset_id === that.state.assetId && c.state === "unspent") {
        return a.plus(c.amount);
      }
      return a;
    }, new Decimal("0"));
    let chains = await that.loadChains();
    let asset = await that.loadAsset();
    asset.balance = balance.toFixed();
    asset.chain = chains[asset.chain_id];
    let users = await that.loadUsers();
    if (users.length < 1) {
      return
    }
    this.setState({
      conversation: conversation,
      asset: asset,
      outputs: outputs,
      user: users[0],
      loading: false,
    });
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

    if (state.back) {
      return <Redirect to={ `/assets/${state.assetId}` } />;
    }

    return (
      <div
        className={ styles.withdrawal }
        style={{ backgroundImage: `url(${background})` }}
      >
        <Header to='/' name={ i18n.t('transfer.header.withdrawal', { name: state.user.full_name.trim().slice(0, 18) }) } />
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
          <div className={ styles.action }>
            <button
              onClick={ this.handleSubmit }
              className={`submit ${state.submit}`}
            >
              { i18n.t("transfer.withdrawal") }
            </button>
          </div>
        </main>
      </div>
    );
  }
}

export default Withdrawal;
