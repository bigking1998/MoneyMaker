import React, { useEffect, useRef, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  Filler
);

const TradingChart = ({ symbol = 'ETH/USD', timeframe = '1h' }) => {
  const [chartData, setChartData] = useState(null);
  const chartRef = useRef();

  // Generate sample candlestick data
  useEffect(() => {
    const generateData = () => {
      const now = Date.now();
      const intervals = {
        '1h': 60,     // 60 data points for 1 hour intervals
        '24h': 24,    // 24 data points for 24 hours
        '1w': 7,      // 7 data points for 1 week
        '1m': 30      // 30 data points for 1 month
      };

      const interval = intervals[timeframe] || 24;
      const timeStep = {
        '1h': 1000 * 60 * 60,        // 1 hour
        '24h': 1000 * 60 * 60 * 24,  // 1 day
        '1w': 1000 * 60 * 60 * 24 * 7, // 1 week
        '1m': 1000 * 60 * 60 * 24 * 30 // 1 month
      };

      const step = timeStep[timeframe] || timeStep['24h'];
      const data = [];
      let basePrice = 3600 + Math.random() * 100;

      for (let i = interval; i >= 0; i--) {
        const timestamp = now - (i * step);
        const change = (Math.random() - 0.5) * 50;
        basePrice += change;
        
        data.push({
          x: new Date(timestamp),
          y: Math.max(basePrice, 3000) // Ensure price doesn't go below 3000
        });
      }

      return data;
    };

    const data = generateData();
    
    setChartData({
      datasets: [
        {
          label: symbol,
          data: data,
          borderColor: '#ffffff',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.1,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: '#ffffff',
          pointHoverBorderColor: 'var(--color-primary-bg)',
          pointHoverBorderWidth: 2,
        }
      ]
    });
  }, [symbol, timeframe]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'var(--color-surface)',
        titleColor: 'var(--color-text-primary)',
        bodyColor: 'var(--color-text-secondary)',
        borderColor: 'var(--color-border)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          title: function(context) {
            return new Date(context[0].parsed.x).toLocaleString();
          },
          label: function(context) {
            return `$${context.parsed.y.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}`;
          }
        }
      }
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: timeframe === '1h' ? 'minute' : 
                timeframe === '24h' ? 'hour' :
                timeframe === '1w' ? 'day' : 'day',
        },
        grid: {
          color: 'var(--color-chart-grid)',
          borderColor: 'var(--color-border)',
        },
        ticks: {
          color: 'var(--color-chart-axis)',
          font: {
            size: 12
          }
        }
      },
      y: {
        position: 'right',
        grid: {
          color: 'var(--color-chart-grid)',
          borderColor: 'var(--color-border)',
        },
        ticks: {
          color: 'var(--color-chart-axis)',
          font: {
            size: 12
          },
          callback: function(value) {
            return '$' + value.toLocaleString();
          }
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    },
    elements: {
      line: {
        tension: 0.1
      }
    }
  };

  if (!chartData) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-[var(--color-text-tertiary)]">Loading chart...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <Line ref={chartRef} data={chartData} options={options} />
    </div>
  );
};

export default TradingChart;