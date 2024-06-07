import Taro from '@tarojs/taro';
import { useEffect, useState } from 'react';
import { Plan, getGlobalData } from '../utils/data';

export const useShowAds = () => {
  const [showAds, setShowAds] = useState(false);
  const plan = getGlobalData('plan') as Plan;
  const openid = getGlobalData('openid') as string;

  useEffect(() => {
    if (!openid || plan === Plan.Pro) return;
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

type CacheKey = string | ((params?: any) => string | null);

const getCacheKey = (cacheKey?: CacheKey, params?: any) => {
  return typeof cacheKey === 'function' ? cacheKey(params) : cacheKey;
};

export const useCloudFunction = <T>({
  manual,
  initialData,
  formatResult = (res) => res,
  cacheKey,
  onSuccess,
  onError,
  ...options
}: {
  manual?: boolean;
  name: string;
  data: Record<string, any>;
  initialData?: T;
  cacheKey?: CacheKey;
  formatResult?: (res: any) => any;
  onSuccess?: (data: T, params: any) => void;
  onError?: (err: Error) => void;
}) => {
  const [data, setData] = useState<T>(initialData as T);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);

  const request = (params = {}) => {
    setValidating(true);
    return Taro.cloud
      .callFunction({
        ...options,
        data: {
          ...options.data,
          body: {
            ...options.data.body,
            ...params,
          },
        },
      })
      .then((res) => {
        const result = formatResult(res.result) as T;
        setData(result);
        onSuccess?.(result, params);
        const key = getCacheKey(cacheKey, params);
        if (key) Taro.setStorage({ key, data: result });
        return result;
      })
      .catch((err) => {
        onError?.(err);
      })
      .finally(() => {
        setValidating(false);
      });
  };

  const run = (params = {}) => {
    const key = getCacheKey(cacheKey, params);

    const getCacheData = key
      ? () => Taro.getStorage({ key }).catch(() => ({ data: null }))
      : () => Promise.resolve({ data: null });

    return getCacheData().then(({ data }) => {
      if (data) {
        setData(data);
        onSuccess?.(data, params);
      } else {
        setLoading(true);
      }
      return request(params).then((res) => {
        setLoading(false);
        return res;
      });
    });
  };

  useEffect(() => {
    if (!manual) run();
  }, []);

  return {
    data,
    loading,
    validating,
    run,
  };
};
