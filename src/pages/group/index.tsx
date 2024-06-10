import {
  Button,
  Dialog,
  Divider,
  Empty,
  Menu,
  SafeArea,
} from '@nutui/nutui-react-taro';
import { View } from '@tarojs/components';
import Taro, {
  useLoad,
  usePullDownRefresh,
  useRouter,
  useShareAppMessage,
} from '@tarojs/taro';
import { PageLoading } from '../../components/PageLoading';
import { useEffect, useRef, useState } from 'react';
import { Member } from './detail';
import { CardFaction } from '../../types';
import { RangeMenuItem } from './components/RangeMenuItem';
import { CheckboxMenuItem } from '../index/components/CheckboxMenuItem';
import { GroupItem } from './components/GroupItem';

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

enum SortType {
  CreateAt = 0,
  Up = 1,
}

const sorts = [
  { text: '创建时间', value: SortType.CreateAt },
  { text: '点赞数量', value: SortType.Up },
];

interface Filters {
  faction?: string;
  factions?: string[];
  cost?: [number, number];
  level?: [number, number];
  sort?: number;
}

export type CardGroup = {
  _id: string;
  cost: number;
  price: number;
  faction: CardFaction;
  createAt: number;
  leader: Member;
  members: Member[];
  up?: number;
  down?: number;
};

const Group = () => {
  const [list, setList] = useState<CardGroup[]>([]);

  const [filters, setFilters] = useState<Filters>({
    faction: 'All',
    sort: SortType.CreateAt,
  });
  const filtersRef = useRef(filters);

  const { params } = useRouter();
  const [loading, setLoading] = useState(true);

  filtersRef.current = filters;

  const fetchCardGroups = async (filters: Filters) => {
    if (!!list.length) {
      Taro.showNavigationBarLoading();
    }

    const res = await Taro.cloud.callFunction({
      name: 'fetchCardGroup',
      data: {
        filters,
        type: params.type,
        pageNumber: 1,
        pageSize: 30,
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

  const handleVoteSuccess = async (item: CardGroup, type: 'up' | 'down') => {
    const index = list.findIndex((i) => i._id === item._id);
    if (index === -1) return;
    const newList = [...list];
    newList[index][type] = (newList[index][type] || 0) + 1;
    setList(newList);
  };

  const handleDeleteSuccess = (item: CardGroup) => {
    const index = list.findIndex((i) => i._id === item._id);
    if (index === -1) return;
    const newList = [...list];
    newList.splice(index, 1);
    setList(newList);
  };

  useEffect(() => {
    const refreshCardList = () => fetchCardGroups(filtersRef.current);
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
        <Menu.Item
          title="排序"
          options={sorts}
          defaultValue={filters.sort}
          onChange={({ value }) => {
            fetchCardGroups({
              ...filters,
              sort: value,
            });
          }}
        />
      </Menu>
      <View className="flex-1 overflow-scroll px-2 py-4">
        {list.map((item) => (
          <View key={item._id}>
            <GroupItem
              item={item}
              onVoteSuccess={handleVoteSuccess}
              onDeleteSuccess={handleDeleteSuccess}
            />
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
            {list.length >= 30 ? '仅展示前30条数据~' : '没有更多了~'}
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
