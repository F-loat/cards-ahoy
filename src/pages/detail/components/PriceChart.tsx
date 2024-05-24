//index.js
import { useEffect, useState } from 'react';
import Taro from '@tarojs/taro';
import { View, Canvas } from '@tarojs/components';
import uCharts from '@qiun/ucharts';
import { FloorPrice } from '../index';

const uChartsInstance = {};
const sysInfo = Taro.getSystemInfoSync();

const cWidth = (750 / 750) * sysInfo.windowWidth;
const cHeight = (200 / 750) * sysInfo.windowWidth;

export const PriceChart = ({ data }: { data: FloorPrice[] }) => {
  const [visible, setVisible] = useState(true);

  const drawCharts = (id) => {
    const pixelRatio = sysInfo.pixelRatio;
    const query = Taro.createSelectorQuery();
    query
      .select('#' + id)
      .fields({ node: true, size: true })
      .exec((res) => {
        if (res[0]) {
          const canvas = res[0].node;
          const ctx = canvas.getContext('2d');
          canvas.width = cWidth * pixelRatio;
          canvas.height = cHeight * pixelRatio;
          uChartsInstance[id] = new uCharts({
            type: 'line',
            context: ctx,
            width: cWidth * pixelRatio,
            height: cHeight * pixelRatio,
            categories: data.map((i) => i.time),
            series: [
              {
                name: '地板价',
                data: data.map((i) => i.value),
              },
            ],
            pixelRatio,
            animation: false,
            background: '#FFFFFF',
            color: ['#ff0000'],
            dataLabel: false,
            dataPointShape: false,
            padding: [15, 15, 10, 15],
            enableScroll: false,
            legend: {
              show: false,
            },
            xAxis: {
              axisLine: false,
              disabled: true,
              disableGrid: true,
            },
            yAxis: {
              gridType: 'dash',
              dashLength: 2,
              data: [{ axisLine: false }],
            },
            extra: {
              line: {
                type: 'straight',
                width: 2,
                activeType: 'none',
              },
            },
          });
        } else {
          setVisible(false);
          console.error('[uCharts]: 未获取到 context');
        }
      });
  };

  const handleTap = (e) => {
    const { index } = uChartsInstance[e.target.id].getCurrentDataIndex(e);
    uChartsInstance[e.target.id].touchLegend(e);
    if (index === -1) return;
    uChartsInstance[e.target.id].showToolTip(e, {
      textList: [
        {
          text: `地板价：$${data[index].value}`,
          color: '#f00',
          legendShape: 'line',
        },
        { text: data[index].time, color: '#f000', legendShape: 'line' },
      ],
    });
  };

  useEffect(() => {
    setTimeout(() => drawCharts('price'));
  }, [data]);

  if (!visible) return null;

  return (
    <View>
      <Canvas
        style={{ width: cWidth, height: cHeight }}
        canvas-id="price"
        id="price"
        type="2d"
        onTouchEnd={handleTap}
      />
    </View>
  );
};
