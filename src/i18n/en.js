const global = {
  loading: "Loading..."
}

const home = {
  home: {
    assets: "Assets",
    modal: {
      title: "Assets Management",
      search_placeholder: "Name, Symbol"
    }
  },
}

const guide = {
  guide: `<li>Create a group with and only with the signers.</li>
  <li>Append <strong>^T</strong> to the end of the group name.<em><b>T</b> is the threshold of signers.</em></li>
  <li>Invite me to the group and open me from there.</li>`,
}

export default {
  ...global,
  ...home,
  ...guide
}
