import { View } from '@tarojs/components';
import Taro, { usePullDownRefresh } from '@tarojs/taro';
import {
  ConfigProvider,
  Divider,
  Image,
  Price,
  SafeArea,
} from '@nutui/nutui-react-taro';
import { useEffect, useState } from 'react';
import { getCard, samrtCeil } from '../../utils';
import dayjs from 'dayjs';
import { PageLoading } from '../../components/PageLoading';

interface DiscountCard {
  _id: number;
  exp: number;
  level: number;
  discount: number;
  salePrice: string;
  floorPrice: string;
  updatedAt: number;
}

definePageConfig({
  navigationBarTitleText: 'Cards Ahoy!',
  enablePullDownRefresh: true,
  enableShareTimeline: true,
  enableShareAppMessage: true,
});

const Discount = () => {
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<DiscountCard[]>([]);

  const fetchCards = async () => {
    const db = Taro.cloud.database();
    const _ = db.command;
    const docs = await db
      .collection('cards')
      .where({
        discount: _.lt(1),
      })
      .orderBy('discount', 'asc')
      .limit(20)
      .get();
    setLoading(false);
    setList((docs.data as DiscountCard[]) || []);
  };

  useEffect(() => {
    fetchCards();
  }, []);

  usePullDownRefresh(async () => {
    await fetchCards();
    Taro.stopPullDownRefresh();
  });

  return (
    <View className="px-2 py-5">
      {list.map((item) => (
        <View key={item._id}>
          <View
            className="flex items-center mx-1"
            onClick={() => {
              Taro.navigateTo({
                url: `/pages/detail/index?id=${item._id}&price=${item.floorPrice}&time=${Number(item.updatedAt)}`,
              });
            }}
          >
            <Image
              src={getCard(item._id).image}
              width={64}
              height={64}
              radius="10%"
              lazyLoad
            />
            <View className="ml-3 flex-1">
              <View className="flex items-center">
                <View>{getCard(item._id).name}</View>
                <View className="text-xs ml-2 text-gray-600 dark:text-gray-400">
                  LV.{item.level}
                </View>
              </View>
              <View className="flex items-center">
                <Price
                  price={item.salePrice}
                  size="normal"
                  thousands
                  symbol="$"
                />
                <span>&nbsp;</span>
                <ConfigProvider
                  theme={{
                    nutuiPriceLineColor: '#888',
                  }}
                >
                  <Price
                    price={samrtCeil(Number(item.floorPrice) * item.exp)}
                    thousands
                    symbol="$"
                    line
                  />
                </ConfigProvider>
              </View>
            </View>
            <View className="text-right">
              <View>{Math.ceil(item.discount * 100) / 10}折</View>
              <View className="text-sm font-mono text-gray-500">
                {dayjs(item.updatedAt).format('MM/DD HH:mm')}
              </View>
            </View>
          </View>
          <Divider />
        </View>
      ))}
      <View className="flex justify-center items-center h-6">
        {!loading && (
          <View className="text-sm text-gray-400 dark:text-gray-600">
            没有更多了~
          </View>
        )}
      </View>
      <SafeArea position="bottom" />
      <PageLoading visible={loading && !list.length} />
    </View>
  );
};

export default Discount;
