import { View } from '@tarojs/components';
import { Button, Checkbox, Menu } from '@nutui/nutui-react-taro';
import { useRef, useState } from 'react';
import { Checklist } from '@nutui/icons-react-taro';

export const CheckboxMenuItem = ({
  options = [],
  defaultValue,
  onChange,
  ...props
}: {
  title?: string;
  options?: {
    text: string;
    value: string;
  }[];
  defaultValue?: string[];
  children?: React.ReactNode;
  onChange?: (value: string[]) => void;
}) => {
  const itemRef = useRef(null);
  const [val, setVal] = useState<string[]>(defaultValue || []);

  return (
    <Menu.Item ref={itemRef} {...props}>
      <View className="flex items-center w-full">
        <Checkbox.Group
          labelPosition="left"
          direction="horizontal"
          value={val}
          onChange={setVal}
        >
          {options.map((option) => (
            <Checkbox
              value={option.value}
              label={option.text}
              shape="button"
              activeIcon={
                <Checklist className="nut-checkbox-button-icon-checked" />
              }
              style={{ margin: '4px 8px 4px 0' }}
            />
          ))}
        </Checkbox.Group>
        <Button
          size="mini"
          style={{ margin: '4px 0' }}
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
