import styles from "./contacts.module.scss";
import React, { useState, useEffect } from "react";

import { ApiGetFriends } from "../api";
import { ReactComponent as CloseIcon } from "../statics/images/ic_close.svg";
import { ReactComponent as SearchIcon } from "../statics/images/ic_search.svg";

function Contacts(props) {
  const i18n = window.i18n;

  const [text, setText] = useState("");
  const [contacts, setContacts] = useState([]);

  useEffect(() => {
    ApiGetFriends().then((resp) => {
      if (resp.error) {
        return;
      }

      setContacts(resp.data);
    });
  });

  function filteredContacts() {
    let search = text.toLowerCase();
    if (search.length > 0) {
      let filtered = contacts.filter((contact) => {
        return `${contact.identity_number}` === search;
      });
      if (filtered <= 0) {
        filtered = contacts.filter((contact) => {
          return contact.full_name.toLowerCase() === search;
        });
      }
      if (filtered <= 0) {
        filtered = contacts.filter((contact) => {
          return `${contact.identity_number}`.includes(search);
        });
      }
      if (filtered <= 0) {
        filtered = contacts.filter((contact) => {
          return contact.full_name.toLowerCase().includes(search);
        });
      }
      return filtered;
    }
    return contacts;
  }

  let contactList = filteredContacts().map((contact) => {
    let avatar =
      contact.avatar_url.length > 0 ? (
        <img
          src={contact.avatar_url}
          className={styles.avatar}
          alt={contact.full_name}
        />
      ) : (
        <div className={styles.avatar}> {contact.full_name.slice(0, 1)} </div>
      );
    return (
      <li className={styles.item} key={contact.user_id}>
        {avatar}
        <div className={styles.info}>
          {contact.full_name}
          <div className={styles.id}>{contact.identity_number}</div>
        </div>
      </li>
    );
  });

  return (
    <div className={styles.contacts}>
      <div className={styles.container}>
        <header>
          <div className={styles.title}>{i18n.t("asset.contacts.title")}</div>
          <CloseIcon
            onClick={() => {
              props.handleSend(false);
            }}
          />
        </header>
        <div className={styles.search}>
          <SearchIcon />
          <input
            name="text"
            placeholder={i18n.t("asset.contacts.search_placeholder")}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>
        <main>
          <ul>{contactList}</ul>
        </main>
      </div>
    </div>
  );
}

export default Contacts;
