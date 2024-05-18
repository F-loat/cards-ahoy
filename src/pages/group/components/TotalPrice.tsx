import { useEffect, useState } from 'react';
import { CardGroup } from '../detail';
import Taro from '@tarojs/taro';
import { getCard, getPointsForCard, samrtCeil } from '../../../utils';
import { View } from '@tarojs/components';
import { Button } from '@nutui/nutui-react-taro';
import { CardRarity } from '../../../assets/cards';

export const getPriceForCards = async (
  cards: {
    id: number;
    level?: number;
  }[],
) => {
  if (!cards.length) {
    return {
      price: 0,
      priceMap: {},
    };
  }
  const res = await Taro.cloud.callFunction({
    name: 'fetchCardsCost',
    data: { cards: cards.map(({ id }) => id) },
  });
  const result = (res.result as number[]) || [];
  const priceMap = cards.reduce(
    (acc, cur, index) => {
      const cardInfo = getCard(cur.id);
      const points = getPointsForCard(
        cardInfo,
        cardInfo.rarity === CardRarity.Mythic ? 1 : cur.level || 1,
      );
      const val = samrtCeil(result[index] * points);
      return { ...acc, [cur.id]: val };
    },
    {} as Record<number, number>,
  );
  const price = Object.values(priceMap).reduce((acc, cur) => acc + cur, 0);
  return {
    price: samrtCeil(price),
    priceMap,
  };
};

export const TotalPrice = ({
  group,
  onUpdate,
}: {
  group: CardGroup;
  onUpdate: (map: Record<number, number>) => void;
}) => {
  const [value, setValue] = useState<number>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    onUpdate({});
    setValue(undefined);
  }, [group]);

  const handleCalculate = async () => {
    setLoading(true);

    const cards = group.members
      .concat(group.leader)
      .filter(({ id }) => id !== -1);

    const { price, priceMap } = await getPriceForCards(cards);

    setLoading(false);
    onUpdate(priceMap);
    setValue(samrtCeil(price));
  };

  return (
    <View className="w-14 h-6">
      {value !== undefined ? (
        <View>${value}</View>
      ) : (
        <Button size="mini" loading={loading} onClick={handleCalculate}>
          {loading ? '' : '计算'}
        </Button>
      )}
    </View>
  );
};
