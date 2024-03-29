import styles from "./index.module.scss"; // styles is create-react-app
import React, { Component } from "react";
import Decimal from "decimal.js";
import mixin from "bot-api-js-client";
import { Link, Redirect } from "react-router-dom";

import {
  ApiGetChains,
  ApiGetConversation,
  ApiGetMultisigsOutputs,
  ApiGetAsset,
} from "../api";
import util from "../api/util.js";
import storage from "../api/storage.js";
import AssetIcon from "../components/cover.js";
import Header from "../components/header.js";
import Loading from "../components/loading.js";
import background from "../statics/images/bg_texture.png";
import { ReactComponent as SettingIcon } from "../statics/images/ic_setting.svg";
import Modal from "./modal.js";


class Index extends Component {
  constructor(props) {
    super(props);

    this.state = {
      balanceBTC: 0,
      balanceUSD: 0,
      assets: [],
      participantsCount: 0,
      threshold: 0,
      modal: false,
      loading: true,
      guide: false,
    };
  }

  handleModal = (b) => {
    this.setState({ modal: b });
  }

  async loadFullData() {
    let conversation = await this.loadConversation();
    let threshold = util.parseThreshold(conversation.name);
    if (
      !conversation ||
      conversation.category !== "GROUP" ||
      threshold < 1 ||
      conversation.participants.length < 3
    ) {
      this.setState({
        loading: false,
        guide: true,
      });
      return;
    }
    let participantIds = [];
    conversation.participants.forEach((p) => {
      // skip current and old multisig bot
      if (
        process.env.REACT_APP_CLIENT_ID !== p.user_id &&
        "37e040ec-df91-47a7-982e-0e118932fa8b" !== p.user_id // development bot id
      ) {
        participantIds.push(p.user_id);
      }
    });
    this.setState({
      participantsCount: participantIds.length,
      threshold: threshold,
      loading: false,
    });

    // multisig output assets will always display
    Promise.all([
      this.loadMultisigsOutputs(
        participantIds,
        threshold,
        "unspent",
        "",
        []
      ),
      this.loadMultisigsOutputs(
        participantIds,
        threshold,
        "signed",
        "",
        []
      ),
      this.loadChains()
    ]).then((values) => {
      let outputs = values[0];
      let signed = values[1];
      let chains = values[2];

      outputs.push(...signed);
      let outputSet = {};
      let assetSet = storage.getSelectedAssets();
      let assetStateSet = {};
      outputs.forEach(output => {
        if (outputSet[output.utxo_id]) {
          return;
        }
        if (!assetSet[output.asset_id]) {
          assetSet[output.asset_id] = 0;
        }
        assetSet[output.asset_id] = new Decimal(
          assetSet[output.asset_id]
        ).plus(output.amount);
        if (output.state === "signed") {
          assetStateSet[output.asset_id] = output.state;
        }
        outputSet[output.utxo_id] = true;
      });

      let assetIds = Object.keys(assetSet);
      this.loadAssets(assetIds, 0, []).then(assets => {
        let balanceBTC = this.state.balanceBTC;
        let balanceUSD = this.state.balanceUSD;
        for (let i = 0; i < assets.length; i++) {
          assets[i].state = assetStateSet[assets[i].asset_id] || "unspent";
          assets[i].balance = new Decimal(assetSet[assets[i].asset_id]).toFixed();
          assets[i].value = new Decimal(
            new Decimal(assets[i].balance).times(assets[i].price_usd).toFixed(8)
          ).toFixed();
          assets[i].change_usd = new Decimal(assets[i].change_usd).toFixed(2);
          assets[i].price_usd = new Decimal(assets[i].price_usd).toFixed();
          if (new Decimal(assets[i].price_usd).cmp(1) > 0) {
            assets[i].price_usd = new Decimal(
              new Decimal(assets[i].price_usd).toFixed(2)
            ).toFixed();
          }
          if (!chains[assets[i].chain_id]) {
            this.loadChains(true);
          }
          assets[i].chain = chains[assets[i].chain_id];
          balanceBTC = new Decimal(assets[i].balance)
            .times(assets[i].price_btc)
            .plus(balanceBTC);
          balanceUSD = new Decimal(assets[i].value).plus(balanceUSD);
        }
        balanceBTC = balanceBTC.toFixed(8);
        balanceBTC = new Decimal(balanceBTC).toFixed();
        balanceUSD = balanceUSD.toFixed(2);
        balanceUSD = new Decimal(balanceUSD).toFixed();
        assets = assets.sort((a, b) => {
          let value = new Decimal(a.value).cmp(b.value);
          if (value !== 0) {
            return -value;
          }
          let balance = new Decimal(a.balance).cmp(b.balance);
          if (balance !== 0) {
            return -balance;
          }
          return -new Decimal(a.price_usd).cmp(b.price_usd);
        });
        this.setState({
          balanceBTC: balanceBTC,
          balanceUSD: balanceUSD,
          assets: assets,
          participantsCount: participantIds.length,
          threshold: threshold,
          loading: false,
        });
      });
    });
  }

