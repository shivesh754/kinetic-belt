import { useEffect, useRef } from 'react';
import { createChart, ColorType } from 'lightweight-charts';

const StockChart = ({ data, colors = {} }) => {
  const chartContainerRef = useRef();

  useEffect(() => {
    const {
      backgroundColor = '#0b1120',
      lineColor = '#10b981',
      textColor = '#94a3b8',
      areaTopColor = 'rgba(16, 185, 129, 0.2)',
      areaBottomColor = 'rgba(16, 185, 129, 0)',
    } = colors;

    if (!data || !chartContainerRef.current) return;

    const width = chartContainerRef.current.clientWidth || 800;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: backgroundColor },
        textColor,
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
      },
      width: width,
      height: 400,
      timeScale: {
        borderVisible: false,
      },
      rightPriceScale: {
        borderVisible: false,
      },
    });


    const newSeries = chart.addAreaSeries({
      lineColor,
      topColor: areaTopColor,
      bottomColor: areaBottomColor,
      lineWidth: 2,
    });

    // Format data for lightweight-charts: support { dates: [], close: [] } format
    let formattedData = [];
    if (data.dates && data.close) {
      formattedData = data.dates.map((date, index) => ({
        time: date,
        value: data.close[index]
      }));
    } else if (Array.isArray(data)) {
      formattedData = data.map(item => ({
        time: item.date || item.time,
        value: item.price || item.close || item.value
      }));
    }

    // Ensure data is sorted by time and filter out duplicates
    formattedData = formattedData
      .sort((a, b) => new Date(a.time) - new Date(b.time))
      .filter((v, i, a) => !i || v.time !== a[i - 1].time);

    newSeries.setData(formattedData);

    chart.timeScale().fitContent();

    const handleResize = () => {
      chart.applyOptions({ width: chartContainerRef.current.clientWidth });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [data, colors]);

  return <div ref={chartContainerRef} className="w-full" />;
};

export default StockChart;
