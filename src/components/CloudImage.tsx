import { Image } from '@nutui/nutui-react-taro';
import { useMemo } from 'react';

const CLOUD_BASE =
  'https://6361-cards-ahoy-3g50hglqe5f630e4-1325577246.tcb.qcloud.la/';

export const CloudImage = ({ src, ...props }) => {
  const link = useMemo(() => {
    if (!src || src.startsWith('http')) return src;
    return src.replace('cloud://', CLOUD_BASE);
  }, [src]);

  return <Image src={link} {...props} />;
};
