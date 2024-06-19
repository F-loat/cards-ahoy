import { ConfigProvider, Loading, NoticeBar } from '@nutui/nutui-react-taro';
import Taro from '@tarojs/taro';
import { GlobalData } from '../../../utils/data';

export const Notice = ({
  notice,
  loading,
}: {
  notice?: GlobalData['notice'];
  loading?: boolean;
}) => {
  if (!notice?.text) return null;

  return (
    <NoticeBar
      wrap
      closeable
      leftIcon={null}
      scrollable={false}
      content={notice.text}
      rightIcon={
        loading && (
          <ConfigProvider theme={{ nutuiLoadingIconColor: 'currentColor' }}>
            <Loading type="circular" />
          </ConfigProvider>
        )
      }
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
