import { View } from '@tarojs/components';
import {
  usePullDownRefresh,
  useRouter,
  useShareAppMessage,
} from '@tarojs/taro';
import { Divider, Empty, Image, SafeArea } from '@nutui/nutui-react-taro';
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
  noop,
  samrtCeil,
} from '../../utils';
import { LevelSlider } from '../../components/LevelSlider';
import { VideoAd } from './components/VideoAd';
import { Subscribe } from './components/Subscribe';
import { PriceChart } from './components/PriceChart';
import { CardRarity } from '../../types';
import { useCloudFunction } from '../../hooks';

export interface SellCard {
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
  const [level, setLevel] = useState(1);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);

  const {
    data: sellCards,
    run: fetchSellCards,
    loading: sellCardsLoading,
  } = useCloudFunction<SellCard[]>({
    name: 'fetchSellCards',
    data: {
      cardId,
    },
    initialData: [],
    cacheKey: `sellCards-${cardId}`,
    formatResult: (res: {
      data?: {
        list: SellCard[];
        total: number | null;
      };
    }) => res.data?.list || [],
    onSuccess: (list) => {
      Taro.eventCenter.trigger('refreshSellCards', cardId, list);
      if (price || !list.length) return;
      const salePrice = Number(list[0].salePrice);
      const unitCard = list.find((i) => i.accumulateTrait.value === 1);
      if (unitCard) {
        setPrice(unitCard.salePrice);
      } else {
        setPrice(String(salePrice / list[0].accumulateTrait.value));
      }
      setTime(Date.now().toString());
    },
  });

  const {
    data: sellHistory,
    run: fetchSellHistory,
    loading: sellHistoryLoading,
  } = useCloudFunction<SellHistory[]>({
    name: 'fetchCardsAhoy',
    data: {
      url: 'api/marketQuery/queryAnalyzeSellHistory',
      method: 'post',
      body: {
        categoryId: cardId,
        chainNftId: 12,
      },
    },
    initialData: [],
    cacheKey: `sellHistory-${cardId}`,
    formatResult: (res: { data?: SellHistory[] }) => {
      return (res.data || []).slice(0, 10);
    },
  });

  const {
    data: floorPrices,
    loading: floorPricesLoading,
    validating,
  } = useCloudFunction<FloorPrice[]>({
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
    initialData: [],
    cacheKey: `floorPrices-${cardId}`,
    formatResult: (res: {
      data?: {
        nodes: {
          timestamp: number;
          value: string;
        }[];
      };
    }) => {
      return (res.data?.nodes || []).map((item) => ({
        time: dayjs(item.timestamp).format('MM/DD HH:mm'),
        value: Number(item.value),
      }));
    },
  });

  const fetchSubscriptions = async () => {
    const cacheKey = `subscriptions-${cardId}`;
    try {
      const { data: cacheData } = await Taro.getStorage({ key: cacheKey });
      if (cacheData) setSubscriptions(cacheData);
    } catch {
      noop();
    }
    const docs = await Taro.cloud
      .database()
      .collection('subscriptions')
      .where({
        cardId,
      })
      .orderBy('createAt', 'desc')
      .limit(10)
      .get();
    setSubscriptions((docs.data as Subscription[]) || []);
    Taro.setStorage({ key: cacheKey, data: docs.data });
  };

  const loading = sellCardsLoading || sellHistoryLoading || floorPricesLoading;

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  useEffect(() => {
    if (validating && !loading) {
      Taro.showNavigationBarLoading();
    } else {
      Taro.hideNavigationBarLoading();
    }
  }, [validating]);

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
      <View className="h-screen flex items-center justify-center">
        <Empty
          style={{ background: 'transparent' }}
          className="-mt-24"
          title="暂未收录"
        />
      </View>
    );
  }

  return (
    <View className="flex flex-col h-screen">
      <View className="p-2 flex">
        <View className="relative">
          <Image width={128} height={128} src={cardInfo.image} radius="10%" />
          {!!cardInfo.props && !!level && cardInfo.props[level - 1] && (
            <View
              className="absolute left-5 bottom-6 text-white text-center leading-4 text-xs font-bold"
              style={{ fontSize: '10px' }}
            >
              {!!cardInfo.props[level - 1][1] && (
                <View className="bg-blue-500 min-w-4 border-solid border-white border-1.5 rounded">
                  {cardInfo.props[level - 1][1]}
                </View>
              )}
              <View className="bg-red-500 min-w-4 border-solid border-white border-1.5 rounded-xl mt-px">
                {cardInfo.props[level - 1][0]}
              </View>
            </View>
          )}
        </View>
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
                  {samrtCeil(
                    Number(price) *
                      getPointsForCard(
                        cardInfo,
                        cardInfo.rarity === CardRarity.Mythic ? 1 : level,
                      ),
                  )}
                  {cardInfo.rarity === CardRarity.Mythic && level !== 1
                    ? '*'
                    : null}
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
              {time ? dayjs(Number(time)).format('YYYY/MM/DD HH:mm:ss') : ''}
            </View>
            <View className="flex items-center">
              <Subscribe cardId={cardId} onSuccess={fetchSubscriptions} />
            </View>
          </View>
        </View>
      </View>
      {cardInfo.skills !== undefined && (
        <View className="rounded bg-gray-100 dark:bg-[#222] py-2 px-3 mx-2 min-h-10 flex items-center">
          {formatSkills(cardInfo.skills, level)}
        </View>
      )}
      {!!floorPrices.length && <PriceChart data={floorPrices} />}
      <View
        className={classnames(
          'px-2 pb-4 flex-1 overflow-scroll transition-opacity duration-300',
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
                  <View>
                    LV.{item.level} / ${item.price}
                  </View>
                  <View className="text-gray-600 dark:text-gray-400 text-sm">
                    {dayjs(item.updateAt || item.createAt).format(
                      'YYYY/MM/DD HH:mm:ss',
                    )}
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
                    {dayjs(item.saleTime).format('YYYY/MM/DD HH:mm:ss')}
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
