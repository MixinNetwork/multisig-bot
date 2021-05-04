import styles from "./index.module.scss";

import Header from "../components/header.js";
import { ReactComponent as GuideIcon } from "../statics/images/ic_guide.svg";

function Index() {
  const i18n = window.i18n;

  return (
    <div className={styles.guide}>
      <Header to='/guide' icon="disable" color="black" name={ i18n.t("guide.title") } />
      <main>
        <GuideIcon className={styles.icon} />
        <ul
          className={styles.body}
          dangerouslySetInnerHTML={{ __html: i18n.t("guide.text") }}
        ></ul>
      </main>
    </div>
  );
}

export default Index;
