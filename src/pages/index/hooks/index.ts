import Taro from '@tarojs/taro';
import { useState } from 'react';
import { CardFoil, CardType } from '../../../types';
import { getCard } from '../../../utils';
import { useCloudFunction } from '../../../hooks';

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

const getParams = (filters: Filters) => {
  const types = (filters.types ?? []).filter((type: CardType) =>
    [CardType.Leaders, CardType.Members].includes(type),
  );
  const foils = (filters.types ?? []).filter((foil: CardFoil) =>
    [CardFoil.Gold, CardFoil.Regular].includes(foil),
  );
  return {
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
    sortType: filters.sort,
  };
};

export const useCardList = () => {
  const [list, setList] = useState<Card[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    size: 50,
    total: 0,
  });

  const isLoadAll = pagination.current * pagination.size >= pagination.total;

  const {
    run: fetchCardList,
    loading,
    validating,
  } = useCloudFunction<CardListResult['data']>({
    manual: true,
    name: 'fetchCardsAhoy',
    data: {
      url: 'api/marketQuery/queryMarketSecondary',
      method: 'post',
    },
    formatResult(res: CardListResult) {
      const time = Date.now();
      res.data?.list.forEach((item) => {
        item.time = time;
        const card = getCard(item.secondaryId);
        if (card.image) item.image = card.image;
        if (card.name) item.secondaryName = card.name;
      });
      return res.data;
    },
    onSuccess(data, params) {
      if (params.pageNumber === 1) {
        setList(data?.list || []);
      } else {
        setList(list.concat(data?.list || []));
      }
      setPagination({
        ...pagination,
        current: params.pageNumber,
        total: data?.total || 0,
      });
    },
    onError(err) {
      console.log(err);
      Taro.showToast({
        title: err.message || '数据加载失败',
        icon: 'none',
      });
    },
    cacheKey: (params) => (params.pageNumber === 1 ? 'cardList' : null),
  });

  const run = ({
    pageNumber = 1,
    filters = {},
  }: {
    pageNumber?: number;
    filters?: Filters;
  }) => {
    if (isLoadAll && pageNumber !== 1) {
      return Promise.resolve();
    }
    return fetchCardList({
      pageNumber,
      pageSize: pagination.size,
      ...getParams(filters),
    });
  };

  return {
    list,
    loading,
    validating,
    isLoadAll,
    run,
    pagination,
  };
};
