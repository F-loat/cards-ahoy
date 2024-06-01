import { View } from '@tarojs/components';
import Taro, { usePullDownRefresh } from '@tarojs/taro';
import {
  ConfigProvider,
  Divider,
  Image,
  Price,
  SafeArea,
} from '@nutui/nutui-react-taro';
import { useEffect, useRef, useState } from 'react';
import { getCard, samrtCeil } from '../../utils';
import dayjs from 'dayjs';
import { PageLoading } from '../../components/PageLoading';
import { SellCard } from '../detail';

interface DiscountCard {
  _id: number;
  exp: number;
  level: number;
  discount: number;
  salePrice: number;
  floorPrice: number;
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
  const listRef = useRef(list);

  listRef.current = list;

  const fetchCards = async (pageNumber = 1) => {
    const pageSize = 20;
    const db = Taro.cloud.database();
    const _ = db.command;
    const docs = await db
      .collection('cards')
      .where({
        discount: _.lt(1),
      })
      .orderBy('discount', 'asc')
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .get();
    setLoading(false);
    const data = (docs.data as DiscountCard[]) || [];
    setList((val) => (pageNumber === 1 ? data : val.concat(data)));
  };

  const run = async () => {
    await fetchCards(1);
    fetchCards(2);
  };

  useEffect(() => {
    run();
  }, []);

  const refreshCard = (cardId: number, cards: SellCard[]) => {
    if (!cards?.length) return;
    const card = cards[0];
    const exp = card.accumulateTrait.value;
    const level = Number(card.priorityTrait1.match(/\d+$/)?.[0]);
    const unitCard = cards.find((c) => c.accumulateTrait.value === 1);
    const salePrice = Number(card.salePrice);
    const floorPrice = Number(
      unitCard?.salePrice || samrtCeil(salePrice / exp),
    );
    const newList = [...listRef.current];
    const index = listRef.current.findIndex((item) => item._id === cardId);
    if (index === -1) return;
    newList[index] = {
      _id: cardId,
      exp,
      level,
      floorPrice,
      salePrice,
      updatedAt: Date.now(),
      discount: samrtCeil(salePrice / (floorPrice * exp)),
    };
    setList(newList);
  };

  useEffect(() => {
    Taro.eventCenter.on('refreshSellCards', refreshCard);
    return () => {
      Taro.eventCenter.off('refreshSellCards', refreshCard);
    };
  }, []);

  usePullDownRefresh(async () => {
    await run();
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
                url: `/pages/detail/index?id=${item._id}&price=${item.floorPrice}&time=${Number(item.updatedAt)}&from=discount`,
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
                    price={samrtCeil(item.floorPrice * item.exp)}
                    thousands
                    symbol="$"
                    line
                  />
                </ConfigProvider>
              </View>
            </View>
            <View className="text-right">
              <View>{Math.ceil(item.discount * 100) / 10}折</View>
              <View className="text-sm text-gray-500">
                {dayjs(item.updatedAt).fromNow()}更新
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
