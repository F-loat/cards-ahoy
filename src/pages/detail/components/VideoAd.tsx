import { Ad, View } from '@tarojs/components';
import { useShowAds, useTheme } from '../../../hooks';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useRef } from 'react';
import { Dialog } from '@nutui/nutui-react-taro';

export const VideoAd = ({ loading }: { loading?: boolean }) => {
  const { theme } = useTheme();
  const [showAds] = useShowAds();
  const videoAd = useRef(
    Taro.createRewardedVideoAd({
      adUnitId: 'adunit-a617415f00e83d0e',
    }),
  );

  const handleClose = () => {
    if (!videoAd.current) return;

    videoAd.current.onError(() =>
      Taro.showToast({
        title: '加载失败，请稍后再试',
        icon: 'none',
      }),
    );

    videoAd.current.onClose(({ isEnded }) => {
      if (isEnded) {
        Taro.showToast({
          title: '感谢支持~ 已获取 24 小时应用内免广告权益!',
          icon: 'none',
          duration: 3000,
        });
        Taro.setStorageSync('ad-time', Date.now());
      } else {
        Taro.showToast({
          title: '感谢支持~',
          icon: 'none',
          duration: 3000,
        });
      }
      videoAd.current.destroy();
    });

    Dialog.open('close-ad', {
      title: '免广告',
      content: '观看满30s可免除24小时应用内广告!',
      onConfirm: () => {
        videoAd.current.load();
        Taro.showToast({
          title: '广告加载中',
          icon: 'none',
          duration: 3000,
        });
        videoAd.current.show().catch(() => {
          Taro.showToast({
            title: '加载失败，请稍后再试',
            icon: 'none',
          });
        });
        Dialog.close('close-ad');
      },
      onCancel: () => {
        Dialog.close('close-ad');
        videoAd.current.destroy();
      },
    });
  };

  if (!showAds) return null;

  return (
    <View
      className={classnames(
        'transition-opacity duration-300 dark:text-white',
        loading ? 'opacity-0' : 'opacity-100',
      )}
    >
      <Ad
        adType="video"
        unitId="adunit-1b5daab0700aac2d"
        adTheme={theme === 'light' ? 'white' : 'black'}
        onClose={handleClose}
      />
      <Dialog id="close-ad" />
    </View>
  );
};
