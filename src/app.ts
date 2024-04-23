import { useEffect } from 'react';
import { useDidShow, useDidHide } from '@tarojs/taro';
import 'windi.css';
import './app.less';
import Taro from '@tarojs/taro';

function App(props) {
  useEffect(() => {
    Taro.cloud.init({
      env: 'cloud1-3gwdxekw0ddeddde',
    });
  }, []);

  // 对应 onShow
  useDidShow(() => {});

  // 对应 onHide
  useDidHide(() => {});

  return props.children;
}

export default App;
