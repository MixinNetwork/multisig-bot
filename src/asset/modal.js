import styles from './modal.module.scss';
import { ReactComponent as CloseIcon } from '../statics/images/ic_close.svg';
import { ReactComponent as GreaterIcon } from '../statics/images/ic_greater.svg';
import { ReactComponent as WalletIcon } from '../statics/images/ic_wallet.svg';
import { ReactComponent as LinkIcon } from '../statics/images/ic_link.svg';

function Modal(props) {
  const i18n = window.i18n;

  return (
    <div className={ styles.modal }>
      <div className={ styles.container }>
        <header>
          <div className={ styles.title }>
            { i18n.t('asset.modal.title') }
          </div>
          <CloseIcon onClick={ () => { props.handleModal(false) } } />
        </header>
        <main>
          <div className={ styles.action }>
            <WalletIcon />
            <div className={ styles.text }>
              { i18n.t('asset.modal.wallet') }
            </div>
            <GreaterIcon />
          </div>
          <div className={ styles.action }>
            <LinkIcon />
            <div className={ styles.text }>
              { i18n.t('asset.modal.recipient') }
            </div>
            <GreaterIcon />
          </div>
        </main>
      </div>
    </div>
  );
}

export default Modal;
