import {
  ConfigProvider,
  Divider,
  Loading,
  Swiper,
} from '@nutui/nutui-react-taro';
import { getGlobalData } from '../../../utils/data';
import { CloudImage } from '../../../components/CloudImage';
import Taro from '@tarojs/taro';
import dayjs from 'dayjs';
import { useCloudFunction } from '../../../hooks';
import { GroupItem } from '../../group/components/GroupItem';
import { View } from '@tarojs/components';
import { Filters } from '../hooks';
import { CardGroup } from '../../group';
import { useEffect } from 'react';
import { ThumbsUp } from '@nutui/icons-react-taro';
import { useGroupVote } from '../../../pages/group/hooks';

type Banner = CardGroup & {
  img: string;
  link?: string;
  type?: 'activity' | 'card-group';
};

const ImageItem = ({ item }: { item: Banner }) => {
  return (
    <CloudImage
      width="100%"
      height="100%"
      src={item.img}
      mode="aspectFill"
      onClick={() => {
        if (!item.link) return;
        if (!item.link.startsWith('http')) {
          Taro.navigateTo({
            url: item.link,
          });
          return;
        }
        Taro.setClipboardData({
          data: item.link,
          success: () => {
            Taro.showToast({
              title: '链接已复制，请在浏览器中打开~',
              icon: 'none',
            });
          },
        });
      }}
    />
  );
};

export const SwiperBanner = ({ filters }: { filters: Filters }) => {
  const { loading, runAsync: handleVote } = useGroupVote();

  const {
    data: banners,
    mutate,
    run: fetchBanners,
  } = useCloudFunction<Banner[]>({
    name: 'fetchCardGroup',
    manual: true,
    data: {
      pageNumber: 1,
      pageSize: 5,
      filters: {
        sort: 1,
        factions: filters.factions,
        createAt: dayjs()
          .add(-8, 'hour')
          .hour(8)
          .minute(0)
          .second(0)
          .millisecond(0)
          .valueOf(),
      },
    },
    formatResult(res) {
      return ((getGlobalData('banners') as Banner[]) || [])
        .map((banner) => ({ ...banner, type: 'activity' }))
        .concat(res.data);
    },
    cacheKey: 'indexCardGroup',
  });

  useEffect(() => {
    fetchBanners();
  }, [filters.factions]);

  if (!banners?.length) return null;

  return (
    <ConfigProvider theme={{ nutuiSwiperIndicatorBottom: '2px' }}>
      <Swiper
        loop
        height={124}
        indicator={banners.length > 1}
        className="rounded -my-2"
      >
        {banners.map((item, index) => (
          <Swiper.Item key={item.img || item._id}>
            {item.type === 'activity' ? (
              <ImageItem item={item as Banner} />
            ) : (
              <View className="flex -ml-1">
                <GroupItem
                  item={item as CardGroup}
                  showVote={false}
                  className="flex-1 px-1"
                />
                <View>
                  <View className="vertical-text text-xs">今日卡组</View>
                  <View
                    className="flex flex-col justify-center items-center mt-6"
                    onClick={async () => {
                      const successed = await handleVote(item._id, 'up');
                      if (!successed) return;
                      const newBanners = [...banners];
                      if (newBanners[index].up) {
                        newBanners[index].up! += 1;
                      } else {
                        newBanners[index].up = 1;
                      }
                      mutate(newBanners);
                    }}
                  >
                    {loading === 'up' ? (
                      <ConfigProvider
                        theme={{
                          nutuiLoadingIconColor: 'currentColor',
                        }}
                        className="h-4"
                      >
                        <Loading className="text-green-500" />
                      </ConfigProvider>
                    ) : (
                      <ThumbsUp size={16} className="text-green-500" />
                    )}
                    <View className="my-1 text-xs">{item.up || 0}</View>
                  </View>
                </View>
              </View>
            )}
          </Swiper.Item>
        ))}
      </Swiper>
      <Divider />
    </ConfigProvider>
  );
};
