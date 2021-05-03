import styles from "./index.module.scss";

function AssetIcon(props) {
  let asset = props.asset;

  return (
    <div className={styles.icon}>
      <img src={asset.icon_url} className={styles.asset} alt={asset.name} />
      <img
        src={asset.chain.icon_url}
        className={styles.chain}
        alt={asset.chain.name}
      />
    </div>
  );
}

export default AssetIcon;
