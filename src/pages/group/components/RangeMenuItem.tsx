import { View } from '@tarojs/components';
import { Button, Menu, Range } from '@nutui/nutui-react-taro';
import { useRef, useState } from 'react';

export const RangeMenuItem = ({
  min,
  max,
  defaultValue,
  onChange,
  ...props
}: {
  title?: string;
  min?: number;
  max?: number;
  defaultValue?: [number, number];
  children?: React.ReactNode;
  onChange?: (value: [number, number]) => void;
}) => {
  const itemRef = useRef(null);
  const [val, setVal] = useState<[number, number]>(
    defaultValue || [min || 0, max || 0],
  );

  return (
    <Menu.Item ref={itemRef} {...props}>
      <View className="flex items-center py-4 w-full">
        <Range
          range
          min={min}
          max={max}
          value={val}
          className="flex-1 mr-4"
          minDescription={null}
          maxDescription={null}
          onChange={(v) => setVal(v as [number, number])}
        />
        <Button
          size="mini"
          onClick={() => {
            onChange?.(val);
            (itemRef.current as any)?.toggle(false);
          }}
        >
          确定
        </Button>
      </View>
    </Menu.Item>
  );
};
