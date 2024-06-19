import Taro from '@tarojs/taro';
import { useEffect, useState } from 'react';
import {
  GlobalData,
  getGlobalData,
  updateGlobalData,
} from '../../../utils/data';

type Notice = GlobalData['notice'];

export const useNotice = () => {
  const [data, setData] = useState<Notice>();
  const [loading, setLoading] = useState(false);

  const runAsync = async () => {
    setLoading(true);
    try {
      const res = await Taro.cloud.callFunction({
        name: 'fetchInitialData',
      });
      const result = res.result as { notice: Notice };
      setData(result.notice);
      updateGlobalData({ fetchedData: JSON.stringify(result) });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (getGlobalData('notice')) {
      setData(getGlobalData('notice') as Notice);
    } else {
      runAsync();
    }
  }, []);

  return {
    data,
    loading,
    runAsync,
  };
};
