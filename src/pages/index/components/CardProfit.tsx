import { View } from '@tarojs/components';
import { Cost } from './CostPopup';
import { samrtCeil } from '../../../utils';
import classNames from 'classnames';

export const getProfit = (floorPrice: string, costList: Cost[]) => {
  const totalCost = costList.reduce((acc, cur) => {
    return acc + Number(cur.price) * cur.count;
  }, 0);
  const totalCount = costList.reduce((acc, cur) => {
    return acc + cur.count;
  }, 0);
  return samrtCeil(totalCount * Number(floorPrice) - totalCost);
};

export const CardProfit = ({
  value,
  className,
}: {
  value: number;
  className?: string;
}) => {
  return (
    <View
      className={classNames(
        'text-sm',
        value > 0 ? 'text-green-500' : 'text-red-500',
        className,
      )}
    >
      ${Math.abs(value)}
    </View>
  );
};
