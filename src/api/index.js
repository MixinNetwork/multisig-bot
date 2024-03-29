import mixin from "bot-api-js-client";

import client from "./client";
import storage from "./storage";

export const ApiGetChains = (force) => {
  if (!force) {
    let chains = storage.getChains();
    if (chains) {
      return new Promise((resolve) => {
        resolve(JSON.parse(chains));
      });
    }
  }

  return client.requestByToken("GET", "/network/chains", "").then((resp) => {
    if (resp.error) {
      return resp;
    }

    let chainMap = {};
    resp.data.forEach((chain) => {
      chainMap[chain.chain_id] = chain;
    });
    storage.setChains(chainMap);
    return chainMap;
  });
};

export const ApiGetMultisigAssets = () => {
  return client.requestByToken("GET", "/network/assets/multisig", "");
};
export const ApiGetMe = () => {
  return client.requestByToken("GET", "/me", "", storage.getToken());
};
export const ApiGetFriends = () => {
  return client.requestByToken("GET", "/friends", "", storage.getToken());
};
export const ApiGetAssets = () => {
  return client.requestByToken("GET", "/assets", "", storage.getToken());
};
export const ApiGetAsset = (id) => {
  return client.requestByToken("GET", `/assets/${id}`, "", storage.getToken());
};
export const ApiGetMultisigsOutputs = (ids, threshold, state, offset) => {
  let hash = mixin.util.hashMembers(ids);
  offset = offset || "";
  return client.requestByToken(
    "GET",
    `/multisigs/outputs?members=${hash}&threshold=${threshold}&state=${state}&offset=${offset}`,
    "",
    storage.getToken()
  );
};
export const ApiPostMultisigsRequests = (action, raw) => {
  let params = {
    action: action,
    raw: raw,
  };
  return client.requestByToken(
    "POST",
    "/multisigs/requests",
    params,
    storage.getToken(),
  );
};
export const ApiPostGhostKeys = (ids, index) => {
  let params = {
    receivers: ids,
    index: index,
  };
  return client.requestByToken(
    "POST",
    "/outputs",
    params,
    storage.getToken(),
  );
};
export const ApiGetConversation = (id) => {
  if (process.env.NODE_ENV !== "production") {
    id = process.env.REACT_APP_CONVERSATION_ID;
  }
  return client.requestByToken(
    "GET",
    `/conversations/${id}`,
    "",
    storage.getToken()
  );
};

export const ApiPostAuthenticate = (code) => {
  let clientId = process.env.REACT_APP_CLIENT_ID;
  let params = {
    client_id: clientId,
    code: code,
    code_verifier: storage.getVerifier(),
  };

  return client
    .requestByToken("POST", "/oauth/token", params, "")
    .then((resp) => {
      if (resp.error) {
        return resp;
      }

      if (
        resp.data.scope.indexOf("ASSETS:READ") < 0 ||
        resp.data.scope.indexOf("CONTACTS:READ") < 0
      ) {
        resp.error = { code: 403, description: "Access denied." };
        return resp;
      }

      storage.setToken(resp.data.access_token);
      return resp;
    });
};

export const ApiPostPayments = (params) => {
  return client.requestByToken("POST", "/payments", params, storage.getToken());
};

export const ApiPostUsersFetch = (ids) => {
  return client.requestByToken("POST", "/users/fetch", ids, storage.getToken());
};

export const ApiPostExternalProxy = (raw) => {
  let params = { method: "sendrawtransaction", params: [raw] };
  return client.requestByToken("POST", "/external/proxy", params, storage.getToken());
};

export const ApiGetCode = (id) => {
  return client.requestByToken("GET", `/codes/${id}`, "", storage.getToken());
};
