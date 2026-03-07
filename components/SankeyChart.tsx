import React, { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { Sankey, ResponsiveContainer, Layer, Rectangle } from 'recharts';
import { FinanceItem } from '../types';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

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

  const gap = isMobile ? 6 : 10;
  const labelX = isIncome ? x - gap : x + width + gap;
  const anchor = isIncome ? 'end' : 'start';
  const nodeValue = payload.value || 0;
  const nameFontSize = isMobile ? 10 : 12;
  const valueFontSize = isMobile ? 9 : 11;
  const labelSpacing = isMobile ? 6 : 9;
  const maxChars = isMobile ? 11 : 999;

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

export const SankeyChart: React.FC<SankeyChartProps> = ({ items }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const panStart = useRef({ x: 0, y: 0 });
  const translateAtPanStart = useRef({ x: 0, y: 0 });
  const lastDistance = useRef(0);

  const resetView = useCallback(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }, []);

  const zoomIn = useCallback(() => setScale(s => Math.min(s * 1.3, 4)), []);
  const zoomOut = useCallback(() => {
    setScale(s => {
      const next = s / 1.3;
      if (next <= 1.05) {
        setTranslate({ x: 0, y: 0 });
        return 1;
      }
      return next;
    });
  }, []);

  // Mouse drag panning
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (scale <= 1) return;
    e.preventDefault();
    setIsPanning(true);
    panStart.current = { x: e.clientX, y: e.clientY };
    translateAtPanStart.current = { ...translate };
  }, [scale, translate]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return;
    e.preventDefault();
    setTranslate({
      x: translateAtPanStart.current.x + (e.clientX - panStart.current.x),
      y: translateAtPanStart.current.y + (e.clientY - panStart.current.y),
    });
  }, [isPanning]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Mouse wheel zoom
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(s => {
      const next = Math.min(Math.max(s * delta, 1), 4);
      if (next <= 1.02) {
        setTranslate({ x: 0, y: 0 });
        return 1;
      }
      return next;
    });
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(entries => {
      setContainerWidth(entries[0].contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Touch: pinch zoom + pan
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        lastDistance.current = Math.sqrt(dx * dx + dy * dy);
      } else if (e.touches.length === 1 && scale > 1) {
        setIsPanning(true);
        panStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        translateAtPanStart.current = { ...translate };
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (lastDistance.current > 0) {
          const delta = dist / lastDistance.current;
          setScale(s => Math.min(Math.max(s * delta, 0.8), 4));
        }
        lastDistance.current = dist;
      } else if (e.touches.length === 1 && isPanning && scale > 1) {
        e.preventDefault();
        setTranslate({
          x: translateAtPanStart.current.x + (e.touches[0].clientX - panStart.current.x),
          y: translateAtPanStart.current.y + (e.touches[0].clientY - panStart.current.y),
        });
      }
    };

    const handleTouchEnd = () => {
      lastDistance.current = 0;
      setIsPanning(false);
      setScale(s => {
        if (s < 1) {
          setTranslate({ x: 0, y: 0 });
          return 1;
        }
        return s;
      });
    };

    el.addEventListener('touchstart', handleTouchStart, { passive: false });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd);

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [scale, translate, isPanning]);

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

    // Expense category nodes — each gets a stable expenseIndex for color assignment
    const categoryTotals = new Map<string, number>();
    expenseItems.forEach(item => {
      const cat = item.category || 'Sonstiges';
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

  const isMobile = containerWidth > 0 && containerWidth < 520;
  const sideMargin = isMobile ? 90 : 140;

  const rightNodeCount = sankeyData.nodes.filter(n => n.nodeType === 'expense' || n.nodeType === 'balance').length;
  const hasBalance = sankeyData.balance > 0;
  const leftNodeCount = sankeyData.nodes.filter(n => n.nodeType === 'income').length;
  const maxSideNodes = Math.max(rightNodeCount, leftNodeCount);
  // Extra height for balance separator spacing
  const chartHeight = Math.max(isMobile ? 320 : 400, maxSideNodes * (isMobile ? 50 : 64) + (hasBalance ? 60 : 0) + 40);

  return (
    <div className="bg-[#181825] rounded-2xl border border-[#313244] shadow-sm overflow-hidden">
      <div className="flex items-center justify-between p-4 pb-0 px-6">
        <h3 className="text-lg font-bold text-[#cdd6f4]">Geldfluss</h3>
        <div className="flex items-center gap-1">
          <button
            onClick={zoomOut}
            className="p-1.5 rounded-lg text-[#6c7086] hover:text-[#cdd6f4] hover:bg-[#313244] transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={zoomIn}
            className="p-1.5 rounded-lg text-[#6c7086] hover:text-[#cdd6f4] hover:bg-[#313244] transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          {scale !== 1 && (
            <button
              onClick={resetView}
              className="p-1.5 rounded-lg text-[#6c7086] hover:text-[#cdd6f4] hover:bg-[#313244] transition-colors"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div
        ref={containerRef}
        className="w-full overflow-hidden touch-none select-none"
        style={{ height: chartHeight, cursor: scale > 1 ? (isPanning ? 'grabbing' : 'grab') : 'default' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          style={{
            transform: `scale(${scale}) translate(${translate.x / scale}px, ${translate.y / scale}px)`,
            transformOrigin: 'center center',
            width: '100%',
            height: '100%',
            transition: isPanning ? 'none' : 'transform 0.15s ease-out',
            pointerEvents: isPanning ? 'none' : 'auto',
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <Sankey
              data={sankeyData}
              node={<CustomNode isMobile={isMobile} />}
              link={<CustomLink />}
              nodePadding={isMobile ? 18 : 28}
              nodeWidth={isMobile ? 6 : 8}
              margin={{ top: 24, right: sideMargin, bottom: 32, left: sideMargin }}
              iterations={64}
            />
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};
