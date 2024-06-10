import { useEffect, useState } from 'react';
import { getGlobalData } from '../../../utils/data';
import { Cost } from '../components/CostPopup';
import Taro from '@tarojs/taro';

export const useCardCost = () => {
  const [costMap, setCostMap] = useState<Record<string, Cost[]>>({});

  const [costPopup, setCostPopup] = useState<{
    visible: boolean;
    cardId?: number;
    floorPrice?: string;
  }>({
    visible: false,
  });

  const initCostMap = () => {
    Taro.getStorage({ key: 'costMap' })
      .then(({ data }) => setCostMap(data))
      .catch(async () => {
        const openid = getGlobalData('openid') as string;
        const res = await Taro.cloud
          .database()
          .collection('card_costs')
          .doc(openid)
          .get({});
        if (res.errMsg !== 'document.get:ok') return;
        setCostMap(res.data);
        Taro.setStorage({ key: 'costMap', data: res.data });
      });
  };

  const updateCostMap = (value: Record<string, Cost[]>) => {
    setCostMap(value);
    Taro.setStorageSync('costMap', value);
    const openid = getGlobalData('openid') as string;
    if (!openid || !value) return;
    Taro.cloud
      .database()
      .collection('card_costs')
      .doc(openid)
      .set({ data: { ...value, _id: undefined, _openid: undefined } });
  };

  useEffect(() => {
    initCostMap();
  }, []);

  return {
    costMap,
    costPopup,
    setCostPopup,
    updateCostMap,
  };
};
