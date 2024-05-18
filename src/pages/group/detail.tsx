import { View, Text, CustomWrapper } from '@tarojs/components';
import { Card, CardRarity, CardType } from '../../types';
import { Button, Dialog, Image, SafeArea } from '@nutui/nutui-react-taro';
import { useEffect, useMemo, useState } from 'react';
import Taro, { useLoad, useRouter, useShareAppMessage } from '@tarojs/taro';
import { CardsList } from './components/CardsList';
import { TotalPrice, getPriceForCards } from './components/TotalPrice';
import { PageLoading } from '../../components/PageLoading';
import classnames from 'classnames';
import {
  formatSkills,
  getCard,
  getHonorPointsForCard,
  getLabelForFaction,
  samrtCeil,
} from '../../utils';
import { LevelSlider } from '../../components/LevelSlider';
import { CardImage } from './components/CardImage';

export interface CardGroup {
  leader: { id: number; level?: number };
  members: { id: number; level?: number }[];
}

export type SelectedCard = Card & { level: number; group: boolean };

const GroupDetail = () => {
  const [group, setGroup] = useState<CardGroup>({
    leader: { id: -1 },
    members: Array(8).fill({ id: -1 }),
  });
  const { params } = useRouter();
  const [loading, setLoading] = useState(true);
  const [imageLoading, setImageLoading] = useState(true);
  const [priceMap, setPriceMap] = useState<Record<number, number>>({});
  const [selectedCard, setSelectedCard] = useState<SelectedCard | null>(null);

  const totalCost = useMemo(() => {
    return group.members.reduce(
      (acc, cur) => {
        return acc + (getCard(cur.id)?.cost || 0);
      },
      getCard(group.leader.id)?.cost || 0,
    );
  }, [group]);

  const totalHonorPoints = useMemo(() => {
    return group.members.reduce(
      (acc, cur) => acc + getHonorPointsForCard(getCard(cur.id), cur.level),
      getHonorPointsForCard(getCard(group.leader.id), group.leader.level),
    );
  }, [group]);

  const faction = useMemo(() => {
    const card = getCard(group.leader.id);
    return card ? getLabelForFaction(card.faction) : null;
  }, [group.leader.id]);

  const handleLeaderUpdate = (card: SelectedCard) => {
    setGroup({
      leader: {
        id: card.id,
        level: card.level,
      },
      members:
        getCard(group.leader.id).faction === getCard(card.id).faction
          ? group.members
          : Array(8).fill({ id: -1 }),
    });
  };

  const handleLeaderDown = () => {
    setGroup({
      leader: { id: -1 },
      members: group.members,
    });
  };

  const getUpIndex = (card: SelectedCard) => {
    const index = group.members.findIndex(({ id }) => {
      return card.name === getCard(id)?.name;
    });
    if (index !== -1) return index;
    return group.members.findIndex(({ id }) => {
      return id === -1;
    });
  };

  const handleMemberUpdate = (card: SelectedCard) => {
    const index = getUpIndex(card);
    if (index === -1) {
      Taro.showToast({
        title: '阵容已满，请先下阵部分成员',
        icon: 'none',
      });
      return;
    }
    const newMembers = [...group.members];
    newMembers[index] = {
      id: card.id,
      level: card.level,
    };
    setGroup({
      leader: group.leader,
      members: newMembers,
    });
  };

  const handleMemberDown = (card: SelectedCard) => {
    const newMembers = [...group.members];
    const index = newMembers.findIndex(({ id }) => {
      return card.name === getCard(id)?.name;
    });
    if (index === -1) return;
    newMembers[index] = {
      id: -1,
    };
    setGroup({
      leader: group.leader,
      members: newMembers,
    });
  };

  const handleSubmit = async () => {
    if (group.leader.id === -1) {
      Taro.showToast({
        title: '请选择领袖',
        icon: 'none',
      });
      return;
    }
    if (group.members.every(({ id }) => id === -1)) {
      Taro.showToast({
        title: '请至少选择一个成员',
        icon: 'none',
      });
      return;
    }
    Dialog.open('submit', {
      title: '确认发布?',
      content: '每人每天可以发布一套卡组配置，多次发布则覆盖历史版本',
      onConfirm: async () => {
        Dialog.close('submit');

        const members = group.members.filter(({ id }) => id !== -1);
        const cards = members.concat(group.leader);

        Taro.showLoading({
          title: '发布中',
        });
        try {
          const price = Object.values(priceMap).length
            ? Object.values(priceMap).reduce((acc, cur) => acc + cur, 0)
            : await getPriceForCards(cards).then((res) => res.price);
          await Taro.cloud.callFunction({
            name: 'upsertCardGroup',
            data: {
              leader: group.leader,
              members,
              cost: totalCost,
              price: samrtCeil(price),
              honorPoints: totalHonorPoints,
              faction: getCard(group.leader.id)?.faction,
            },
          });
          Taro.hideLoading();
          Taro.showToast({
            title: '发布成功',
            icon: 'success',
          });
          Taro.eventCenter.trigger('refreshCardGroups');
        } catch (error) {
          Taro.hideLoading();
          Taro.showToast({
            title: '发布失败，请稍后再试',
            icon: 'error',
          });
          console.log(error);
        }
        return Promise.resolve(() => true);
      },
      onCancel: () => {
        Dialog.close('submit');
      },
    });
  };

  useLoad((options) => {
    if (options.id) {
      const db = Taro.cloud.database();
      db.collection('card_groups')
        .doc(options.id)
        .get({})
        .then(({ data }) => {
          setGroup({
            leader: data.leader,
            members: Array(8)
              .fill({ id: -1 })
              .map((m, idx) => data.members[idx] || m),
          });
        })
        .catch((err) => {
          Taro.showToast({
            title: '获取卡组失败，请稍后再试',
            icon: 'none',
          });
          console.log(err);
        });
      return;
    }
    if (!options.group) return;
    try {
      const value = JSON.parse(options.group) as
        | CardGroup
        | {
            leader: number;
            members: number[];
          };
      if (typeof value.leader !== 'number') {
        setGroup(value as CardGroup);
        return;
      }
      setGroup({
        leader: { id: value.leader },
        members: value.members.map((id) => {
          return { id } as { id: number };
        }),
      });
    } catch (error) {
      console.log(error);
    }
  });

  useEffect(() => {
    setTimeout(() => setLoading(false));
    setTimeout(() => setImageLoading(false), 600);
  }, []);

  useShareAppMessage(() => {
    return {
      title: `卡组分享 - ${faction} - ${totalCost}费`,
      path: `/pages/group/detail?group=${JSON.stringify(group)}`,
    };
  });

  return (
    <View className="h-screen flex flex-col">
      <View className="p-3">
        <View className="flex items-center px-1">
          <View className="flex justify-center text-sm relative">
            <Image
              width={100}
              height={100}
              radius="10%"
              key={group.leader.id === -1 ? 0 : 1}
              src={getCard(group.leader.id)?.image}
              onClick={() => {
                setSelectedCard({
                  ...getCard(group.leader.id),
                  level: group.leader.level ?? 1,
                  group: true,
                });
              }}
            />
            {group.leader.id !== -1 && (
              <View className="absolute bottom-0 left-0 right-0 text-center text-sm text-white">
                <Text>lv.{group.leader.level}</Text>
                {!!priceMap[group.leader.id] && (
                  <Text>/${priceMap[group.leader.id]}</Text>
                )}
              </View>
            )}
          </View>
          <View className="ml-8 flex flex-col leading-7">
            <View className="w-24">阵营：{faction || '-'}</View>
            <View>
              总费用：{totalCost} 荣耀点：{totalHonorPoints}
            </View>
            <View className="flex items-center">
              <View>总成本：</View>
              <CustomWrapper>
                <TotalPrice group={group} onUpdate={setPriceMap} />
              </CustomWrapper>
            </View>
          </View>
        </View>
        <View className="mt-1 grid gap-2 grid-cols-4">
          {group.members.map((member, index) => (
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
                setSelectedCard({
                  ...getCard(member.id),
                  level: member.level ?? 1,
                  group: true,
                });
              }}
            />
          ))}
        </View>
      </View>
      <View
        className={classnames(
          'flex-1 overflow-scroll transition-opacity duration-300',
          imageLoading ? 'opacity-0' : 'opacity-100',
        )}
      >
        {!loading && (
          <CustomWrapper>
            <CardsList group={group} onSelect={setSelectedCard} />
          </CustomWrapper>
        )}
      </View>
      <Dialog
        title={selectedCard?.name}
        visible={!!selectedCard}
        confirmText={selectedCard?.group ? '确认' : '上阵'}
        cancelText={selectedCard?.group ? '下阵' : '取消'}
        onConfirm={() => {
          const card = selectedCard!;
          card.type === CardType.Leaders
            ? handleLeaderUpdate(card)
            : handleMemberUpdate(card);
          setSelectedCard(null);
        }}
        onCancel={() => {
          const card = selectedCard!;
          if (card.group) {
            card.type === CardType.Leaders
              ? handleLeaderDown()
              : handleMemberDown(card);
          }
          setSelectedCard(null);
        }}
        onOverlayClick={() => {
          setSelectedCard(null);
        }}
      >
        {!!selectedCard && (
          <View>{formatSkills(selectedCard.skills, selectedCard?.level)}</View>
        )}
        <View className="flex items-center mt-4">
          <View>等级：</View>
          <LevelSlider
            value={selectedCard?.level}
            onChange={(val) =>
              setSelectedCard({
                ...selectedCard!,
                level: Number(val),
              })
            }
          />
        </View>
      </Dialog>
      <Dialog id="submit" />
      <View className="p-2 flex">
        <View className="flex-1 h-8">
          <Button className="w-full" openType="share">
            分享
          </Button>
        </View>
        {!params.id && (
          <View className="flex-1 pl-2 h-8">
            <Button className="w-full" type="primary" onClick={handleSubmit}>
              发布
            </Button>
          </View>
        )}
      </View>
      <SafeArea position="bottom" />
      <PageLoading visible={loading || imageLoading} />
    </View>
  );
};

export default GroupDetail;
