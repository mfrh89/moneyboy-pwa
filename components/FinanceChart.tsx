import React, { useState, useEffect } from 'react';
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

// Monochromatic palette — light mode: dark-to-accent, dark mode: lightened equivalents
const COLORS_LIGHT = ['#1a1a1a', '#3b3b3b', '#7a3535', '#3d6652', '#7a6030', '#2d4f6b', '#7a4a30', '#6b3558'];
const COLORS_DARK  = ['#efefef', '#cccccc', '#a04545', '#4d8068', '#9a7a40', '#3d6585', '#9a6040', '#8a4570'];

export const FinanceChart: React.FC<FinanceChartProps> = ({ items }) => {
  const [isDark, setIsDark] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)').matches : false
  );
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const COLORS = isDark ? COLORS_DARK : COLORS_LIGHT;

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
      <div className="h-64 flex items-center justify-center text-outline-variant bg-surface-lowest rounded-ds-md shadow-float">
        <p>Keine Ausgaben vorhanden</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass p-3 shadow-float rounded-ds-md text-sm">
          <p className="font-bold text-on-surface">{payload[0].name}</p>
          <p className="text-on-surface-variant">
            {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-surface-lowest p-6 rounded-ds-md shadow-float">
      <h3 className="text-[1.25rem] font-semibold text-on-surface mb-4">Ausgaben nach Kategorie</h3>
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
              stroke={isDark ? '#1c1c1c' : '#ffffff'}
              strokeWidth={2}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              wrapperStyle={{ paddingTop: '20px', fontSize: '12px', color: 'var(--on-surface-variant)' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
