import Taro from '@tarojs/taro';
import { useEffect, useState } from 'react';

export interface Notice {
  text?: string;
  copy?: {
    content?: string;
    message?: string;
  };
}

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
      console.log(result);
      setData(result.notice);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runAsync();
  }, []);

  return {
    data,
    loading,
    runAsync,
  };
};
