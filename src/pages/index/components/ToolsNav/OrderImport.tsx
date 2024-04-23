import {
  ConfigProvider,
  Dialog,
  Radio,
  TextArea,
} from '@nutui/nutui-react-taro';
import { View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useState } from 'react';
import { cardsList } from '../../../../assets/cards';
import { Cost } from '../CostPopup';

export const OrderImport = ({
  visible,
  onClose,
  onConfirm,
}: {
  visible?: boolean;
  onClose?: () => void;
  onConfirm?: () => void;
}) => {
  const [importInfo, setImportInfo] = useState<{
    token?: string;
    overwrite: number;
  }>({
    overwrite: 1,
  });

  const handleOrderImport = async () => {
    if (!importInfo.token) {
      Taro.showToast({
        title: '请输入用户凭证',
        icon: 'none',
      });
      return;
    }

    Taro.showLoading({
      title: '正在获取订单',
      mask: true,
    });

    const res = await Taro.cloud.callFunction({
      name: 'fetchCardsAhoy',
      data: {
        url: 'api/marketQuery/queryBuyHistory',
        method: 'post',
        headers: {
          'authorization-token': importInfo.token,
        },
        body: {
          pageNumber: 1,
          pageSize: 100,
        },
      },
    });
    const result = res.result as {
      data: {
        amount: number;
        image: string;
        nftName: string;
        salePrice: string;
        saleStatus: number;
        tokenId: string;
        totalPrice: string;
      }[];
    };

    Taro.hideLoading();

    if (!result.data) {
      Taro.showToast({
        title: '获取订单失败',
        icon: 'none',
      });
      return;
    }

    const cardMap = cardsList.reduce(
      (rst, cur) => {
        const isGold = cur.foil === 'gold';
        return {
          ...rst,
          [cur.nameEn + isGold]: cur.id,
        };
      },
      {} as Record<string, string>,
    );

    const newCostMap = result.data
      .filter((item) => item.saleStatus === 1)
      .reduce(
        (rst, cur) => {
          if (cur.saleStatus !== 1) {
            return rst;
          }
          const isGold = cur.image.endsWith('g.png');
          const cardName = cur.nftName.replace(/ #.*$/, '');
          const cardId = cardMap[cardName + isGold];

          if (!cardId) return rst;

          rst[cardId] = [
            ...(rst[cardId] || []),
            {
              price: cur.salePrice,
              count: cur.amount,
            },
          ];

          return rst;
        },
        {} as Record<string, Cost[]>,
      );

    if (!importInfo.overwrite) {
      const costMap = Taro.getStorageSync('costMap');
      Object.keys(costMap).forEach((key) => {
        if (newCostMap[key]) {
          newCostMap[key] = [...(costMap[key] || []), ...newCostMap[key]];
        } else {
          newCostMap[key] = costMap[key];
        }
      });
    }

    Taro.showToast({
      title: '导入成功',
      icon: 'none',
    });
    Taro.setStorageSync('costMap', newCostMap);

    onClose?.();
    onConfirm?.();
  };

  return (
    <Dialog
      title="订单导入"
      visible={visible}
      onConfirm={handleOrderImport as () => void}
      onCancel={() => onClose?.()}
    >
      <View style={{ height: '32vh' }}>
        <View>
          <View>账号凭证：</View>
          <ConfigProvider
            theme={{
              nutuiTextareaPadding: '10px 0',
            }}
          >
            <TextArea
              rows={5}
              maxLength={256}
              value={importInfo.token}
              onChange={(val) => {
                setImportInfo({
                  ...importInfo,
                  token: val,
                });
              }}
              placeholder="可通过浏览器控制台获取，该凭证为高危信息，请在使用完成后立即注销登录以使凭证失效"
            />
          </ConfigProvider>
        </View>
        <View className="flex">
          <View>已有数据：</View>
          <Radio.Group
            value={importInfo.overwrite}
            direction="horizontal"
            onChange={(val) => {
              setImportInfo({
                ...importInfo,
                overwrite: Number(val),
              });
            }}
          >
            <Radio value={1}>覆盖</Radio>
            <Radio value={0}>合并</Radio>
          </Radio.Group>
        </View>
        <View
          className="text-xs text-gray-400 pl-2 mt-1"
          style={{ borderLeft: '2px solid #ddd' }}
        >
          仅支持最近 100 条数据
        </View>
      </View>
    </Dialog>
  );
};
