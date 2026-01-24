import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';
import { FinanceItem } from '../types';

interface FinanceChartProps {
  items: FinanceItem[];
}

// Catppuccin Mocha Colors: Red, Peach, Yellow, Green, Teal, Blue, Mauve, Pink
const COLORS = ['#f38ba8', '#fab387', '#f9e2af', '#a6e3a1', '#94e2d5', '#89b4fa', '#cba6f7', '#f5c2e7'];

export const FinanceChart: React.FC<FinanceChartProps> = ({ items }) => {
  const expenses = items.filter(i => i.type === 'expense');

  // Group by category
  const dataMap = expenses.reduce((acc, item) => {
    const category = item.category || 'Sonstiges';
    if (!acc[category]) {
      acc[category] = 0;
    }
    acc[category] += item.amount;
    return acc;
  }, {} as Record<string, number>);

  const data = Object.keys(dataMap)
    .map(key => ({
      name: key,
      value: dataMap[key]
    }))
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value);

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-[#6c7086] bg-[#181825] rounded-2xl border border-[#313244]">
        <p className="italic">Keine Ausgaben vorhanden</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#181825] p-3 border border-[#313244] shadow-lg rounded-lg text-sm">
          <p className="font-bold text-[#cdd6f4]">{payload[0].name}</p>
          <p className="text-[#a6adc8]">
            {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-[#181825] p-6 rounded-2xl border border-[#313244] shadow-sm">
      <h3 className="text-lg font-bold text-[#cdd6f4] mb-4">Ausgaben nach Kategorie</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius="50%"
              outerRadius="75%"
              paddingAngle={data.length > 1 ? 5 : 0}
              dataKey="value"
              nameKey="name"
              stroke="#181825"
              strokeWidth={2}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px', color: '#a6adc8' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
