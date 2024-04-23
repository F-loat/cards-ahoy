import Taro from '@tarojs/taro';
import { useEffect, useState } from 'react';

export const useShowAds = () => {
  const [showAds, setShowAds] = useState(false);

  useEffect(() => {
    Taro.getStorage({ key: 'ad-time' })
      .then(({ data: time }) => {
        setShowAds(!time || time < Date.now() - 1000 * 60 * 60 * 24 * 3);
      })
      .catch(() => {
        setShowAds(true);
      });
  }, []);

  return {
    showAds,
  };
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
