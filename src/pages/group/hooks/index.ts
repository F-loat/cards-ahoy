import { useMemo, useState } from 'react';
import {
  getBonusesForGroup,
  getCard,
  getHonorPointsForCard,
  getLabelForFaction,
} from '../../../utils';
import { Member } from '../detail';
import Taro from '@tarojs/taro';

export const useGroupInfo = ({
  leader,
  members,
}: {
  leader: Member;
  members: Member[];
}) => {
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

  const bonuses = useMemo(
    () => getBonusesForGroup({ leader, members }),
    [leader, members],
  );

  return {
    totalCost,
    totalHonorPoints,
    faction,
    bonuses,
  };
};

export const useGroupVote = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const runAsync = async (id: string, type: 'up' | 'down') => {
    try {
      setLoading(type);
      const res = await Taro.cloud.callFunction({
        name: 'voteCardGroup',
        data: {
          id,
          type,
        },
      });
      setLoading(null);
      const result = res.result as {
        code: number;
        msg: string;
      };
      if (result.code === 0) {
        Taro.showToast({
          title: result.msg,
          icon: 'none',
        });
        return;
      }
      return true;
    } catch (err) {
      setLoading(null);
      Taro.showToast({
        title: type === 'up' ? '点赞失败，请稍后再试' : '踩失败，请稍后再试',
        icon: 'none',
      });
    }
  };

  return {
    loading,
    runAsync,
  };
};
