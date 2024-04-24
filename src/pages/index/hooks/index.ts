import Taro from '@tarojs/taro';
import { useState } from 'react';
import { CardFoil, CardType, cardsMap } from '../../../assets/cards';

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
  rarities?: string[];
  types?: string[];
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
  const types = (filters.types ?? []).filter((type: CardType) =>
    [CardType.Leaders, CardType.Members].includes(type),
  );
  const foils = (filters.types ?? []).filter((foil: CardFoil) =>
    [CardFoil.Gold, CardFoil.Regular].includes(foil),
  );
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
            filterValueList: [],
            valueIdList: types,
            filterIdList: types,
          },
          {
            filterName: 'Faction',
            filterValueList: [],
            valueIdList: filters.factions ?? [],
            filterIdList: filters.factions ?? [],
          },
          {
            filterName: 'Rarity',
            filterValueList: [],
            valueIdList: filters.rarities ?? [],
            filterIdList: filters.rarities ?? [],
          },
          {
            filterName: 'Foil',
            filterValueList: [],
            valueIdList: foils,
            filterIdList: foils,
          },
          {
            filterName: 'Source',
            filterValueList: [],
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
