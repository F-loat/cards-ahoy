import { ConfigProvider, Range } from '@nutui/nutui-react-taro';

export const LevelSlider = ({
  value,
  onChange,
}: {
  value?: number;
  onChange?: (value: number) => void;
}) => {
  return (
    <ConfigProvider
      theme={{
        nutuiRangeActiveColor: 'transparent',
      }}
      className="flex-1 ml-2"
    >
      <Range
        min={1}
        max={10}
        value={value}
        button={
          <div
            style={{
              width: '26px',
              color: 'white',
              fontSize: '10px',
              lineHeight: '18px',
              textAlign: 'center',
              backgroundColor: 'red',
              borderRadius: '10px',
            }}
          >
            {value}
          </div>
        }
        maxDescription={null}
        minDescription={null}
        onChange={(val) => onChange?.(Number(val))}
      />
    </ConfigProvider>
  );
};
