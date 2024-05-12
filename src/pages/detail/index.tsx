import { View } from '@tarojs/components';
import {
  usePullDownRefresh,
  useRouter,
  useShareAppMessage,
} from '@tarojs/taro';
import { Divider, Image, SafeArea } from '@nutui/nutui-react-taro';
import { useEffect, useState } from 'react';
import Taro from '@tarojs/taro';
import dayjs from 'dayjs';
import classnames from 'classnames';
import { PageLoading } from '../../components/PageLoading';
import { AngleDoubleRight } from '@nutui/icons-react-taro';
import {
  formatSkills,
  getCard,
  getHonorPointsForCard,
  getPointsForCard,
  samrtCeil,
} from '../../utils';
import { LevelSlider } from '../../components/LevelSlider';
import { VideoAd } from './components/VideoAd';
import { Subscribe } from './components/Subscribe';
import { PriceChart } from './components/PriceChart';

interface SellCard {
  image: string;
  chainNftId: number;
  tokenId: string;
  salePrice: string;
  priceUnity: string;
  priorityTrait1: string;
  priorityTrait2: string;
  nftType: number;
  nftName: string;
  amount: number;
  saleAggregatorNumber: string;
  metadataList: {
    name: string;
    value: string;
    ifAccumulate: null | boolean;
  }[];
  accumulateTrait: {
    name: string;
    value: number;
  };
}

interface SellHistory {
  nftName: string;
  tokenId: string;
  salePrice: string;
  totalPrice: string;
  amount: number;
  priceUnity: string;
  fee: number;
  saleTime: number;
  saleStatus: number;
  image: string;
}

export interface Subscription {
  _id: string;
  cardId: number;
  level: number;
  name: string;
  price: number;
  updateAt?: number;
  createAt?: number;
}

export interface FloorPrice {
  time: string;
  value: number;
}

definePageConfig({
  navigationBarTitleText: 'Cards Ahoy!',
  enablePullDownRefresh: true,
  enableShareTimeline: true,
  enableShareAppMessage: true,
});

