import {
  ConfigProvider,
  Input,
  InputNumber,
  Dialog,
} from '@nutui/nutui-react-taro';
import { ScrollView, View } from '@tarojs/components';
import { useEffect, useState } from 'react';

export interface Cost {
  price?: string;
  count: number;
}

export const CostPopup = ({
  value,
  visible,
  onChange,
  onClose,
}: {
  value: Cost[];
  visible?: boolean;
  onChange?: (costs?: Cost[]) => void;
  onClose?: () => void;
}) => {
  const defaultCost = {
    price: undefined,
    count: 1,
  };
  const [costList, setCostList] = useState<Cost[]>([defaultCost]);

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
