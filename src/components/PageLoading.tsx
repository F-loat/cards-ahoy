import { Star } from '@nutui/icons-react-taro';
import { Loading } from '@nutui/nutui-react-taro';
import { View } from '@tarojs/components';

export const PageLoading = ({ visible }: { visible: boolean }) => {
  if (!visible) return null;
  return (
    <View className="absolute top-0 left-0 flex justify-center items-center h-screen w-screen z-20">
      <Loading direction="vertical" icon={<Star size={30} color="#FF9800" />}>
        加载中
      </Loading>
    </View>
  );
};
