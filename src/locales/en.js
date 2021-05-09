const global = {
  loading: "Loading...",
};

const home = {
  home: {
    header: {
      title: "Multisig Wallet (%{text})",
    },
    assets: "Assets",
    modal: {
      title: "Assets Management",
      search_placeholder: "Name, Symbol",
    },
  },
};

const asset = {
  asset: {
    header: {
      title: "Asset Info"
    },
    action: {
      send: "Send",
      receive: "Receive",
    },
    blank: "NO TRANSACTION",
    memo: "TRANSACTION",
    transactions: "Transactions",
    signed: "Transaction is processing",
    modal: {
      title: "Send To",
      wallet: "Transfer from wallet",
      recipient: "Pay by others",
    },
    contacts: {
      title: "Send to friends",
      search_placeholder: "Mixin ID, Name",
    },
  },
};

const transfer = {
  transfer: {
    header: {
      recipient: "Create Recipient Card",
      transfer: "Transfer from Wallet",
      withdrawal: "Withdrawal to %{name}",
      show: "Transaction",
    },
    balance: "BALANCE",
    amount: "Amount",
    memo: "Memo",
    forward: "Send to others",
    pay: "Generate & pay",
    withdrawal: "Withdrawal",
    card: {
      title: "Multisig Payment",
      description: "From %{body}",
      icon_url:
      "https://mixin-images.zeromesh.net/rl_7ufE4eezlZDDjsGz9apzvoa7ULeZLlyixbN04iiaGFng8JL9UtQVZwzHw4Bsh2_7m5WHVPwtWkLKOydGZ4Q=s256", // TODO
    },
    detail: {
      transaction_id: "Transaction ID",
      asset_type: "Asset Type",
      state: "UTXO state",
      threshold: "Threshold",
      members: "Members",
      receivers: "Receivers",
      signers: "Signers",
      memo: "Memo",
      time: "Updated At",
      send: "Submit the Transaction",
    },
  },
};

const guide = {
  guide: {
    title: "Multisig Wallet",
    text : `
  <li>Create a group with and only with the signers.</li>
  <li>Append <strong>^T</strong> to the end of the group name.<em><b>T</b> is the threshold of signers.</em></li>
  <li>Invite me to the group and open me from there.</li>
  `,
  }
};

const locale = {
  ...global,
  ...home,
  ...guide,
  ...asset,
  ...transfer,
};

export default locale;
