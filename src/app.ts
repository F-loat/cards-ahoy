import { useEffect } from 'react';
import Taro from '@tarojs/taro';
import 'windi.css';
import './app.less';

function App(props) {
  useEffect(() => {
    Taro.cloud.init({
      env: 'cloud1-3gwdxekw0ddeddde',
    });
  }, []);

  return props.children;
}

export default App;
