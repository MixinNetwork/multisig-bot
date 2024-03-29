import mixin from "bot-api-js-client";

class Client {
  request(method, path, data, callback) {
    data = data || "";
    let uid = process.env.REACT_APP_CLIENT_ID;
    let sid = process.env.REACT_APP_SESSION_ID;
    let privateKey = process.env.REACT_APP_PRIVATE_KEY;
    return mixin.client.request(
      uid,
      sid,
      privateKey,
      method,
      path,
      data,
      callback
    ).then((resp) => {
      if (callback) {
        callback(resp.data)
      } else {
        return resp.data
      }
    });
  }

  requestByToken(method, path, data, accessToken, callback) {
    return mixin.client
      .requestByToken(method, path, data, accessToken, callback)
      .then((resp) => {
        return resp.data
      })
      .then((resp) => {
        let consumed = false;
        if (typeof callback === "function") {
          consumed = callback(resp);
        }

        if (!consumed) {
          if (resp && resp.error) {
            let clientId = process.env.REACT_APP_CLIENT_ID;
            switch (resp.error.code) {
              case 401:
                let verifier = mixin.util.challenge();
                window.location.replace(
                  `https://mixin.one/oauth/authorize?client_id=${clientId}&scope=PROFILE:READ+ASSETS:READ+CONTACTS:READ&response_type=code&code_challenge=${verifier}`
                );
                return;
              default:
                break;
            }
          }
        }

        return resp;
      });
  }
}

export default new Client();
