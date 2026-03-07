import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Sankey, ResponsiveContainer, Layer, Rectangle } from 'recharts';
import { FinanceItem } from '../types';

interface SankeyChartProps {
  items: FinanceItem[];
}

const INCOME_COLOR = '#a6e3a1';
const BUDGET_COLOR = '#94e2d5'; // teal
const BALANCE_COLOR = '#a6e3a1';

// Expense palette — deliberately no greens to avoid confusion with income/balance
const EXPENSE_PALETTE = [
  '#f38ba8', // red
  '#fab387', // peach
  '#f9e2af', // yellow
  '#89b4fa', // blue
  '#f5c2e7', // pink
  '#74c7ec', // sapphire
  '#b4befe', // lavender
  '#eba0ac', // maroon
  '#89dceb', // sky
  '#f2cdcd', // flamingo
  '#cba6f7', // mauve
  '#9399b2', // overlay
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);

// Stable color assignment: category name → consistent index via simple hash
const categoryColorCache = new Map<string, string>();
const getExpenseColor = (name: string, index: number) => {
  if (categoryColorCache.has(name)) return categoryColorCache.get(name)!;
  // Use index from sorted order for deterministic assignment
  const color = EXPENSE_PALETTE[index % EXPENSE_PALETTE.length];
  categoryColorCache.set(name, color);
  return color;
};

const truncate = (str: string, max: number) =>
  str.length > max ? str.slice(0, max - 1) + '…' : str;

const CustomNode = ({ x, y, width, height, payload, isMobile }: any) => {
  if (!payload || height < 1) return null;

  const isIncome = payload.nodeType === 'income';
  const isBudget = payload.nodeType === 'budget';
  const isBalance = payload.nodeType === 'balance';

  let fill: string;
  if (isIncome) fill = INCOME_COLOR;
  else if (isBudget) fill = BUDGET_COLOR;
  else if (isBalance) fill = BALANCE_COLOR;
  else fill = getExpenseColor(payload.name, payload.expenseIndex ?? 0);

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
          fill={BALANCE_COLOR}
          fillOpacity={0.9}
          radius={[3, 3, 3, 3]}
        />
        <text
          x={labelX}
          y={y + height / 2 - labelSpacing}
          textAnchor={anchor}
          dominantBaseline="central"
          fill={BALANCE_COLOR}
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
          fill={BALANCE_COLOR}
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
        fill="#cdd6f4"
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
  const { sourceX, sourceY, sourceControlX, targetX, targetY, targetControlX, linkWidth, payload } = props;
  if (!linkWidth || linkWidth < 0.5) return null;

  const sourceType = payload?.source?.nodeType;
  const targetType = payload?.target?.nodeType;

  let color: string;
  if (sourceType === 'income') color = INCOME_COLOR;
  else if (targetType === 'balance') color = BALANCE_COLOR;
  else color = getExpenseColor(payload?.target?.name || '', payload?.target?.expenseIndex ?? 0);

  return (
    <Layer>
      <path
        d={`M${sourceX},${sourceY} C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}`}
        fill="none"
        stroke={color}
        strokeWidth={linkWidth}
        strokeOpacity={0.3}
      />
    </Layer>
  );
};

const CHART_W = 640;

export const SankeyChart: React.FC<SankeyChartProps> = ({ items }) => {
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
        const chartH = Math.max(520, 4 * 90 + 100 + 120); // conservative estimate
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

    // Expense category nodes — wohnkosten items are grouped as one "Wohnkosten" block
    const categoryTotals = new Map<string, number>();
    expenseItems.forEach(item => {
      const cat = item.isWohnkosten ? 'Wohnkosten' : (item.category || 'Sonstiges');
      categoryTotals.set(cat, (categoryTotals.get(cat) || 0) + item.amount);
    });
    const sortedCategories = Array.from(categoryTotals.entries()).sort((a, b) => b[1] - a[1]);

    categoryColorCache.clear();
    sortedCategories.forEach(([cat], i) => {
      nodeMap.set(cat, nodes.length);
      nodes.push({ name: cat, nodeType: 'expense', expenseIndex: i });
    });

    // Balance node — added last so Sankey places it at the bottom
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
      <div className="h-64 flex items-center justify-center text-[#6c7086] bg-[#181825] rounded-2xl border border-[#313244]">
        <p className="italic">Keine Daten für Sankey-Diagramm</p>
      </div>
    );
  }

  const rightNodeCount = sankeyData.nodes.filter(n => n.nodeType === 'expense' || n.nodeType === 'balance').length;
  const hasBalance = sankeyData.balance > 0;
  const leftNodeCount = sankeyData.nodes.filter(n => n.nodeType === 'income').length;
  const maxSideNodes = Math.max(rightNodeCount, leftNodeCount);
  const CHART_H = Math.max(520, maxSideNodes * 90 + (hasBalance ? 100 : 0) + 120);
  const viewportH = typeof window !== 'undefined' ? window.innerHeight : 800;
  // Reserve space for header (~73px), nav (~80px), page title (~60px), padding (~40px)
  const availableH = viewportH - 253;
  const fitScale = containerWidth > 0
    ? Math.min(1, containerWidth / CHART_W, availableH / CHART_H)
    : 1;
  const containerHeight = Math.round(CHART_H * fitScale);

  // Center the inner div: place its left edge so its center aligns with container center
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
            node={<CustomNode isMobile={false} />}
            link={<CustomLink />}
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
