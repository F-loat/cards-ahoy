import Taro from '@tarojs/taro';
import { useEffect, useState } from 'react';

export const useShowAds = () => {
  const [showAds, setShowAds] = useState(false);

  useEffect(() => {
    Taro.getStorage({ key: 'ad-time' })
      .then(({ data: time }) => {
        setShowAds(!time || time < Date.now() - 1000 * 60 * 60 * 24);
      })
      .catch(() => {
        setShowAds(true);
      });
  }, []);

  return [showAds, setShowAds] as const;
};

export const useTheme = () => {
  const [theme, setTheme] = useState<
    keyof Taro.getSystemInfo.Theme | undefined
  >(undefined);

  useEffect(() => {
    const listener = (res) => {
      setTheme(res.theme);
    };
    Taro.onThemeChange(listener);
    Taro.getSystemInfo().then(listener);
    return () => {
      Taro.offThemeChange(listener);
    };
  }, []);

  return {
    theme,
  };
};

export const useCloudFunction = <T>({
  initialData,
  formatResult = (res) => res,
  cacheKey,
  onSuccess,
  ...options
}: {
  name: string;
  data: Record<string, any>;
  initialData?: T;
  cacheKey?: string;
  formatResult?: (res: any) => any;
  onSuccess?: (data: T) => void;
}) => {
  const [data, setData] = useState<T>(initialData as T);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);

  const run = () => {
    setValidating(true);
    return Taro.cloud
      .callFunction(options)
      .then((res) => {
        const result = formatResult(res.result) as T;
        setData(result);
        onSuccess?.(result);
        if (cacheKey) Taro.setStorage({ key: cacheKey, data: result });
        return result;
      })
      .finally(() => {
        setValidating(false);
      });
  };

  useEffect(() => {
    const getCacheData = cacheKey
      ? () => Taro.getStorage({ key: cacheKey })
      : () => Promise.resolve({ data: null });
    getCacheData()
      .then(({ data }) => {
        if (data) {
          setData(data);
        } else {
          setLoading(true);
        }
      })
      .catch(() => {
        setLoading(true);
      })
      .finally(() => {
        run().finally(() => setLoading(false));
      });
  }, []);

  return {
    data,
    loading,
    validating,
    run,
  };
};
