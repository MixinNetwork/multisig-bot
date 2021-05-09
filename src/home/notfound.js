import styles from "./notfound.module.scss";
import { ReactComponent as NotFoundIcon } from "../statics/images/notfound.svg";

function NotFound() {
  const i18n = window.i18n;

  return (
    <div className={ styles.container }>
      <NotFoundIcon />
      <h3 className={ styles.h3 }> { i18n.t("home.notfound.h1") } </h3>
      <h4 className={ styles.h4 }> { i18n.t("home.notfound.h2") } </h4>
    </div>
  )
}

export default NotFound;