  async loadConversation() {
    let conversation = await ApiGetConversation(mixin.util.conversationId());
    if (conversation.data) {
      return conversation.data;
    }
    if (conversation.error.code === 404) {
      return;
    }
    return this.loadConversation();
  }

  async loadMultisigsOutputs(participants, threshold, state, offset, utxo) {
    let outputs = await ApiGetMultisigsOutputs(
      participants,
      threshold,
      state,
      offset,
    );
    if (outputs.data) {
      utxo.push(...outputs.data);
      if (outputs.data.length < 500) {
        return utxo;
      }
      let output = outputs.data[outputs.data.length - 1];
      if (output) {
        offset = output.updated_at;
      }
    }
    this.loadMultisigsOutputs(participants, threshold, offset, utxo);
  }

  async loadChains(force=false) {
    let chains = await ApiGetChains(force);
    if (!chains.error) {
      return chains;
    }
    return this.loadChains();
  }

  async loadAssets(ids, offset, output) {
    if (ids.length === offset) {
      return output;
    }
    let asset = await ApiGetAsset(ids[offset]);
    if (asset.data) {
      output.push(asset.data);
      offset += 1;
    }
    return this.loadAssets(ids, offset, output);
  }

  componentDidMount() {
    this.loadFullData();
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.modal && !this.state.modal) {
      this.loadFullData();
    }
  }

  render() {
    let t = window.i18n.tt();
    let state = this.state;

    if (state.loading) {
      return <Loading />;
    }

    if (state.guide) {
      return <Redirect to="/guide" />;
    }

    let assets = state.assets.map((asset) => {
      return (
        <li key={asset.asset_id}>
          <Link className={styles.item} to={`/assets/${asset.asset_id}`}>
            <AssetIcon asset={asset} />
            <div className={styles.info}>
              {asset.balance} {asset.symbol}
              { asset.state === 'signed' && <span> (OTW) </span> }
              <div className={styles.price}>≈ ${asset.value}</div>
            </div>
            <div className={styles.value}>
              <div
                className={
                  asset.change_usd.indexOf("-") >= 0 ? styles.red : styles.green
                }
              >
                {asset.change_usd}%
              </div>
              <div className={styles.price}>${asset.price_usd}</div>
            </div>
          </Link>
        </li>
      );
    });

    return (
      <div
        className={styles.home}
        style={{ backgroundImage: `url(${background})` }}
      >
        <Header to="/" icon="disable" name={t('home.header.title', { text: `${state.threshold}/${state.participantsCount}`})} />
        <div className={styles.balance}>
          <div className={styles.btc}>
            {state.balanceBTC} <span>BTC</span>
          </div>
          <div className={styles.usd}>≈ ${state.balanceUSD}</div>
        </div>
        <div className={styles.main}>
          <header>
            <div className={styles.title}>{t("home.assets")}</div>
            <SettingIcon onClick={() => this.handleModal(true)} />
          </header>
          <main>
            {state.assets.length === 0 && <div className={styles.loading}>
              {t("loading")}
            </div>}
            {state.assets.length > 0 && <ul>{assets}</ul>}
          </main>
        </div>
        {state.modal && <Modal handleModal={this.handleModal} />}
      </div>
    );
  }
}

export default Index;
