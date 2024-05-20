import {
  Button,
  Dialog,
  Divider,
  Empty,
  Image,
  Menu,
  SafeArea,
} from '@nutui/nutui-react-taro';
import { View, Text } from '@tarojs/components';
import Taro, {
  useLoad,
  usePullDownRefresh,
  useRouter,
  useShareAppMessage,
} from '@tarojs/taro';
import { PageLoading } from '../../components/PageLoading';
import { useEffect, useState } from 'react';
import { CardGroup } from './detail';
import { CardFaction, CardFoil } from '../../types';
import { RangeMenuItem } from './components/RangeMenuItem';
import { getCard, getHonorPointsForCard } from '../../utils';
import { CheckboxMenuItem } from '../index/components/CheckboxMenuItem';
import { ThumbsDown, ThumbsUp, Trash } from '@nutui/icons-react-taro';

definePageConfig({
  enablePullDownRefresh: true,
  enableShareTimeline: true,
  enableShareAppMessage: true,
});

const factions = [
  { text: '动物', value: 'Animal' },
  { text: '植物', value: 'Plant' },
  { text: '僵尸', value: 'Zombie' },
  { text: '机械', value: 'Mech' },
  { text: '龙族', value: 'Dragon' },
];

interface Filters {
  faction?: string;
  factions?: string[];
  cost?: [number, number];
  price?: [number, number];
  level?: [number, number];
}

const getBonusesForGroup = (group: CardGroup) => {
  return group.members.reduce(
    (acc, member) =>
      acc + (getCard(member.id)?.foil === CardFoil.Gold ? 10 : 0),
    getCard(group.leader.id)?.foil === CardFoil.Gold ? 10 : 0,
  );
};

const getHonorPointsForGroup = (group: CardGroup) => {
  return group.members.reduce(
    (acc, member) =>
      acc + getHonorPointsForCard(getCard(member.id), member.level),
    getHonorPointsForCard(getCard(group.leader.id), group.leader.level),
  );
};

