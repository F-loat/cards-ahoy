import { Notice } from '@nutui/icons-react-taro';
import { Button, Dialog, Input } from '@nutui/nutui-react-taro';
import { View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { LevelSlider } from '../../../components/LevelSlider';
import { useRef, useState } from 'react';
import { getCard } from '../../../utils';
import { getGlobalData } from '../../../utils/data';

export const Subscribe = ({ cardId }: { cardId: number }) => {
  const subId = useRef<string | null>();
  const [price, setPrice] = useState<string>();
  const [level, setLevel] = useState<number>(1);
  const [visible, setVisible] = useState<boolean>(false);

  const handleOpen = async () => {
    setVisible(true);
    if (subId.current !== undefined) return;
    const db = Taro.cloud.database();
    const docs = await db
      .collection('subscriptions')
      .where({
        cardId,
        _openid: getGlobalData('openid'),
      })
      .get();
    if (docs.data.length) {
      setPrice(docs.data[0].price.toString());
      setLevel(docs.data[0].level);
      subId.current = String(docs.data[0]._id);
    } else {
      subId.current = null;
    }
  };

  const handleSubscribe = async () => {
    if (isNaN(Number(price))) {
      Taro.showToast({
        title: '请输入正确的价格',
        icon: 'none',
      });
      return;
    }
    setVisible(false);
    await Taro.requestSubscribeMessage({
      tmplIds: ['7tACZmiQF0qnNR5v5PAUAF_i_bEEMNtQRbdbKZaPvJQ'],
      entityIds: [],
    });
    const db = Taro.cloud.database();
    if (subId.current) {
      await db
        .collection('subscriptions')
        .doc(subId.current)
        .update({
          data: {
            cardId,
            price: Number(price),
            level,
            name: getCard(cardId).name,
            updateAt: Date.now(),
          },
        });
    } else {
      await db.collection('subscriptions').add({
        data: {
          cardId,
          price: Number(price),
          level,
          name: getCard(cardId).name,
          createAt: Date.now(),
        },
      });
    }
    Taro.showToast({
      title: '订阅成功',
      icon: 'none',
    });
  };

  return (
    <>
      <Button
        shape="round"
        fill="none"
        type="primary"
        icon={<Notice size={16} />}
        onClick={handleOpen}
      />
      <Dialog
        title="价格订阅"
        visible={visible}
        onCancel={() => setVisible(false)}
        onConfirm={handleSubscribe}
      >
        <View className="flex items-center">
          <View>地板价</View>
          <Input
            placeholder="请输入目标价格"
            type="digit"
            value={price}
            onChange={setPrice}
          />
        </View>
        <View className="flex items-center">
          <View>卡牌等级</View>
          <LevelSlider value={level} onChange={setLevel} />
        </View>
      </Dialog>
    </>
  );
};
