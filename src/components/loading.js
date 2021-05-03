import styles from "./index.module.scss";

import { ReactComponent as LoadingSpin } from "../statics/images/loading_spin.svg";

function Loading() {
  const i18n = window.i18n;

  return (
    <div className={styles.loading}>
      <LoadingSpin />
      <div className={styles.text}>{i18n.t("loading")}</div>
    </div>
  );
}

export default Loading;