const Group = () => {
  const [list, setList] = useState<
    (CardGroup & {
      _id: string;
      cost: number;
      price: number;
      faction: CardFaction;
      createAt: number;
      up?: number;
      down?: number;
    })[]
  >([]);

  const [filters, setFilters] = useState<Filters>({
    faction: 'All',
  });

  const { params } = useRouter();
  const [loading, setLoading] = useState(true);

  const fetchCardGroups = async (filters: Filters) => {
    if (!!list.length) {
      Taro.showNavigationBarLoading();
    }

    const res = await Taro.cloud.callFunction({
      name: 'fetchCardGroup',
      data: {
        filters,
        type: params.type,
      },
    });

    const result = res.result as {
      data: CardGroup[];
      total: number;
    };

    setList((result.data as []) || []);
    setLoading(false);
    setFilters(filters);
    Taro.hideNavigationBarLoading();
  };

  const handleVote = async (index: number, type: 'up' | 'down') => {
    try {
      const res = await Taro.cloud.callFunction({
        name: 'voteCardGroup',
        data: {
          id: list[index]._id,
          type,
        },
      });
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
      const newList = [...list];
      newList[index][type] = (newList[index][type] || 0) + 1;
      setList(newList);
    } catch (err) {
      Taro.showToast({
        title: type === 'up' ? '点赞失败，请稍后再试' : '踩失败，请稍后再试',
        icon: 'none',
      });
    }
  };

  const handleDelete = (index: number) => {
    Dialog.open('confirm', {
      title: '确认删除?',
      content: '删除后无法恢复，但分享链接仍然有效',
      onConfirm: async () => {
        Dialog.close('confirm');
        const db = Taro.cloud.database();
        db.collection('card_groups')
          .doc(list[index]?._id)
          .remove({
            success: () => {
              const newList = [...list];
              newList.splice(index, 1);
              setList(newList);
            },
            fail: () => {
              Taro.showToast({
                title: '删除失败，请稍后再试',
                icon: 'none',
              });
            },
          });
        return Promise.resolve(() => true);
      },
      onCancel: () => {
        Dialog.close('confirm');
      },
    });
  };

  useEffect(() => {
    const refreshCardList = () => fetchCardGroups(filters);
    Taro.eventCenter.on('refreshCardGroups', refreshCardList);
    return () => {
      Taro.eventCenter.off('refreshCardGroups', refreshCardList);
    };
  }, []);

  useLoad(() => {
    fetchCardGroups(filters);
  });

  usePullDownRefresh(async () => {
    await fetchCardGroups(filters);
    Taro.stopPullDownRefresh();
  });

  useShareAppMessage(() => {
    return {
      title: '热门卡组',
      path: '/pages/group/index',
    };
  });

  return (
    <View className="flex flex-col h-screen">
      <Menu>
        <CheckboxMenuItem
          title="阵营"
          options={factions}
          onChange={(value) => {
            fetchCardGroups({
              ...filters,
              factions: value,
            });
          }}
        />
        <RangeMenuItem
          title={'费用'}
          min={12}
          max={40}
          children
          onChange={(value) => {
            fetchCardGroups({
              ...filters,
              cost: value,
            });
          }}
        />
        <RangeMenuItem
          title={'成本'}
          min={0}
          max={10000}
          children
          onChange={(value) => {
            fetchCardGroups({
              ...filters,
              price: value,
            });
          }}
        />
        <RangeMenuItem
          title={'等级'}
          min={1}
          max={10}
          children
          onChange={(value) => {
            fetchCardGroups({
              ...filters,
              level: value,
            });
          }}
        />
      </Menu>
      <View className="flex-1 overflow-scroll px-3 py-4">
        {list.map((item, index) => (
          <View key={item._id}>
            <View className="flex justify-between">
              <View
                className="relative"
                onClick={() => {
                  Taro.navigateTo({
                    url: `/pages/group/detail?id=${item._id}`,
                  });
                }}
              >
                <View className="relative">
                  <Image
                    width={92}
                    height={92}
                    radius="10%"
                    lazyLoad
                    src={getCard(item.leader.id)?.image}
                  />
                  <View className="absolute bottom-0 left-0 right-0 text-center text-white text-sm leading-4">
                    <Text>lv.{item.leader.level}</Text>
                  </View>
                </View>
                <View className="text-xs flex justify-between -ml-1">
                  <Text>总{item.cost}费</Text>
                  <Text>${item.price}*</Text>
                </View>
                <View className="text-xs break-keep absolute -bottom-3 -left-1 -right-4">
                  {getHonorPointsForGroup(item)}点/加成
                  {getBonusesForGroup(item)}%
                </View>
              </View>
              <View
                className="grid gap-3 grid-cols-4 h-full"
                onClick={() => {
                  Taro.navigateTo({
                    url: `/pages/group/detail?id=${item._id}`,
                  });
                }}
              >
                {item.members
                  .filter((member) => member.id !== -1)
                  .map((member) => (
                    <View
                      key={member.id}
                      className="relative flex justify-center"
                    >
                      <Image
                        width={50}
                        height={50}
                        radius="10%"
                        lazyLoad
                        src={getCard(member.id)?.image}
                      />
                      {!!member.level && (
                        <View className="absolute bottom-0 leading-3 left-0 right-0 text-center text-xs text-white">
                          <Text>lv.{member.level}</Text>
                        </View>
                      )}
                    </View>
                  ))}
              </View>
              <View className="flex flex-col justify-center items-center text-xs text-center w-4 pt-1.5">
                <View onClick={() => handleVote(index, 'up')}>
                  <ThumbsUp size={16} className="text-green-500" />
                  <View className="mb-1">{item.up || 0}</View>
                </View>
                {params.type === 'self' ? (
                  <View onClick={() => handleDelete(index)}>
                    <Trash size={16} className="text-red-500" />
                  </View>
                ) : (
                  <View onClick={() => handleVote(index, 'down')}>
                    <ThumbsDown size={16} className="text-red-500" />
                  </View>
                )}
              </View>
            </View>
            <Divider />
          </View>
        ))}
        {!loading && !list.length && (
          <View className="h-full flex items-center justify-center">
            <Empty style={{ background: 'transparent' }} className="-mt-24" />
          </View>
        )}
        {!!list.length && (
          <View className="text-sm text-center text-gray-400 dark:text-gray-600">
            {list.length >= 50 ? '仅展示前50条数据~' : '没有更多了~'}
          </View>
        )}
      </View>
      <View className="p-2">
        <Button
          block
          type="primary"
          onClick={() => Taro.navigateTo({ url: '/pages/group/detail' })}
        >
          创建卡组
        </Button>
      </View>
      <Dialog id="confirm" />
      <SafeArea position="bottom" />
      <PageLoading visible={loading && !list.length} />
    </View>
  );
};

export default Group;
