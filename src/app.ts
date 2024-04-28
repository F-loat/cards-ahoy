import { useEffect } from 'react';
import Taro from '@tarojs/taro';
import { useLaunch } from '@tarojs/taro';
import { setGlobalData } from './utils';
import 'windi.css';
import './app.less';

function App(props) {
  const updateGlobalData = (res) => {
    try {
      const data = JSON.parse(res.fetchedData);
      setGlobalData('openid', data?.openid);
      setGlobalData('notice', data?.notice);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    Taro.cloud.init({
      env: 'cloud1-3gwdxekw0ddeddde',
    });
  }, []);

  useLaunch(() => {
    Taro.onBackgroundFetchData(updateGlobalData);
    Taro.getBackgroundFetchData({
      fetchType: 'pre',
      success: updateGlobalData,
    });
  });

  return props.children;
}

export default App;
