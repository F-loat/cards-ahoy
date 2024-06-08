import { useMemo } from 'react';
import {
  getCard,
  getHonorPointsForCard,
  getLabelForFaction,
} from '../../../utils';
import { CardGroup } from '../detail';

export const useGroupInfo = ({ leader, members }: CardGroup) => {
  const totalCost = useMemo(() => {
    return members.reduce(
      (acc, cur) => {
        return acc + (getCard(cur.id)?.cost || 0);
      },
      getCard(leader.id)?.cost || 0,
    );
  }, [leader, members]);

  const totalHonorPoints = useMemo(() => {
    return members.reduce(
      (acc, cur) => acc + getHonorPointsForCard(getCard(cur.id), cur.level),
      getHonorPointsForCard(getCard(leader.id), leader.level),
    );
  }, [leader, members]);

  const faction = useMemo(() => {
    const card = getCard(leader.id);
    return card ? getLabelForFaction(card.faction) : null;
  }, [leader.id]);

  return {
    totalCost,
    totalHonorPoints,
    faction,
  };
};
