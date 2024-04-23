import {
  Button,
  Divider,
  Empty,
  Image,
  Menu,
  SafeArea,
} from '@nutui/nutui-react-taro';
import { View, Text } from '@tarojs/components';
import Taro, {
  useDidShow,
  usePullDownRefresh,
  useShareAppMessage,
} from '@tarojs/taro';
import { PageLoading } from '../../components/PageLoading';
import { useState } from 'react';
import { CardGroup } from './detail';
import { CardFaction, CardFoil, cardsMap } from '../../assets/cards';
import { RangeMenuItem } from './components/RangeMenuItem';
import { BannerAd } from '../../components/BannerAd';
import { getHonorPointsForCard } from '../../utils';
import { CheckboxMenuItem } from '../index/components/CheckboxMenuItem';

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
      acc + (cardsMap[member.id]?.foil === CardFoil.Gold ? 10 : 0),
    cardsMap[group.leader.id]?.foil === CardFoil.Gold ? 10 : 0,
  );
};

const getHonorPointsForGroup = (group: CardGroup) => {
  return group.members.reduce(
    (acc, member) =>
      acc + getHonorPointsForCard(cardsMap[member.id], member.level),
    getHonorPointsForCard(cardsMap[group.leader.id], group.leader.level),
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
    })[]
  >([]);

  const [filters, setFilters] = useState<Filters>({
    faction: 'All',
  });

  const [loading, setLoading] = useState(true);

  const fetchCardList = async (filters: Filters) => {
    if (!!list.length) {
      Taro.showNavigationBarLoading();
    }

    const res = await Taro.cloud.callFunction({
      name: 'fetchCardGroup',
      data: {
        filters,
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

  useDidShow(() => {
    fetchCardList(filters);
  });

  usePullDownRefresh(async () => {
    await fetchCardList(filters);
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
            fetchCardList({
              ...filters,
              factions: value,
            });
          }}
        />
        <RangeMenuItem
          title={'费用'}
          min={12}
          max={48}
          children
          onChange={(value) => {
            fetchCardList({
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
            fetchCardList({
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
            fetchCardList({
              ...filters,
              level: value,
            });
          }}
        />
      </Menu>
      <View className="flex-1 overflow-scroll px-2 py-4">
        {list.map((item, index) => (
          <View
            key={item._id}
            onClick={() => {
              Taro.navigateTo({
                url: `/pages/group/detail?id=${item._id}`,
              });
            }}
          >
            {!(index % 12) && <BannerAd unitId="adunit-e5f0ea53dd9c52ba" />}
            <View className="flex justify-around">
              <View className="relative h-28 pb-1">
                <Image
                  width={92}
                  height={92}
                  radius="10%"
                  lazyLoad
                  src={cardsMap[item.leader.id]?.image}
                />
                <View className="text-xs flex justify-between -mx-1">
                  <Text>总{item.cost}费</Text>
                  <Text>${item.price}*</Text>
                </View>
                <View className="absolute -bottom-1 -left-1 -right-8 text-xs break-keep">
                  {getHonorPointsForGroup(item)}点/加成
                  {getBonusesForGroup(item)}%
                </View>
                <View className="absolute bottom-6 left-0 right-0 text-center text-white text-sm">
                  <Text>lv.{item.leader.level}</Text>
                </View>
              </View>
              <View className="flex flex-col">
                <View className="grid gap-3 grid-cols-4">
                  {item.members
                    .filter((member) => member.id !== -1)
                    .map((member) => (
                      <View
                        key={member.id}
                        className="relative flex justify-center"
                      >
                        <Image
                          width={52}
                          height={52}
                          radius="10%"
                          lazyLoad
                          src={cardsMap[member.id]?.image}
                        />
                        {!!member.level && (
                          <View className="absolute bottom-0 -mb-px left-0 right-0 text-center text-xs text-white">
                            <Text>lv.{member.level}</Text>
                          </View>
                        )}
                      </View>
                    ))}
                </View>
              </View>
            </View>
            <Divider />
          </View>
        ))}
        {!loading && !list.length && (
          <View className="h-full flex items-center justify-center">
            <Empty style={{ background: 'transparent' }} />
          </View>
        )}
        {!!list.length && (
          <View className="text-sm text-center text-gray-400 dark:text-gray-600">
            没有更多了~
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
      <SafeArea position="bottom" />
      <PageLoading visible={loading && !list.length} />
    </View>
  );
};

export default Group;
