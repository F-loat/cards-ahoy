import { ThumbsUp, Trash, ThumbsDown } from '@nutui/icons-react-taro';
import { View, Text } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import dayjs from 'dayjs';
import { CloudImage } from '../../../components/CloudImage';
import {
  getCard,
  getBonusesForGroup,
  getHonorPointsForCard,
} from '../../../utils';
import { ConfigProvider, Dialog, Loading } from '@nutui/nutui-react-taro';
import { CardGroup } from '..';
import classNames from 'classnames';
import { useGroupVote } from '../hooks';

const getHonorPointsForGroup = (group: CardGroup) => {
  return group.members.reduce(
    (acc, member) =>
      acc + getHonorPointsForCard(getCard(member.id), member.level),
    getHonorPointsForCard(getCard(group.leader.id), group.leader.level),
  );
};

export const GroupItem = ({
  item,
  className,
  showVote = true,
  onVoteSuccess,
  onDeleteSuccess,
}: {
  item: CardGroup;
  className?: string;
  showVote?: boolean;
  onVoteSuccess?: (item: CardGroup, type: 'up' | 'down') => void;
  onDeleteSuccess?: (item: CardGroup) => void;
}) => {
  const { params } = useRouter();

  const { loading, runAsync: handleVote } = useGroupVote();

  const handleNavigate = () => {
    Taro.navigateTo({
      url: `/pages/group/detail?group=${JSON.stringify({ leader: item.leader, members: item.members })}`,
    });
  };

  const handleDelete = (item: CardGroup) => {
    Dialog.open('confirm', {
      title: '确认删除?',
      content: '删除后无法恢复，但分享链接仍然有效',
      onConfirm: async () => {
        Dialog.close('confirm');
        const db = Taro.cloud.database();
        db.collection('card_groups')
          .doc(item._id)
          .remove({
            success: () => {
              onDeleteSuccess?.(item);
            },
            fail: () => {
              Taro.showToast({
                title: '删除失败，请稍后再试',
                icon: 'none',
              });
            },
          });
        return Promise.resolve(() => true);
      },
      onCancel: () => {
        Dialog.close('confirm');
      },
    });
  };

  return (
    <View className={classNames('flex justify-around', className)}>
      <View>
        <View className="relative" onClick={handleNavigate}>
          <CloudImage
            width={92}
            height={92}
            radius="10%"
            lazyLoad
            src={getCard(item.leader.id)?.image}
          />
          <View className="absolute bottom-0 left-0 right-0 text-center text-white text-sm leading-4">
            <Text>lv.{item.leader.level}</Text>
          </View>
        </View>
        <View
          className="relative"
          onClick={() => {
            Taro.showToast({
              title: `创建时间：${dayjs(item.createAt).format('YYYY/MM/DD')}`,
              icon: 'none',
            });
          }}
        >
          <View className="text-xs flex justify-between -ml-1">
            <Text>总{item.cost}费</Text>
            <Text>${item.price}*</Text>
          </View>
          <View className="text-xs break-keep absolute -bottom-3 -left-1 -right-4">
            {getHonorPointsForGroup(item)}点/加成
            {getBonusesForGroup(item)}%
          </View>
        </View>
      </View>
      <View className="grid gap-3 grid-cols-4 h-full" onClick={handleNavigate}>
        {item.members
          .filter((member) => member.id !== -1)
          .map((member) => (
            <View key={member.id} className="relative flex justify-center">
              <CloudImage
                width={50}
                height={50}
                radius="10%"
                lazyLoad
                src={getCard(member.id)?.image}
              />
              {!!member.level && (
                <View className="absolute bottom-0 leading-3 left-0 right-0 text-center text-xs text-white">
                  <Text>lv.{member.level}</Text>
                </View>
              )}
            </View>
          ))}
      </View>
      {showVote && (
        <View className="flex flex-col justify-center items-center text-xs text-center w-4 pt-1.5">
          <View
            onClick={async () => {
              const successed = await handleVote(item._id, 'up');
              if (successed) onVoteSuccess?.(item, 'up');
            }}
          >
            {loading === 'up' ? (
              <ConfigProvider
                theme={{ nutuiLoadingIconColor: 'currentColor' }}
                className="h-5"
              >
                <Loading className="text-green-500" />
              </ConfigProvider>
            ) : (
              <ThumbsUp size={16} className="text-green-500" />
            )}
            <View className="mb-1">{item.up || 0}</View>
          </View>
          {params.type === 'self' ? (
            <View onClick={() => handleDelete(item)}>
              <Trash size={16} className="text-red-500" />
            </View>
          ) : (
            <View
              onClick={async () => {
                const successed = await handleVote(item._id, 'down');
                if (successed) onVoteSuccess?.(item, 'down');
              }}
            >
              {loading === 'down' ? (
                <ConfigProvider
                  theme={{ nutuiLoadingIconColor: 'currentColor' }}
                  className="h-5"
                >
                  <Loading className="text-red-500" />
                </ConfigProvider>
              ) : (
                <ThumbsDown size={16} className="text-red-500" />
              )}
            </View>
          )}
        </View>
      )}
    </View>
  );
};
