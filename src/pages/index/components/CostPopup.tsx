import {
  ConfigProvider,
  Input,
  InputNumber,
  Dialog,
} from '@nutui/nutui-react-taro';
import { ScrollView, View } from '@tarojs/components';
import { useEffect, useMemo, useState } from 'react';
import { CardProfit, getProfit } from './CardProfit';
import { samrtCeil } from '../../../utils';
import classNames from 'classnames';

export interface Cost {
  price?: string;
  count: number;
}

export const CostPopup = ({
  value,
  visible,
  floorPrice,
  onChange,
  onClose,
}: {
  value: Cost[];
  visible?: boolean;
  floorPrice?: string;
  onChange?: (costs?: Cost[]) => void;
  onClose?: () => void;
}) => {
  const defaultCost = {
    price: undefined,
    count: 1,
  };
  const [costList, setCostList] = useState<Cost[]>([defaultCost]);

  const totalProfit = useMemo(() => {
    if (!floorPrice) return 0;
    return getProfit(
      floorPrice,
      costList.filter((item) => !!item.price),
    );
  }, [floorPrice, costList]);

  const handleSubmit = () => {
    const result = costList.filter((item) => item.count && Number(item.price));
    onChange?.(result.length ? result : undefined);
  };

  useEffect(() => {
    if (visible) {
      setCostList(value || [defaultCost]);
    } else {
      setCostList([defaultCost]);
    }
  }, [visible]);

  return (
    <Dialog
      title="购入成本"
      visible={visible}
      cancelText="新增"
      confirmText="保存"
      onCancel={() => setCostList([...costList, defaultCost])}
      onConfirm={handleSubmit}
      onOverlayClick={onClose}
    >
      <ScrollView style={{ height: '32vh' }} scrollY>
        <ConfigProvider
          theme={{
            nutuiInputPadding: '10px',
            nutuiInputnumberInputWidth: '36px',
            nutuiInputnumberButtonWidth: '24px',
            nutuiInputnumberButtonHeight: '24px',
            nutuiInputnumberButtonBackgroundColor: '#f4f4f4',
            nutuiInputnumberInputBackgroundColor: '#fff',
            nutuiInputnumberInputMargin: '0 2px',
          }}
        >
          {costList.map((item, index) => (
            <View key={index} className="flex items-center">
              <View className="text-gray-600 dark:text-gray-400 text-sm">
                $
              </View>
              <Input
                placeholder="请输入价格"
                type="digit"
                value={item.price}
                onChange={(val) => {
                  const newVal = [...costList];
                  newVal[index].price = val;
                  setCostList(newVal);
                }}
              />
              {!!floorPrice && (
                <CardProfit
                  value={samrtCeil(
                    (Number(floorPrice) - Number(item.price || 0)) * item.count,
                  )}
                  className={classNames('mx-2 min-w-12 text-center', {
                    invisible: !item.price,
                  })}
                />
              )}
              <InputNumber
                className="nut-input-text"
                placeholder="数量"
                min={0}
                value={item.count}
                onChange={(val) => {
                  const newVal = [...costList];
                  newVal[index].count = Number(val);
                  setCostList(newVal);
                }}
              />
            </View>
          ))}
          {!!totalProfit && (
            <View className="flex items-center justify-end mt-2">
              <View>合计：</View>
              <CardProfit value={totalProfit} className="mx-2" />
            </View>
          )}
        </ConfigProvider>
      </ScrollView>
    </Dialog>
  );
};
