const global = {
  loading: "Loading...",
}

const home = {
  home: {
    assets: "Assets",
    modal: {
      title: "Assets Management",
      search_placeholder: "Name, Symbol",
    },
  },
}

const asset = {
  asset: {
    action: {
      send: "Send",
      receive: "Receive"
    },
    blank: "NO TRANSACTION",
    memo: "TRANSACTION",
    transactions: "Transactions",
  },
}

const guide = {
  guide: `
  <li>Create a group with and only with the signers.</li>
  <li>Append <strong>^T</strong> to the end of the group name.<em><b>T</b> is the threshold of signers.</em></li>
  <li>Invite me to the group and open me from there.</li>
  `,
}

const locale = {
  ...global,
  ...home,
  ...guide,
  ...asset,
};

export default locale;
