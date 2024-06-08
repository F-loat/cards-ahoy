import Drag from '@fishui/taro-react/lib/components/Drag';
import '@fishui/taro-react/lib/components/Drag/style.scss';
import { Text } from '@tarojs/components';
import { useEffect, useState } from 'react';
import { CardImage } from './CardImage';
import { CardRarity } from '../../../types';
import { getCard } from '../../../utils';
import { Member } from '../detail';

export const MembersList = ({
  data,
  priceMap,
  onMemberClick,
  onSortChange,
}: {
  data: Member[];
  priceMap: Record<number, number>;
  onMemberClick?: (member: Member) => void;
  onSortChange?: (members: Member[]) => void;
}) => {
  const [transition, setTransition] = useState(false);

  useEffect(() => {
    setTransition(false);
    setTimeout(() => setTransition(true), 500);
  }, [data]);

  const renderItem = (member: Member, index: number) => (
    <CardImage
      id={member.id}
      level={member.level}
      key={`${index}_${member.id === -1 ? 0 : 1}`}
      bottomSlot={
        !!priceMap[member.id] && (
          <Text>
            /${priceMap[member.id]}
            {getCard(member.id).rarity === CardRarity.Mythic &&
            member.level !== 1
              ? '*'
              : null}
          </Text>
        )
      }
      onClick={() => {
        if (member.id === -1) return;
        onMemberClick?.(member);
      }}
    />
  );

  return (
    <Drag
      columns={4}
      itemHeight={90}
      listData={data}
      trigger="touchstart"
      transition={transition}
      renderItem={renderItem}
      onChange={onSortChange}
    />
  );
};
