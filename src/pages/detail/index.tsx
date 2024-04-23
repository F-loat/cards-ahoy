import { Ad, View } from '@tarojs/components';
import { useRouter, useShareAppMessage } from '@tarojs/taro';
import { Divider, Image, SafeArea } from '@nutui/nutui-react-taro';
import { cardsMap } from '../../assets/cards';
import { useEffect, useState } from 'react';
import Taro from '@tarojs/taro';
import dayjs from 'dayjs';
import classnames from 'classnames';
import { PageLoading } from '../../components/PageLoading';
import { AngleDoubleRight } from '@nutui/icons-react-taro';
import F2Canvas from 'taro-f2-react';
import Chart from '@antv/f2/es/chart';
import Line from '@antv/f2/es/components/line';
import Tooltip from '@antv/f2/es/components/tooltip';
import {
  formatSkills,
  getHonorPointsForCard,
  getPointsForCard,
  samrtCeil,
} from '../../utils';
import { useShowAds, useTheme } from '../../hooks';
import { LevelSlider } from '../../components/LevelSlider';

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

interface FloorPrice {
  time: string;
  value: number;
}

const Detail = () => {
  const { theme } = useTheme();
  const { params } = useRouter();
  const cardInfo = params.id && cardsMap[params.id];
  const [loading, setLoading] = useState(false);
  const [sellCards, setSellCards] = useState<SellCard[]>([]);
  const [sellHistory, setSellHistory] = useState<SellHistory[]>([]);
  const [floorPrices, setFloorPrices] = useState<FloorPrice[]>([]);

  const { showAds } = useShowAds();

  const [level, setLevel] = useState(1);

  const fetchSellCards = async () => {
    if (!cardInfo) return;
    const res = await Taro.cloud.callFunction({
      name: 'fetchCardsAhoy',
      data: {
        url: 'api/marketQuery/queryMarketHome',
        method: 'post',
        body: {
          sortType: 4,
          pageNumber: 1,
          pageSize: 10,
          firstCategoryId: 12,
          secondCategoryId: cardInfo.id,
          discreteList: [],
          continuityList: [],
          coinId: 1,
        },
      },
    });
    const result = res.result as {
      data?: {
        list: SellCard[];
        total: number | null;
      };
    };
    setSellCards(result.data?.list || []);
  };

  const fetchSellHistory = async () => {
    if (!cardInfo) return;
    const res = await Taro.cloud.callFunction({
      name: 'fetchCardsAhoy',
      data: {
        url: 'api/marketQuery/queryAnalyzeSellHistory',
        method: 'post',
        body: {
          categoryId: cardInfo.id,
          chainNftId: 12,
        },
      },
    });
    const result = res.result as {
      data?: SellHistory[];
    };
    setSellHistory(result.data || []);
  };

  const fetchFloorPriceTrend = async () => {
    if (!cardInfo) return;
    const res = await Taro.cloud.callFunction({
      name: 'fetchCardsAhoy',
      data: {
        url: 'api/marketQuery/queryAnalyzeFloorPriceTrend',
        method: 'post',
        body: {
          categoryId: cardInfo.id,
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

  useShareAppMessage(() => {
    return {
      title: cardInfo
        ? `价格分享 - ${cardInfo.name} - $${params.price}`
        : 'Cards Ahoy!',
      path: `/pages/detail/index?id=${params.id}&price=${params.price}&time=${params.time}`,
    };
  });

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchSellCards(),
      fetchSellHistory(),
      fetchFloorPriceTrend(),
    ]).finally(() => {
      setLoading(false);
    });
  }, []);

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
            {!!params.price && (
              <View className="flex">
                <View>地板价</View>
                <View
                  className={classnames('ml-2 transition-colors', {
                    'text-red-500':
                      sellHistory.length &&
                      sellHistory[0].salePrice < params.price,
                    'text-green-500':
                      sellHistory.length &&
                      sellHistory[0].salePrice > params.price,
                  })}
                >
                  $
                  {samrtCeil(
                    Number(params.price) * getPointsForCard(cardInfo, level),
                  )}
                  <AngleDoubleRight
                    style={{
                      transform: `rotate(${
                        !sellHistory.length ||
                        sellHistory[0].salePrice == params.price
                          ? 0
                          : sellHistory[0].salePrice > params.price
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
          <View className="flex items-center justify-between">
            <View className="text-lg">荣耀点</View>
            <View>{getHonorPointsForCard(cardInfo, level)}</View>
          </View>
          <View className="flex-1 flex items-center text-xl">
            {dayjs(Number(params.time)).format('YYYY/MM/DD HH:mm:ss')}
          </View>
        </View>
      </View>
      <View>
        {cardInfo.skills !== undefined && (
          <View className="rounded bg-gray-100 dark:bg-[#191919] p-2 mx-2">
            {formatSkills(cardInfo.skills, level)}
          </View>
        )}
      </View>
      <View className="w-full h-24">
        <F2Canvas>
          <Chart data={floorPrices}>
            <Line x="time" y="value" />
            <Tooltip />
          </Chart>
        </F2Canvas>
      </View>
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
      </View>
      {showAds && (
        <View
          className={classnames(
            'transition-opacity duration-300',
            loading ? 'opacity-0' : 'opacity-100',
          )}
        >
          <Ad
            adType="video"
            unitId="adunit-1b5daab0700aac2d"
            adTheme={theme === 'light' ? 'white' : 'black'}
          />
        </View>
      )}
      <SafeArea position="bottom" />
      <PageLoading visible={loading} />
    </View>
  );
};

export default Detail;
