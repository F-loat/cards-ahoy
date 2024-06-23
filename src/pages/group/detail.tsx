import { View, Text, CustomWrapper } from '@tarojs/components';
import { Card, CardType } from '../../types';
import { Button, Dialog, SafeArea } from '@nutui/nutui-react-taro';
import { useRef, useEffect, useState } from 'react';
import Taro, { useLoad, useRouter, useShareAppMessage } from '@tarojs/taro';
import { CardsList } from './components/CardsList';
import { TotalPrice, getPriceForCards } from './components/TotalPrice';
import { PageLoading } from '../../components/PageLoading';
import classnames from 'classnames';
import { formatSkills, getCard, samrtCeil } from '../../utils';
import { LevelSlider } from '../../components/LevelSlider';
import { CloudImage } from '../../components/CloudImage';
import { MembersList } from './components/MembersList';
import { useGroupInfo } from './hooks';

export type Member = { id: number; level?: number };

interface CardGroup {
  leader: Member;
  members: Member[];
}

export type SelectedCard = Card & { level: number; group: boolean };

definePageConfig({
  disableScroll: true,
});

const GroupDetail = () => {
  const [loading, setLoading] = useState(true);
  const [imageLoading, setImageLoading] = useState(true);
  const [priceMap, setPriceMap] = useState<Record<number, number>>({});

  const [leader, setLeader] = useState<CardGroup['leader']>({ id: -1 });
  const [members, setMembers] = useState<CardGroup['members']>(
    Array(8).fill({ id: -1 }),
  );
  const sortedMembers = useRef(members);
  const [selectedCard, setSelectedCard] = useState<SelectedCard | null>(null);

  const { totalCost, totalHonorPoints, faction, bonuses } = useGroupInfo({
    leader,
    members,
  });

  const handleLeaderUpdate = (card: SelectedCard) => {
    setLeader({
      id: card.id,
      level: card.level,
    });
    if (getCard(leader.id).faction !== getCard(card.id).faction) {
      handleMembersUpdate(Array(8).fill({ id: -1 }));
    }
  };

  const handleLeaderDown = () => setLeader({ id: -1 });

  const handleMembersUpdate = (newMembers: Member[]) => {
    setMembers(newMembers);
    sortedMembers.current = newMembers;
  };

  const getUpIndex = (card: SelectedCard) => {
    const index = sortedMembers.current.findIndex(({ id }) => {
      return card.name === getCard(id)?.name;
    });
    if (index !== -1) return index;
    return sortedMembers.current.findIndex(({ id }) => {
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
    const newMembers = [...sortedMembers.current];
    newMembers[index] = {
      id: card.id,
      level: card.level,
    };
    handleMembersUpdate(newMembers);
  };

  const handleMemberDown = (card: SelectedCard) => {
    const newMembers = [...sortedMembers.current];
    const index = newMembers.findIndex(({ id }) => {
      return card.name === getCard(id)?.name;
    });
    if (index === -1) return;
    newMembers[index] = {
      id: -1,
    };
    handleMembersUpdate(newMembers);
  };

  const handleUpdate = (card: SelectedCard) => {
    card.type === CardType.Leaders
      ? handleLeaderUpdate(card)
      : handleMemberUpdate(card);
  };

  const handleSubmit = async () => {
    if (leader.id === -1) {
      Taro.showToast({
        title: '请选择领袖',
        icon: 'none',
      });
      return;
    }
    if (members.every(({ id }) => id === -1)) {
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
        const validMembers = sortedMembers.current.filter(
          ({ id }) => id !== -1,
        );
        const cards = validMembers.concat(leader);

        try {
          const price = Object.values(priceMap).length
            ? Object.values(priceMap).reduce((acc, cur) => acc + cur, 0)
            : await getPriceForCards(cards).then((res) => res.price);
          await Taro.cloud.callFunction({
            name: 'upsertCardGroup',
            data: {
              leader,
              members: validMembers,
              cost: totalCost,
              price: samrtCeil(price),
              honorPoints: totalHonorPoints,
              faction: getCard(leader.id)?.faction,
            },
          });
          Taro.showToast({
            title: '发布成功',
            icon: 'success',
          });
          Taro.eventCenter.trigger('refreshCardGroups');
        } catch (err) {
          Taro.showToast({
            title: '发布失败，请稍后再试',
            icon: 'error',
          });
          console.log(err);
        }
        Dialog.close('submit');
        return Promise.resolve(() => true);
      },
      onCancel: () => {
        Dialog.close('submit');
      },
    });
  };

  useLoad((options) => {
    if (!options.group) return;
    try {
      const value = JSON.parse(options.group) as CardGroup;
      while (value.members.length < 8) {
        value.members.push({ id: -1 });
      }
      setLeader(value.leader);
      handleMembersUpdate(value.members as Member[]);
    } catch (err) {
      console.log(err);
    }
  });

  useEffect(() => {
    setTimeout(() => setLoading(false));
    setTimeout(() => setImageLoading(false), 300);
  }, []);

  useShareAppMessage(() => {
    return {
      title: `卡组分享 - ${faction || '未知'} - ${totalCost}费`,
      path: `/pages/group/detail?group=${JSON.stringify({ leader, members: sortedMembers.current })}`,
    };
  });

  return (
    <View className="h-screen flex flex-col">
      <View className="pt-3 px-3 pb-1">
        <View className="flex items-center px-1">
          <View className="flex justify-center text-sm relative">
            <CloudImage
              width={100}
              height={100}
              radius="10%"
              key={leader.id === -1 ? 0 : 1}
              src={getCard(leader.id)?.image}
              onClick={() => {
                setSelectedCard({
                  ...getCard(leader.id),
                  level: leader.level ?? 1,
                  group: true,
                });
              }}
            />
            {leader.id !== -1 && (
              <View className="absolute bottom-0 left-0 right-0 text-center text-sm text-white">
                {<Text>lv.{leader.level}</Text>}
                {!!priceMap[leader.id] && <Text>/${priceMap[leader.id]}</Text>}
              </View>
            )}
          </View>
          <View className="ml-8 flex flex-col leading-7">
            <View className="flex">
              <View className="w-24">阵营：{faction || '-'}</View>
            </View>
            <View className="flex">
              <View className="w-24">费用：{totalCost}</View>
              <View>荣耀：{totalHonorPoints}</View>
            </View>
            <View className="flex">
              <View className="w-24">加成：{bonuses}%</View>
              <View className="flex items-center">
                <View>成本：</View>
                <TotalPrice
                  group={{ leader, members }}
                  onUpdate={setPriceMap}
                />
              </View>
            </View>
          </View>
        </View>
        <View className="mt-4">
          <MembersList
            data={members}
            priceMap={priceMap}
            onMemberClick={(member) => {
              setSelectedCard({
                ...getCard(member.id),
                level: member.level ?? 1,
                group: true,
              });
            }}
            onSortChange={(members) => (sortedMembers.current = members)}
          />
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
            <CardsList leader={leader} onSelect={setSelectedCard} />
          </CustomWrapper>
        )}
      </View>
      <Dialog
        title={selectedCard?.name}
        visible={!!selectedCard}
        overlay={false}
        style={{
          top: 160,
          boxShadow:
            '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',
        }}
        confirmText={selectedCard?.group ? '下阵' : '上阵'}
        cancelText={selectedCard?.group ? '确认' : '取消'}
        onConfirm={() => {
          const card = selectedCard!;
          if (card.group) {
            card.type === CardType.Leaders
              ? handleLeaderDown()
              : handleMemberDown(card);
          } else {
            handleUpdate(card);
          }
          setSelectedCard(null);
        }}
        onCancel={() => {
          const card = selectedCard!;
          if (card.group) {
            handleUpdate(card);
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
        <View className="flex-1 pl-2 h-8">
          <Button className="w-full" type="primary" onClick={handleSubmit}>
            发布
          </Button>
        </View>
      </View>
      <SafeArea position="bottom" />
      <PageLoading visible={loading || imageLoading} />
    </View>
  );
};

export default GroupDetail;
