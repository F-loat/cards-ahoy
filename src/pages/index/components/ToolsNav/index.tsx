import { useEffect, useState } from 'react';
import { Drag, FixedNav } from '@nutui/nutui-react-taro';
import { BookMark, FaceSmile, Receipt, Top } from '@nutui/icons-react-taro';
import Taro, { usePageScroll } from '@tarojs/taro';
import { OrderImport } from './OrderImport';

const videoAd = Taro.createRewardedVideoAd({
  adUnitId: 'adunit-a617415f00e83d0e',
});

videoAd.onError(() =>
  Taro.showToast({
    title: '加载失败，请稍后再试',
    icon: 'none',
  }),
);

videoAd.onClose(({ isEnded }) => {
  if (isEnded) {
    Taro.showToast({
      title: '感谢支持~ 已获取 72 小时应用内免广告权益!',
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
});

const ToolsNav = ({ onUpdate }: { onUpdate?: () => void }) => {
  const [visible, setVisible] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);

  const list = [
    {
      id: 'ad',
      text: '免广告',
      icon: <FaceSmile size={18} style={{ transform: 'none' }} />,
    },
    {
      id: 'back-top',
      text: '回到顶部',
      icon: <Top size={18} style={{ transform: 'none' }} />,
    },
    {
      id: 'cards-group',
      text: '热门卡组',
      icon: <BookMark size={18} style={{ transform: 'none' }} />,
    },
    {
      id: 'order-import',
      text: '订单导入',
      icon: <Receipt size={18} style={{ transform: 'none' }} />,
    },
  ];

  useEffect(() => {
    videoAd.load();
    return () => videoAd.destroy();
  }, []);

  usePageScroll(() => {
    if (visible) {
      setVisible(false);
    }
  });

  return (
    <>
      <Drag direction="y" style={{ right: '0px', bottom: '12vh' }}>
        <FixedNav
          list={list}
          inactiveText="辅助工具"
          activeText="辅助工具"
          visible={visible}
          onChange={setVisible}
          onSelect={(item) => {
            setVisible(false);
            switch (item.id) {
              case 'back-top':
                Taro.pageScrollTo({ scrollTop: 0, duration: 300 });
                break;
              case 'cards-group':
                Taro.navigateTo({ url: '/pages/group/index' });
                break;
              case 'order-import':
                setDialogVisible(true);
                break;
              case 'ad':
                Taro.showToast({
                  title: '广告加载中~ 观看满 30s 可免除 72 小时应用内广告哦!',
                  icon: 'none',
                  duration: 3000,
                });
                videoAd.show();
                break;
            }
          }}
        />
      </Drag>
      <OrderImport
        visible={dialogVisible}
        onClose={() => setDialogVisible(false)}
        onConfirm={onUpdate}
      />
    </>
  );
};

export default ToolsNav;
