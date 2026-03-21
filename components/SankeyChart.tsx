import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Sankey, ResponsiveContainer, Layer, Rectangle } from 'recharts';
import { FinanceItem } from '../types';

interface SankeyChartProps {
  items: FinanceItem[];
}

// Color constants per color scheme — polychromatic from design system
const CHART_COLORS = {
  light: {
    income:  '#3d6652',
    budget:  '#273f49',
    balance: '#3d6652',
    expense: ['#7a3535','#7a6030','#7a4a30','#3d6652','#2d4f6b','#466270','#273f49','#6b3558','#8a4a4a','#5a7a60','#4a6a50','#5a4060'],
  },
  dark: {
    income:  '#4d8068',
    budget:  '#3d6070',
    balance: '#4d8068',
    expense: ['#a04545','#9a7a40','#9a6a45','#4d8068','#3d6585','#6a8a9a','#3d6070','#8a5078','#b06060','#70a080','#5a8a68','#7a5880'],
  },
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);

const getExpenseColor = (index: number, palette: string[]) =>
  palette[index % palette.length];

const truncate = (str: string, max: number) =>
  str.length > max ? str.slice(0, max - 1) + '\u2026' : str;

const CustomNode = ({ x, y, width, height, payload, isMobile, chartColors }: any) => {
  if (!payload || height < 1) return null;

  const isIncome = payload.nodeType === 'income';
  const isBudget = payload.nodeType === 'budget';
  const isBalance = payload.nodeType === 'balance';

  let fill: string;
  if (isIncome) fill = chartColors.income;
  else if (isBudget) fill = chartColors.budget;
  else if (isBalance) fill = chartColors.balance;
  else fill = getExpenseColor(payload.expenseIndex ?? 0, chartColors.expense);

  const gap = isMobile ? 7 : 10;
  const labelX = isIncome ? x - gap : x + width + gap;
  const anchor = isIncome ? 'end' : 'start';
  const nodeValue = payload.value || 0;
  const nameFontSize = isMobile ? 11 : 12;
  const valueFontSize = isMobile ? 10 : 11;
  const labelSpacing = isMobile ? 7 : 9;
  const maxChars = isMobile ? 13 : 999;

  if (isBalance) {
    return (
      <Layer>
        <Rectangle
          x={x}
          y={y}
          width={width}
          height={Math.max(height, 3)}
          fill={chartColors.balance}
          fillOpacity={0.9}
          radius={[3, 3, 3, 3]}
        />
        <text
          x={labelX}
          y={y + height / 2 - labelSpacing}
          textAnchor={anchor}
          dominantBaseline="central"
          fill={chartColors.balance}
          fontSize={nameFontSize}
          fontWeight={700}
        >
          Verfügbar
        </text>
        <text
          x={labelX}
          y={y + height / 2 + labelSpacing}
          textAnchor={anchor}
          dominantBaseline="central"
          fill={chartColors.balance}
          fontSize={valueFontSize}
          fontWeight={600}
        >
          {formatCurrency(nodeValue)}
        </text>
      </Layer>
    );
  }

  return (
    <Layer>
      <Rectangle
        x={x}
        y={y}
        width={width}
        height={Math.max(height, 3)}
        fill={fill}
        fillOpacity={0.95}
        radius={[3, 3, 3, 3]}
      />
      <text
        x={labelX}
        y={y + height / 2 - labelSpacing}
        textAnchor={anchor}
        dominantBaseline="central"
        style={{ fill: 'var(--on-surface)' }}
        fontSize={nameFontSize}
        fontWeight={700}
      >
        {truncate(payload.name, maxChars)}
      </text>
      <text
        x={labelX}
        y={y + height / 2 + labelSpacing}
        textAnchor={anchor}
        dominantBaseline="central"
        fill={fill}
        fontSize={valueFontSize}
        fontWeight={600}
      >
        {formatCurrency(nodeValue)}
      </text>
    </Layer>
  );
};

