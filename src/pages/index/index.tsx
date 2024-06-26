import { useEffect, useState } from 'react';
import { View } from '@tarojs/components';
import {
  ConfigProvider,
  Divider,
  Loading,
  Menu,
  SafeArea,
} from '@nutui/nutui-react-taro';
import { Purse } from '@nutui/icons-react-taro';
import Taro, {
  usePullDownRefresh,
  useReachBottom,
  useShareAppMessage,
} from '@tarojs/taro';
import { CostPopup } from './components/CostPopup';
import ToolsNav from './components/ToolsNav';
import { Filters, useCardList } from './hooks';
import { PageLoading } from '../../components/PageLoading';
import classnames from 'classnames';
import { CheckboxMenuItem } from './components/CheckboxMenuItem';
import { CardFaction, CardFoil, CardRarity, CardType } from '../../types';
import { Notice } from './components/Notice';
import { useNotice } from './hooks/notice';
import { CloudImage } from '../../components/CloudImage';
import { SwiperBanner } from './components/SwiperBanner';
import { useCardCost } from './hooks/cost';
import { CardProfit, getProfit } from './components/CardProfit';

definePageConfig({
  navigationBarTitleText: 'Cards Ahoy!',
  enablePullDownRefresh: true,
  enableShareTimeline: true,
  enableShareAppMessage: true,
});

const types = [
  { text: '领袖', value: CardType.Leaders },
  { text: '成员', value: CardType.Members },
  { text: '金卡', value: CardFoil.Gold },
  { text: '白卡', value: CardFoil.Regular },
];

const factions = [
  { text: '中立', value: CardFaction.Neutral },
  { text: '动物', value: CardFaction.Animal },
  { text: '植物', value: CardFaction.Plant },
  { text: '僵尸', value: CardFaction.Zombie },
  { text: '机械', value: CardFaction.Mech },
  { text: '龙族', value: CardFaction.Dragon },
];

const rarities = [
  { text: '普通', value: CardRarity.Common },
  { text: '稀有', value: CardRarity.Rare },
  { text: '史诗', value: CardRarity.Epic },
  { text: '传说', value: CardRarity.Legendary },
  { text: '神话', value: CardRarity.Mythic },
];

const sorts = [
  { text: '地板价降序', value: 1 },
  { text: '地板价升序', value: 0 },
];

const Index = () => {
  const {
    data: notice,
    loading: noticeLoading,
    runAsync: fetchNotice,
  } = useNotice();

  const [filters, setFilters] = useState<Filters>(
    Taro.getStorageSync('filters') || {
      sort: 1,
    },
  );

  const { costMap, costPopup, setCostPopup, updateCostMap } = useCardCost();

  const {
    list,
    loading,
    pagination,
    isLoadAll,
    run: fetchCardList,
  } = useCardList();

  useEffect(() => {
    if (loading) Taro.hideNavigationBarLoading();
  }, [loading]);

  useEffect(() => {
    Taro.showNavigationBarLoading();
    fetchCardList({
      pageNumber: 1,
      filters,
    }).then(() => {
      Taro.hideNavigationBarLoading();
    });
    Taro.setStorage({ key: 'filters', data: filters });
  }, [filters]);

  usePullDownRefresh(async () => {
    fetchNotice();
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
            defaultValue={filters.factions}
            onChange={(value) => {
              setFilters({
                ...filters,
                factions: value,
              });
            }}
          />
          <CheckboxMenuItem
            title="种类"
            options={types}
            defaultValue={filters.types}
            onChange={(value) => {
              setFilters({
                ...filters,
                types: value,
              });
            }}
          />
          <CheckboxMenuItem
            title="稀有度"
            options={rarities}
            defaultValue={filters.rarities}
            onChange={(value) => {
              setFilters({
                ...filters,
                rarities: value,
              });
            }}
          />
          <Menu.Item
            title="排序"
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
      <View className="px-2 pt-17 pb-3">
        <View
          className={classnames(
            'ftransition-opacity duration-300',
            loading && !list.length ? 'opacity-0' : 'opacity-100',
          )}
        >
          <Notice notice={notice} loading={noticeLoading} />
          <SwiperBanner filters={filters} />
          {list.map((item) => (
            <View key={item.secondaryId}>
              <View
                className="flex items-center mx-1"
                onClick={() => {
                  Taro.navigateTo({
                    url: `/pages/detail/index?id=${item.secondaryId}&price=${item.floorPrice}&time=${item.time}`,
                  });
                }}
              >
                <CloudImage
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
                    setCostPopup({
                      visible: true,
                      cardId: item.secondaryId,
                      floorPrice: item.floorPrice,
                    });
                  }}
                >
                  {costMap[item.secondaryId] && (
                    <CardProfit
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
          {!!list.length && isLoadAll && (
            <View className="text-sm text-gray-400 dark:text-gray-600">
              没有更多了~
            </View>
          )}
        </View>
        <CostPopup
          visible={costPopup.visible}
          value={costMap[costPopup.cardId!]}
          floorPrice={costPopup.floorPrice}
          onChange={(value) => {
            updateCostMap({ ...costMap, [costPopup.cardId!]: value });
            setCostPopup({ visible: false });
          }}
          onClose={() => setCostPopup({ visible: false })}
        />
        <ToolsNav />
        <SafeArea position="bottom" />
        <PageLoading visible={loading && !list.length} />
      </View>
    </>
  );
};

export default Index;
