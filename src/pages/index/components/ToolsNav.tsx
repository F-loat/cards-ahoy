import { useState } from 'react';
import { Drag, FixedNav } from '@nutui/nutui-react-taro';
import {
  BookMark,
  PackageArrowDown,
  ShoppingFollow,
  Top,
} from '@nutui/icons-react-taro';
import Taro, { usePageScroll } from '@tarojs/taro';

const ToolsNav = () => {
  const [visible, setVisible] = useState(true);

  const list = [
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
      id: 'my-cards-group',
      text: '我的卡组',
      icon: <PackageArrowDown size={18} style={{ transform: 'none' }} />,
    },
    {
      id: 'tools-discount',
      text: '折扣卡牌',
      icon: <ShoppingFollow size={18} style={{ transform: 'none' }} />,
    },
  ];

  usePageScroll((e) => {
    if (e.scrollTop > 64 && visible) {
      setVisible(false);
    } else if (e.scrollTop < 64 && !visible) {
      setVisible(true);
    }
  });

  return (
    <Drag direction="y" style={{ right: '0px', bottom: '12vh' }}>
      <FixedNav
        list={list}
        inactiveText="辅助工具"
        activeText="辅助工具"
        visible={visible}
        onChange={setVisible}
        onSelect={(item) => {
          switch (item.id) {
            case 'back-top':
              Taro.pageScrollTo({ scrollTop: 0, duration: 300 });
              break;
            case 'cards-group':
              Taro.navigateTo({ url: '/pages/group/index' });
              break;
            case 'my-cards-group':
              Taro.navigateTo({ url: '/pages/group/index?type=self' });
              break;
            case 'tools-discount':
              Taro.navigateTo({ url: '/pages/tools/discount' });
              break;
          }
        }}
      />
    </Drag>
  );
};

export default ToolsNav;
