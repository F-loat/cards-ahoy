import { useEffect } from 'react';
import Taro, { useLaunch } from '@tarojs/taro';
import { setGlobalData } from './utils/data';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import 'windi.css';
import './app.less';

dayjs.locale('zh-cn');
dayjs.extend(relativeTime);

function App(props) {
  const updateGlobalData = (res) => {
    try {
      const data = JSON.parse(res.fetchedData);
      setGlobalData('openid', data?.openid);
      setGlobalData('notice', data?.notice);
      setGlobalData('banners', data?.banners);
      setGlobalData('plan', data?.plan);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    Taro.cloud.init({
      env: 'cards-ahoy-3g50hglqe5f630e4',
    });
  }, []);

  useLaunch(() => {
    Taro.getBackgroundFetchData({
      fetchType: 'pre',
    })
      .then(updateGlobalData)
      .catch(() => Taro.onBackgroundFetchData(updateGlobalData));
  });

  return props.children;
}

export default App;