const CustomLink = (props: any) => {
  const { sourceX, sourceY, sourceControlX, targetX, targetY, targetControlX, linkWidth, payload, chartColors } = props;
  if (!linkWidth || linkWidth < 0.5) return null;

  const sourceType = payload?.source?.nodeType;
  const targetType = payload?.target?.nodeType;

  let color: string;
  if (sourceType === 'income') color = chartColors.income;
  else if (targetType === 'balance') color = chartColors.balance;
  else color = getExpenseColor(payload?.target?.expenseIndex ?? 0, chartColors.expense);

  return (
    <Layer>
      <path
        d={`M${sourceX},${sourceY} C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}`}
        fill="none"
        stroke={color}
        strokeWidth={linkWidth}
        strokeOpacity={0.2}
      />
    </Layer>
  );
};

const CHART_W = 640;

export const SankeyChart: React.FC<SankeyChartProps> = ({ items }) => {
  const [isDark, setIsDark] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)').matches : false
  );
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const chartColors = isDark ? CHART_COLORS.dark : CHART_COLORS.light;

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 0
  );
  const [scale, setScale] = useState(() => {
    if (typeof window !== 'undefined') {
      const availH = window.innerHeight - 253;
      return Math.min(1, window.innerWidth / CHART_W, availH / 520) * 1.25;
    }
    return 1;
  });
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const translateAtPanStart = useRef({ x: 0, y: 0 });
  const pinchStartDistance = useRef(0);
  const scaleAtPinchStart = useRef(1);
  const initialized = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(entries => {
      const w = entries[0].contentRect.width;
      setContainerWidth(w);
      if (!initialized.current && w > 0) {
        initialized.current = true;
        const availH = window.innerHeight - 253;
        const chartH = Math.max(520, 4 * 90 + 100 + 120);
        setScale(Math.min(1, w / CHART_W, availH / chartH) * 1.25);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Mouse wheel zoom
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const fitScale = containerWidth / CHART_W;
      setScale(s => Math.min(3, Math.max(fitScale, s * (e.deltaY > 0 ? 0.9 : 1.1))));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [containerWidth]);

  // Mouse pan
  const onMouseDown = (e: React.MouseEvent) => {
    isPanning.current = true;
    panStart.current = { x: e.clientX, y: e.clientY };
    translateAtPanStart.current = { ...translate };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isPanning.current) return;
    setTranslate({
      x: translateAtPanStart.current.x + (e.clientX - panStart.current.x),
      y: translateAtPanStart.current.y + (e.clientY - panStart.current.y),
    });
  };
  const onMouseUp = () => { isPanning.current = false; };

  // Touch pan + pinch zoom
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const fitScale = containerWidth > 0 ? containerWidth / CHART_W : 1;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        pinchStartDistance.current = Math.sqrt(dx * dx + dy * dy);
        scaleAtPinchStart.current = scale;
      } else if (e.touches.length === 1) {
        isPanning.current = true;
        panStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        translateAtPanStart.current = { ...translate };
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const next = Math.min(3, Math.max(fitScale, scaleAtPinchStart.current * (dist / pinchStartDistance.current)));
        setScale(next);
      } else if (e.touches.length === 1 && isPanning.current) {
        setTranslate({
          x: translateAtPanStart.current.x + (e.touches[0].clientX - panStart.current.x),
          y: translateAtPanStart.current.y + (e.touches[0].clientY - panStart.current.y),
        });
      }
    };
    const onTouchEnd = () => { isPanning.current = false; };

    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [containerWidth, scale, translate]);

  const sankeyData = useMemo(() => {
    const incomeItems = items.filter(i => i.type === 'income');
    const expenseItems = items.filter(i => i.type === 'expense');

    if (incomeItems.length === 0 && expenseItems.length === 0) return null;

    const totalIncome = incomeItems.reduce((sum, i) => sum + i.amount, 0);
    const totalExpenses = expenseItems.reduce((sum, i) => sum + i.amount, 0);
    const balance = Math.max(0, totalIncome - totalExpenses);

    const nodes: { name: string; nodeType: string; expenseIndex?: number }[] = [];
    const nodeMap = new Map<string, number>();

    // Income nodes (aggregate by title)
    const incomeTotals = new Map<string, number>();
    incomeItems.forEach(item => {
      incomeTotals.set(item.title, (incomeTotals.get(item.title) || 0) + item.amount);
    });
    const sortedIncome = Array.from(incomeTotals.entries()).sort((a, b) => b[1] - a[1]);
    sortedIncome.forEach(([title]) => {
      nodeMap.set(title, nodes.length);
      nodes.push({ name: title, nodeType: 'income' });
    });

    // Budget node
    const budgetIndex = nodes.length;
    nodes.push({ name: 'Budget', nodeType: 'budget' });

    // Expense category nodes
    const categoryTotals = new Map<string, number>();
    expenseItems.forEach(item => {
      const cat = item.isWohnkosten ? 'Wohnkosten' : (item.category || 'Sonstiges');
      categoryTotals.set(cat, (categoryTotals.get(cat) || 0) + item.amount);
    });
    const sortedCategories = Array.from(categoryTotals.entries()).sort((a, b) => b[1] - a[1]);

    sortedCategories.forEach(([cat], i) => {
      nodeMap.set(cat, nodes.length);
      nodes.push({ name: cat, nodeType: 'expense', expenseIndex: i });
    });

    // Balance node
    let balanceIndex = -1;
    if (balance > 0) {
      balanceIndex = nodes.length;
      nodes.push({ name: 'Verfügbar', nodeType: 'balance' });
    }

    // Links
    const links: { source: number; target: number; value: number }[] = [];

    sortedIncome.forEach(([title, amount]) => {
      links.push({ source: nodeMap.get(title)!, target: budgetIndex, value: amount });
    });

    sortedCategories.forEach(([cat, amount]) => {
      links.push({ source: budgetIndex, target: nodeMap.get(cat)!, value: amount });
    });

    if (balance > 0 && balanceIndex >= 0) {
      links.push({ source: budgetIndex, target: balanceIndex, value: balance });
    }

    return { nodes, links, balance };
  }, [items]);

  if (!sankeyData) {
    return (
      <div className="h-64 flex items-center justify-center text-outline-variant bg-surface-lowest rounded-ds-md shadow-float">
        <p>Keine Daten für Sankey-Diagramm</p>
      </div>
    );
  }

  const rightNodeCount = sankeyData.nodes.filter(n => n.nodeType === 'expense' || n.nodeType === 'balance').length;
  const hasBalance = sankeyData.balance > 0;
  const leftNodeCount = sankeyData.nodes.filter(n => n.nodeType === 'income').length;
  const maxSideNodes = Math.max(rightNodeCount, leftNodeCount);
  const CHART_H = Math.max(520, maxSideNodes * 90 + (hasBalance ? 100 : 0) + 120);
  const viewportH = typeof window !== 'undefined' ? window.innerHeight : 800;
  const availableH = viewportH - 253;
  const fitScale = containerWidth > 0
    ? Math.min(1, containerWidth / CHART_W, availableH / CHART_H)
    : 1;
  const containerHeight = Math.round(CHART_H * fitScale);

  const innerLeft = containerWidth > 0 ? (containerWidth - CHART_W) / 2 : 0;

  return (
    <div
      ref={containerRef}
      className="w-full touch-none select-none"
      style={{ height: containerHeight, position: 'relative', overflow: 'visible', cursor: 'grab' }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      <div style={{
        position: 'absolute',
        width: CHART_W,
        height: CHART_H,
        left: innerLeft,
        top: 0,
        transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
        transformOrigin: 'top center',
      }}>
        <ResponsiveContainer width="100%" height="100%">
          <Sankey
            data={sankeyData}
            node={<CustomNode isMobile={false} chartColors={chartColors} />}
            link={<CustomLink chartColors={chartColors} />}
            nodePadding={28}
            nodeWidth={10}
            margin={{ top: 32, right: 150, bottom: 100, left: 150 }}
            iterations={128}
          />
        </ResponsiveContainer>
      </div>
    </div>
  );
};