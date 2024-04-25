import { useState } from 'react';
import { Drag, FixedNav } from '@nutui/nutui-react-taro';
import {
  BookMark,
  PackageArrowDown,
  Receipt,
  Top,
} from '@nutui/icons-react-taro';
import Taro, { usePageScroll } from '@tarojs/taro';
import { OrderImport } from './OrderImport';

const ToolsNav = ({ onUpdate }: { onUpdate?: () => void }) => {
  const [visible, setVisible] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);

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
      id: 'order-import',
      text: '订单导入',
      icon: <Receipt size={18} style={{ transform: 'none' }} />,
    },
  ];

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
              case 'my-cards-group':
                Taro.navigateTo({ url: '/pages/group/index?type=self' });
                break;
              case 'order-import':
                setDialogVisible(true);
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