const Detail = () => {
  const { params } = useRouter();
  const cardId = params.id && Number(params.id);
  const cardInfo = cardId && getCard(cardId);
  const [time, setTime] = useState(params.time);
  const [price, setPrice] = useState(params.price);
  const [loading, setLoading] = useState(false);
  const [sellCards, setSellCards] = useState<SellCard[]>([]);
  const [sellHistory, setSellHistory] = useState<SellHistory[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [floorPrices, setFloorPrices] = useState<FloorPrice[]>([]);

  const [level, setLevel] = useState(1);

  const fetchSellCards = async () => {
    const res = await Taro.cloud.callFunction({
      name: 'fetchSellCards',
      data: {
        cardId,
      },
    });
    const result = res.result as {
      data?: {
        list: SellCard[];
        total: number | null;
      };
    };
    const list = result.data?.list || [];
    setSellCards(list);
    if (!price && list.length) {
      const salePrice = Number(list[0].salePrice);
      setPrice(String(salePrice / list[0].accumulateTrait.value));
      setTime(Date.now().toString());
    }
  };

  const fetchSellHistory = async () => {
    const res = await Taro.cloud.callFunction({
      name: 'fetchCardsAhoy',
      data: {
        url: 'api/marketQuery/queryAnalyzeSellHistory',
        method: 'post',
        body: {
          categoryId: cardId,
          chainNftId: 12,
        },
      },
    });
    const result = res.result as {
      data?: SellHistory[];
    };
    setSellHistory((result.data || []).slice(0, 10));
  };

  const fetchSubscriptions = async () => {
    const db = Taro.cloud.database();
    const docs = await db
      .collection('subscriptions')
      .where({
        cardId,
      })
      .get();
    setSubscriptions((docs.data as Subscription[]) || []);
  };

  const fetchFloorPriceTrend = async () => {
    const res = await Taro.cloud.callFunction({
      name: 'fetchCardsAhoy',
      data: {
        url: 'api/marketQuery/queryAnalyzeFloorPriceTrend',
        method: 'post',
        body: {
          categoryId: cardId,
          chainNftId: 12,
          timeRange: '7d',
        },
      },
    });
    const result = res.result as {
      data?: {
        nodes: {
          timestamp: number;
          value: string;
        }[];
      };
    };
    setFloorPrices(
      (result.data?.nodes || []).map((item) => {
        return {
          time: dayjs(item.timestamp).format('MM/DD HH:mm'),
          value: Number(item.value),
        };
      }),
    );
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchSellCards(),
      fetchSellHistory(),
      fetchFloorPriceTrend(),
      fetchSubscriptions(),
    ]).finally(() => {
      setLoading(false);
    });
  }, []);

  usePullDownRefresh(async () => {
    await Promise.all([
      fetchSellCards(),
      fetchSellHistory(),
      fetchSubscriptions(),
    ]);
    Taro.stopPullDownRefresh();
  });

  useShareAppMessage(() => {
    return {
      title: cardInfo
        ? `价格分享 - ${cardInfo.name} - $${price}`
        : 'Cards Ahoy!',
      path: `/pages/detail/index?id=${cardId}&price=${price}&time=${time}`,
    };
  });

  if (!cardInfo) {
    return (
      <View className="h-full flex items-center justify-center">暂未收录</View>
    );
  }

  return (
    <View className="flex flex-col h-screen">
      <View className="p-2 flex">
        <Image width={128} height={128} src={cardInfo.image} radius={6} />
        <View className="ml-2 flex flex-col flex-1">
          <View className="flex justify-between">
            <View className="text-lg">{cardInfo.name}</View>
            {!!price && (
              <View className="flex items-center">
                <View>地板价</View>
                <View
                  className={classnames('ml-2 transition-colors', {
                    'text-red-500':
                      sellHistory.length && sellHistory[0].salePrice < price,
                    'text-green-500':
                      sellHistory.length && sellHistory[0].salePrice > price,
                  })}
                >
                  $
                  {samrtCeil(Number(price) * getPointsForCard(cardInfo, level))}
                  <AngleDoubleRight
                    style={{
                      transform: `rotate(${
                        !sellHistory.length || sellHistory[0].salePrice == price
                          ? 0
                          : sellHistory[0].salePrice > price
                            ? 90
                            : -90
                      }deg)`,
                    }}
                    size={12}
                    className="transition-all"
                  />
                </View>
              </View>
            )}
          </View>
          <View className="flex items-center justify-between">
            <View className="text-lg">等级</View>
            <LevelSlider value={level} onChange={setLevel} />
          </View>
          <View className="flex items-center justify-between mt-1">
            <View>经验值 {getPointsForCard(cardInfo, level)}</View>
            <View>荣耀点 {getHonorPointsForCard(cardInfo, level)}</View>
          </View>
          <View className="flex-1 flex items-center justify-between">
            <View className="text-lg">
              {dayjs(Number(time)).format('YYYY/MM/DD HH:mm:ss')}
            </View>
            <View className="flex items-center">
              <Subscribe cardId={cardId} />
            </View>
          </View>
        </View>
      </View>
      <View>
        {cardInfo.skills !== undefined && (
          <View className="rounded bg-gray-100 dark:bg-black p-2 mx-2">
            {formatSkills(cardInfo.skills, level)}
          </View>
        )}
      </View>
      {!!floorPrices.length && <PriceChart data={floorPrices} />}
      <View
        className={classnames(
          'px-2 flex-1 overflow-scroll transition-opacity duration-300',
          loading ? 'opacity-0' : 'opacity-100',
        )}
      >
        {!!sellCards.length && (
          <View>
            <Divider
              className="sticky top-0 bg-white dark:bg-[#191919] box-border py-2 z-10"
              style={{ margin: 0 }}
            >
              最新售价
            </Divider>
            <View>
              {sellCards.map((item) => (
                <View className="flex justify-between font-mono">
                  <View>${item.salePrice}</View>
                  <View className="flex text-gray-600 dark:text-gray-400 text-sm">
                    <View>{item.priorityTrait1}</View>
                    <View className="mx-2">/</View>
                    <View>{item.priorityTrait2}</View>
                    <View className="mx-2">/</View>
                    <View>
                      $
                      {samrtCeil(
                        Number(item.salePrice) / item.accumulateTrait.value,
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
        {!!sellHistory.length && (
          <View>
            <Divider
              className="sticky top-0 bg-white dark:bg-[#191919] box-border py-2 z-10"
              style={{ margin: 0 }}
            >
              成交历史
            </Divider>
            <View>
              {sellHistory.map((item) => (
                <View className="flex justify-between font-mono">
                  <View>${item.totalPrice}</View>
                  <View className="text-gray-600 dark:text-gray-400 text-sm">
                    {dayjs(item.saleTime).format('YYYY-MM-DD HH:mm:ss')}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
        {!!subscriptions.length && (
          <View>
            <Divider
              className="sticky top-0 bg-white dark:bg-[#191919] box-border py-2 z-10"
              style={{ margin: 0 }}
            >
              订阅记录
            </Divider>
            <View>
              {subscriptions.map((item) => (
                <View className="flex justify-between font-mono">
                  <View>${item.price}</View>
                  <View className="text-gray-600 dark:text-gray-400 text-sm">
                    {dayjs(item.updateAt || item.createAt).format(
                      'YYYY-MM-DD HH:mm:ss',
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
      <VideoAd loading={loading} />
      <SafeArea position="bottom" />
      <PageLoading visible={loading} />
    </View>
  );
};

export default Detail;
