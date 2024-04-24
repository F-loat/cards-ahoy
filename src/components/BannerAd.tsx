import { Ad, AdProps, BaseEventOrig } from '@tarojs/components';
import { useShowAds, useTheme } from '../hooks';
import { Divider } from '@nutui/nutui-react-taro';
import { useState } from 'react';

type AdError = BaseEventOrig<AdProps.onErrorEventDetail>;

export const BannerAd = ({ unitId }: { unitId: string }) => {
  const { theme } = useTheme();
  const [showAds] = useShowAds();
  const [error, setError] = useState<AdError | null>(null);

  if (error || !showAds) return null;

  return (
    <>
      <Ad
        adIntervals={60}
        adTheme={theme === 'light' ? 'white' : 'black'}
        unitId={unitId}
        onError={(e) => setError(e)}
      />
      <Divider />
    </>
  );
};
