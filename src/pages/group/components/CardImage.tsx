import { View, Text } from '@tarojs/components';
import { Image } from '@nutui/nutui-react-taro';
import { getCard } from '../../../utils';
import { ReactNode, useState } from 'react';

export const CardImage = ({
  id,
  level,
  size,
  shape,
  bottomSlot,
  onClick,
}: {
  id: number;
  level?: number;
  size?: number;
  shape?: 'round' | 'circle';
  bottomSlot?: ReactNode;
  onClick?: () => void;
}) => {
  const [load, setLoad] = useState(false);
  const { image, props } = getCard(id) || {};

  return (
    <View className="relative mt-2 flex justify-center" onClick={onClick}>
      <Image
        width={size ?? 80}
        height={size ?? 80}
        radius={shape === 'circle' ? '50%' : '10%'}
        src={image}
        onLoad={() => setLoad(true)}
      />
      {load && !!props && !!level && props[level - 1] && (
        <View
          className="absolute text-xs left-3 bottom-4 text-white text-center leading-3 font-bold"
          style={{ fontSize: '8px' }}
        >
          {!!props[level - 1][1] && (
            <View className="bg-blue-500 min-w-3 border-solid border-white border-1 rounded">
              {props[level - 1][1]}
            </View>
          )}
          <View className="bg-red-500 min-w-3 border-solid border-white border-1 rounded-lg mt-px">
            {props[level - 1][0]}
          </View>
        </View>
      )}
      {!!level && (
        <View className="absolute bottom-0 left-0 right-0 text-center text-xs text-white">
          <Text>lv.{level}</Text>
          {bottomSlot}
        </View>
      )}
    </View>
  );
};
