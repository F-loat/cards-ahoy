import { useEffect, useState } from 'react';
import { View } from '@tarojs/components';
import {
  Checkbox,
  ConfigProvider,
  Divider,
  Image,
  Loading,
  Menu,
  SafeArea,
} from '@nutui/nutui-react-taro';
import { Checklist, Purse } from '@nutui/icons-react-taro';
import Taro, {
  usePullDownRefresh,
  useReachBottom,
  useShareAppMessage,
} from '@tarojs/taro';
import { Cost, CostPopup } from './components/CostPopup';
import ToolsNav from './components/ToolsNav';
import { Filters, useCardList } from './hooks';
import { PageLoading } from '../../components/PageLoading';
import { samrtCeil } from '../../utils';
import classnames from 'classnames';
import { BannerAd } from '../../components/BannerAd';
import { CheckboxMenuItem } from './components/CheckboxMenuItem';

definePageConfig({
  navigationBarTitleText: 'Cards Ahoy!',
  enablePullDownRefresh: true,
  enableShareTimeline: true,
  enableShareAppMessage: true,
});

const getProfit = (floorPrice: string, costList: Cost[]) => {
  const totalCost = costList.reduce((acc, cur) => {
    return acc + Number(cur.price) * cur.count;
  }, 0);
  const totalCount = costList.reduce((acc, cur) => {
    return acc + cur.count;
  }, 0);
  return samrtCeil(totalCount * Number(floorPrice) - totalCost);
};

const Profit = ({ value }: { value: number }) => {
  return (
    <View
      className={`text-sm ${value > 0 ? 'text-green-500' : 'text-red-500'}`}
    >
      ${Math.abs(value)}
    </View>
  );
};

const factions = [
  { text: '中立', value: 'Neutral' },
  { text: '动物', value: 'Animal' },
  { text: '植物', value: 'Plant' },
  { text: '僵尸', value: 'Zombie' },
  { text: '机械', value: 'Mech' },
  { text: '龙族', value: 'Dragon' },
];

const sorts = [
  { text: '地板价降序', value: 1 },
  { text: '地板价升序', value: 0 },
];

const Index = () => {
  const [costMap, setCostMap] = useState<Record<string, Cost[]>>(
    Taro.getStorageSync('costMap') || {},
  );

  const [filters, setFilters] = useState<Filters>(
    Taro.getStorageSync('filters') || {
      sort: 1,
    },
  );

  const {
    list,
    loading,
    pagination,
    isLoadAll,
    runAsync: fetchCardList,
  } = useCardList();

  const [popupConfig, setPopupConfig] = useState<{
    visible: boolean;
    cardId?: number;
  }>({
    visible: false,
  });

  useEffect(() => {
    if (!!list.length) {
      Taro.showNavigationBarLoading();
    }
    fetchCardList({
      pageNumber: 1,
      filters,
    }).finally(() => {
      Taro.hideNavigationBarLoading();
    });
    Taro.setStorage({ key: 'filters', data: filters });
  }, [filters]);

  usePullDownRefresh(async () => {
    await fetchCardList({
      pageNumber: 1,
      filters,
    });
    Taro.stopPullDownRefresh();
  });

  useReachBottom(() => {
    fetchCardList({
      pageNumber: pagination.current + 1,
      filters,
    });
  });

  useShareAppMessage(() => {
    return {
      title: 'Cards Ahoy!',
      path: '/pages/index/index',
    };
  });

  return (
    <>
      <View className="fixed top-0 left-0 right-0 z-10">
        <Menu>
          <CheckboxMenuItem
            title="阵营"
            options={factions}
            onChange={(value) => {
              setFilters({
                ...filters,
                factions: value,
              });
            }}
          />
          <Menu.Item
            options={sorts}
            defaultValue={filters.sort}
            onChange={({ value }) => {
              setFilters({
                ...filters,
                sort: value,
              });
            }}
          />
        </Menu>
      </View>
      <View className="px-2 pt-17 pb-2">
        <View
          className={classnames(
            'ftransition-opacity duration-300',
            loading && !list.length ? 'opacity-0' : 'opacity-100',
          )}
        >
          {list.map((item, index) => (
            <View key={item.secondaryId}>
              {!(index % 12) && <BannerAd unitId="adunit-b303bbcdf81e9676" />}
              <View
                className="flex items-center mx-1"
                onClick={() => {
                  Taro.navigateTo({
                    url: `/pages/detail/index?id=${item.secondaryId}&price=${item.floorPrice}&time=${item.time}`,
                  });
                }}
              >
                <Image
                  src={item.image}
                  width={64}
                  height={64}
                  radius="10%"
                  lazyLoad
                />
                <View className="ml-3 flex-1">
                  <View className="flex items-center">
                    <View>{item.secondaryName}</View>
                    <View className="text-xs ml-2 text-gray-600 dark:text-gray-400">
                      x{item.quantity}
                    </View>
                  </View>
                  <View className="flex items-center">
                    <View className="text-sm">${item.floorPrice}</View>
                    <View className="text-xs ml-2 text-gray-600 dark:text-gray-400">
                      已售 {item.volume}
                    </View>
                  </View>
                </View>
                <View
                  className="flex items-center p-2 text-gray-600 dark:text-gray-400"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPopupConfig({
                      visible: true,
                      cardId: item.secondaryId,
                    });
                  }}
                >
                  {costMap[item.secondaryId] && (
                    <Profit
                      value={getProfit(
                        item.floorPrice,
                        costMap[item.secondaryId],
                      )}
                    />
                  )}
                  <Purse width={20} className="ml-2" />
                </View>
              </View>
              <Divider />
            </View>
          ))}
        </View>
        <View className="flex justify-center items-center h-6">
          {loading && !!list.length && (
            <ConfigProvider theme={{ nutuiLoadingIconSize: '20px' }}>
              <Loading type="spinner" />
            </ConfigProvider>
          )}
          {!loading && isLoadAll && (
            <View className="text-sm text-gray-400 dark:text-gray-600">
              没有更多了~
            </View>
          )}
        </View>
        <CostPopup
          cardId={popupConfig.cardId!}
          visible={popupConfig.visible}
          onClose={() => {
            setPopupConfig({ visible: false });
            setCostMap(Taro.getStorageSync('costMap'));
          }}
        />
        <ToolsNav
          onUpdate={() => {
            setCostMap(Taro.getStorageSync('costMap'));
          }}
        />
        <SafeArea position="bottom" />
        <PageLoading visible={loading && !list.length} />
      </View>
    </>
  );
};

export default Index;
