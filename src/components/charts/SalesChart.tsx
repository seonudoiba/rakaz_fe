import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { formatCurrency } from '../../utils/formatters';

interface SalesChartProps {
  data: Array<{
    date?: string;
    sales?: number;
    volume?: number;
    createdAt?: string;
    totalAmount?: number;
    quantity?: number;
  }>;
  height?: number;
}

const SalesChart: React.FC<SalesChartProps> = ({ data, height = 300 }) => {
  // If data is empty, show a friendly message
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
        <div className="text-4xl mb-2">📊</div>
        <p className="text-sm">No sales data available for the selected period</p>
        <p className="text-xs text-gray-400 mt-1">Try changing the time range or add some sales</p>
      </div>
    );
  }

  // Process data to ensure it's in the right format
  const chartData = data.map(item => {
    // If the data already has 'date' and 'sales' fields, use them directly
    if (item.date !== undefined && item.sales !== undefined) {
      return {
        date: item.date,
        sales: item.sales,
        volume: item.volume || 0,
      };
    }
    
    // If the data has 'createdAt' and 'totalAmount' (from transaction data), use those
    if (item.createdAt && item.totalAmount !== undefined) {
      return {
        date: item.createdAt,
        sales: item.totalAmount,
        volume: item.quantity || 0,
      };
    }

    // Fallback: use the item as-is if it has numeric values
    return {
      date: item.date || new Date().toISOString().split('T')[0],
      sales: typeof item.sales === 'number' ? item.sales : (item.totalAmount || 0),
      volume: typeof item.volume === 'number' ? item.volume : (item.quantity || 0),
    };
  });

  // Group by date to aggregate daily sales
  const groupedData = chartData.reduce((acc: any, item) => {
    const date = new Date(item.date).toISOString().split('T')[0];
    if (!acc[date]) {
      acc[date] = { date, sales: 0, volume: 0, count: 0 };
    }
    acc[date].sales += item.sales || 0;
    acc[date].volume += item.volume || 0;
    acc[date].count += 1;
    return acc;
  }, {});

  const dailyData = Object.values(groupedData)
    .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (dailyData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
        <div className="text-4xl mb-2">📊</div>
        <p className="text-sm">No sales data available for the selected period</p>
        <p className="text-xs text-gray-400 mt-1">Try changing the time range or add some sales</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-900">{label}</p>
          <p className="text-sm text-gray-600">
            Sales: {formatCurrency(payload[0].value)}
          </p>
          {payload[1] && (
            <p className="text-sm text-gray-600">
              Volume: {payload[1].value.toLocaleString()} L
            </p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            {(dailyData as any[])?.find((d: any) => d.date === label)?.count || 0} transactions
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart
        data={dailyData}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="date"
          stroke="#6b7280"
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => {
            const date = new Date(value);
            return `${date.getMonth() + 1}/${date.getDate()}`;
          }}
        />
        <YAxis
          yAxisId="left"
          stroke="#6b7280"
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => formatCurrency(value)}
          domain={[0, 'auto']}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          stroke="#6b7280"
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => `${value.toLocaleString()}L`}
          domain={[0, 'auto']}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="sales"
          stroke="#c9a84c"
          strokeWidth={2}
          dot={{ fill: '#c9a84c', r: 4 }}
          activeDot={{ r: 6 }}
          name="Sales"
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="volume"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ fill: '#3b82f6', r: 4 }}
          name="Volume (L)"
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default SalesChart;