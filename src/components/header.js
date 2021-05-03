import styles from "./index.module.scss";
import { Link } from "react-router-dom";

import { ReactComponent as LeftIcon } from "../statics/images/ic_left.svg";

function Header(props) {
  const i18n = window.i18n;

  return (
    <Link to={ props.to } className={ styles.header }>
      { props.icon !== "disable" && <LeftIcon /> }
      <div>{ i18n.t(props.name) }</div>
    </Link>
  );
}

export default Header;
