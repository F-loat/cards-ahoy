import { Image, Divider } from '@nutui/nutui-react-taro';
import { View } from '@tarojs/components';
import { Card, CardFaction, CardFoil, CardType } from '../../../types';
import { cardsList } from '../../../assets/cards';
import { useMemo } from 'react';
import { CardGroup, SelectedCard } from '../detail';
import { getCard } from '../../../utils';

const CardItem = ({ card, onClick }: { card: Card; onClick?: () => void }) => {
  return (
    <View className="flex flex-col items-center text-sm" onClick={onClick}>
      <Image width={80} height={80} src={card.image} radius="50%" />
      {card.name}
    </View>
  );
};

const compareCards = (a: Card, b: Card) => {
  const factionComparison = a.faction.localeCompare(b.faction);

  if (factionComparison !== 0) {
    return factionComparison;
  }

  if (a.cost - b.cost !== 0) {
    return a.cost - b.cost;
  }

  const nameComparison = a.name.localeCompare(b.name);

  if (nameComparison !== 0) {
    return nameComparison;
  }

  return a.foil === CardFoil.Gold ? -1 : 1;
};

export const CardsList = ({
  group,
  onSelect,
}: {
  group: CardGroup;
  onSelect: (card: SelectedCard) => void;
}) => {
  const leaders = useMemo(() => {
    return cardsList
      .filter((card) => card.type === CardType.Leaders)
      .sort(compareCards);
  }, []);

  const members = useMemo(() => {
    return cardsList
      .filter((card) => {
        if (card.type !== CardType.Members) return false;
        if (card.faction === CardFaction.Neutral) return true;
        const leader = getCard(group.leader.id);
        return !leader || card.faction === leader.faction;
      })
      .sort(compareCards);
  }, [group.leader]);

  return (
    <>
      <Divider
        className="sticky top-0 bg-white dark:bg-[#191919] box-border px-4 pb-2 z-10"
        style={{ margin: 0 }}
      >
        领袖
      </Divider>
      <View className="grid gap-2 grid-cols-4 px-3">
        {leaders.map((card) => (
          <CardItem
            key={card.id}
            card={card}
            onClick={() => {
              onSelect({
                ...getCard(card.id),
                level: group.leader.level ?? 1,
                group: false,
              });
            }}
          />
        ))}
      </View>
      <Divider
        className="sticky top-0 bg-white dark:bg-[#191919] box-border px-4 pb-2 z-10"
        style={{ margin: 0 }}
      >
        成员
      </Divider>
      <View className="grid gap-2 grid-cols-4 px-3">
        {members.map((card) => (
          <CardItem
            key={card.id}
            card={card}
            onClick={() => {
              onSelect({
                ...getCard(card.id),
                level: group.leader.level ?? 1,
                group: false,
              });
            }}
          />
        ))}
      </View>
    </>
  );
};
