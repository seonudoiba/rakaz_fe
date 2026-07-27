import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "../../utils/formatters";

interface ExpenseBreakdownChartProps {
  expenses: Array<{
    category: string;
    amount: number;
  }>;
  height?: number;
}

const EXPENSE_COLORS = {
  FUEL_FOR_GENS: "#f59e0b",
  MAINTENANCE: "#3b82f6",
  SALARIES: "#8b5cf6",
  UTILITIES: "#10b981",
  ADMINISTRATIVE: "#ef4444",
  OPERATIONAL: "#c9a84c",
};

const EXPENSE_LABELS: Record<string, string> = {
  FUEL_FOR_GENS: "Fuel for Gens",
  MAINTENANCE: "Maintenance",
  SALARIES: "Salaries",
  UTILITIES: "Utilities",
  ADMINISTRATIVE: "Administrative",
  OPERATIONAL: "Operational",
};

const ExpenseBreakdownChart: React.FC<ExpenseBreakdownChartProps> = ({
  expenses,
  height = 300,
}) => {
  const chartData = expenses.map((expense) => ({
    ...expense,
    category: EXPENSE_LABELS[expense.category] || expense.category,
  }));

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-gray-500">
        No expense data available
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-900">
            {payload[0].payload.category}
          </p>
          <p className="text-sm text-gray-600">
            Amount: {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis type="number" tickFormatter={(value) => formatCurrency(value)} />
        <YAxis type="category" dataKey="category" stroke="#6b7280" />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Bar
          dataKey="amount"
          fill="#c9a84c"
          radius={[0, 4, 4, 0]}
          name="Expense Amount"
          label={({ x, y, width, value }) => (
            <text
              x={Number(x) + Number(width) + 5}
              y={Number(y) + 15}
              fill="#6b7280"
              fontSize={12}
            >
              {formatCurrency(Number(value) || 0)}
            </text>
          )}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export { ExpenseBreakdownChart };
export default ExpenseBreakdownChart;
