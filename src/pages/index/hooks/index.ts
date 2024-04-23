import Taro from '@tarojs/taro';
import { useState } from 'react';
import { cardsMap } from '../../../assets/cards';

export interface Card {
  chainNftId: number;
  floorPrice: string;
  image: string;
  nftName: string;
  priceUnity: string;
  quantity: number;
  secondaryId: number;
  secondaryName: string;
  volume: number;
  time: number;
}

export interface Filters {
  factions?: string[];
  sort?: number;
}

interface CardListResult {
  data?: {
    total: number;
    list: Card[];
  };
}

const fetchCardList = async ({
  pageNumber = 1,
  filters = {},
}: {
  pageNumber?: number;
  filters?: Filters;
}) => {
  const res = await Taro.cloud.callFunction({
    name: 'fetchCardsAhoy',
    data: {
      url: 'api/marketQuery/queryMarketSecondary',
      method: 'post',
      body: {
        chainNftId: 12,
        discreteList: [
          {
            filterName: 'Type',
            filterValueList: [
              {
                valueName: 'Leaders',
                valueId: 'Leaders',
              },
              {
                valueName: 'Members',
                valueId: 'Members',
              },
            ],
            valueIdList: [],
            filterIdList: [],
          },
          {
            filterName: 'Faction',
            filterValueList: [
              {
                valueName: 'Neutral',
                valueId: 'Neutral',
              },
              {
                valueName: 'Animal',
                valueId: 'Animal',
              },
              {
                valueName: 'Plant',
                valueId: 'Plant',
              },
              {
                valueName: 'Zombie',
                valueId: 'Zombie',
              },
            ],
            valueIdList: filters.factions ?? [],
            filterIdList: filters.factions ?? [],
          },
          {
            filterName: 'Rarity',
            filterValueList: [
              {
                valueName: 'Common',
                valueId: 'Common',
              },
              {
                valueName: 'Rare',
                valueId: 'Rare',
              },
              {
                valueName: 'Epic',
                valueId: 'Epic',
              },
              {
                valueName: 'Legendary',
                valueId: 'Legendary',
              },
            ],
            valueIdList: [],
            filterIdList: [],
          },
          {
            filterName: 'Foil',
            filterValueList: [
              {
                valueName: 'Regular',
                valueId: 'Regular',
              },
              {
                valueName: 'Gold',
                valueId: 'Gold',
              },
            ],
            valueIdList: [],
            filterIdList: [],
          },
          {
            filterName: 'Source',
            filterValueList: [
              {
                valueName: 'All',
                valueId: 'All',
              },
              {
                valueName: 'Ahoy Box',
                valueId: 'Ahoy Box',
              },
              {
                valueName: 'Ladder Chest',
                valueId: 'Ladder Chest',
              },
              {
                valueName: 'Alchemy',
                valueId: 'Alchemy',
              },
              {
                valueName: 'Reward',
                valueId: 'Reward',
              },
              {
                valueName: 'Season Box',
                valueId: 'Season Box',
              },
            ],
            valueIdList: [],
            filterIdList: [],
          },
        ],
        continuityList: [
          {
            filterName: 'Cost',
            start: 0,
            end: 9,
            stepSize: 1,
            min: 0,
            max: 9,
          },
        ],
        pageNumber,
        pageSize: 20,
        sortType: filters.sort,
      },
    },
  });
  return res.result as CardListResult;
};

export const useCardList = () => {
  const [list, setList] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current: 1,
    size: 20,
    total: 0,
  });

  const isLoadAll = pagination.current * pagination.size >= pagination.total;

  const runAsync = async ({
    pageNumber = 1,
    filters,
  }: {
    pageNumber?: number;
    filters?: Filters;
  }) => {
    if (isLoadAll && pageNumber !== 1) {
      return;
    }
    setLoading(true);
    try {
      const result = await fetchCardList({
        pageNumber,
        filters,
      });
      const time = Date.now();
      result.data?.list.forEach((item) => {
        item.time = time;
        const card = cardsMap[item.secondaryId];
        if (card) item.secondaryName = card.name;
      });
      if (pageNumber === 1) {
        setList(result?.data?.list || []);
      } else {
        setList(list.concat(result?.data?.list || []));
      }
      setPagination({
        ...pagination,
        total: result?.data?.total || 0,
        current: pageNumber,
      });
    } catch (err) {
      console.log(err);
      Taro.showToast({
        title: err.message || '数据加载失败',
        icon: 'none',
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    list,
    loading,
    isLoadAll,
    runAsync,
    pagination,
  };
};
