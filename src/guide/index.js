import styles from './index.module.scss';
import { ReactComponent as Guide } from '../statics/images/ic_guide.svg';

function Index() {
  const i18n = window.i18n;

  return (
    <div className={ styles.guide }>
      <Guide className={ styles.icon } />
      <ul className={ styles.body } dangerouslySetInnerHTML={{__html: i18n.t('guide')}}></ul>
    </div>
  );
}

export default Index;
