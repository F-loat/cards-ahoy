import {
  Button,
  ConfigProvider,
  Input,
  InputNumber,
  Dialog,
  Space,
} from '@nutui/nutui-react-taro';
import { ScrollView, View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useEffect, useState } from 'react';

export interface Cost {
  price?: string;
  count: number;
}

export const CostPopup = ({
  cardId,
  visible,
  onClose,
}: {
  cardId: number;
  visible?: boolean;
  onClose?: () => void;
}) => {
  const defaultCost = {
    price: undefined,
    count: 1,
  };
  const [costList, setCostList] = useState<Cost[]>([defaultCost]);

  const handleSubmit = () => {
    const result = costList.filter((item) => {
      return item.count && Number(item.price);
    });
    const costMap = Taro.getStorageSync('costMap');
    if (result.length) {
      Taro.setStorageSync('costMap', { ...costMap, [cardId]: result });
    } else {
      Taro.setStorageSync('costMap', { ...costMap, [cardId]: undefined });
    }
    onClose?.();
  };

  useEffect(() => {
    if (!visible) {
      setCostList([defaultCost]);
      return;
    }
    const costMap = Taro.getStorageSync('costMap');
    if (costMap && costMap[cardId]) {
      setCostList(costMap[cardId]);
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
        <ConfigProvider theme={{ nutuiInputPadding: '10px' }}>
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
        </ConfigProvider>
      </ScrollView>
    </Dialog>
  );
};
