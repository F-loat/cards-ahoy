import { NoticeBar } from '@nutui/nutui-react-taro';
import Taro from '@tarojs/taro';
import { GlobalData, getGlobalData } from '../../../utils';
import { useEffect, useState } from 'react';

export const Notice = () => {
  const [notice, setNotice] = useState<GlobalData['notice']>();

  useEffect(() => {
    const n = getGlobalData('notice') as GlobalData['notice'];
    Taro.getStorage({
      key: 'notice',
      success: (res) => {
        if (res.data !== n?.text) setNotice(n);
      },
      fail: () => {
        setNotice(n);
        Taro.setStorage({
          key: 'notice',
          data: null,
        });
      },
    });
  });

  if (!notice?.text) return null;

  return (
    <NoticeBar
      wrap
      closeable
      leftIcon={null}
      scrollable={false}
      content={notice.text}
      className="mb-4 -mt-2 rounded overflow-hidden"
      onClick={() => {
        if (!notice.copy?.content) return;
        Taro.setClipboardData({
          data: notice.copy.content,
          success: () => {
            Taro.showToast({
              title: notice.copy?.message || '已复制',
              icon: 'none',
            });
          },
        });
      }}
      onClose={() => {
        Taro.setStorage({
          key: 'notice',
          data: notice.text,
        });
      }}
    />
  );
};
