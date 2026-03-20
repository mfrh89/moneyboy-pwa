import React from 'react';
import { ArrowUpCircle, ArrowDownCircle, Wallet, Plus, TrendingDown, ChevronDown } from 'lucide-react';

interface SummaryCardProps {
  label: string;
  amount: number;
  type: 'income' | 'expense' | 'balance' | 'flexible' | 'total';
  onAdd?: () => void;
  onClick?: () => void;
  isOpen?: boolean;
  size?: 'tiny' | 'sm' | 'md' | 'lg';
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  label,
  amount,
  type,
  onAdd,
  onClick,
  isOpen,
  size = 'md'
}) => {
  const getColors = () => {
    switch (type) {
      case 'income':
        return 'bg-surface-low text-status-success';
      case 'expense':
        return 'bg-surface-low text-on-surface';
      case 'flexible':
        return 'bg-surface-low text-status-warning';
      case 'total':
        return 'bg-surface-low text-on-surface';
      default:
        // Balance
        return 'bg-surface-lowest text-primary';
    }
  };

  const getBorderColor = () => {
    switch (type) {
        case 'expense': return 'border-on-surface/20 text-on-surface';
        case 'flexible': return 'border-on-surface-variant/20 text-on-surface-variant';
        default: return 'border-outline-variant/30 text-on-surface';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'income':
        return <ArrowDownCircle className={`${size === 'tiny' ? 'w-5 h-5' : 'w-6 h-6'}`} />;
      case 'expense':
      case 'flexible':
        return <TrendingDown className={`${size === 'tiny' ? 'w-5 h-5' : 'w-6 h-6'}`} />;
      case 'total':
        return <ArrowUpCircle className={`${size === 'tiny' ? 'w-5 h-5' : 'w-6 h-6'}`} />;
      default:
        return <Wallet className="w-8 h-8" />;
    }
  };

  const formattedAmount = new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0
  }).format(amount);

  const preciseAmount = new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2
  }).format(amount);

  // --- LARGE VARIANT (Hero / Balance) ---
  if (size === 'lg') {
    return (
      <div className="flex items-center justify-between px-2 py-1 bg-transparent w-full">
         <div className="p-3 rounded-full bg-surface-high text-on-surface shrink-0 mr-4">
            {getIcon()}
         </div>
         <div className="text-right">
            <span className="block text-[0.75rem] font-medium uppercase tracking-[0.05em] mb-0.5 text-on-surface-variant">{label}</span>
            <span className="block text-3xl md:text-4xl font-extrabold tracking-tight text-on-surface">{preciseAmount}</span>
         </div>
      </div>
    );
  }

  // --- TINY VARIANT (For specific expense types) ---
  if (size === 'tiny') {
    const isFilledStyle = type === 'total';

    const containerClasses = isFilledStyle
      ? `${getColors()} bg-surface-lowest shadow-float`
      : `border ${getBorderColor()} bg-transparent border-dashed`;

    return (
      <div className={`rounded-ds-lg py-4 px-4 flex items-center justify-between transition-transform active:scale-95 ${containerClasses}`}>
        <div className="flex items-center gap-3">
            <div className={`p-1.5 rounded-full ${isFilledStyle ? 'bg-surface-high' : ''}`}>
                {getIcon()}
            </div>
            <div className="flex flex-col gap-0.5">
                <span className="text-[0.6875rem] font-medium uppercase tracking-[0.08em] opacity-80 leading-tight">{label}</span>
                <span className={`font-bold text-lg leading-tight ${isFilledStyle ? 'text-on-surface' : ''}`}>
                    {formattedAmount}
                </span>
            </div>
        </div>
      </div>
    );
  }

  // --- DEFAULT / MD VARIANT (Income / Total Card) ---
  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-ds-lg p-4 shadow-float transition-transform active:scale-95 flex items-center gap-4 ${getColors()} bg-surface-lowest ${onClick ? 'cursor-pointer hover:bg-surface-low' : ''}`}
    >
      {/* Icon Left */}
      <div className="p-2.5 rounded-ds-md bg-surface-high shrink-0">
        {getIcon()}
      </div>

      {/* Text Center/Left */}
      <div className="flex flex-col flex-grow min-w-0">
        <span className="text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-on-surface-variant leading-tight mb-0.5">{label}</span>
        <span className="text-2xl font-bold tracking-tight leading-none truncate text-on-surface">{preciseAmount}</span>
      </div>

      {/* Actions Right */}
      {(onAdd || onClick) && (
        <div className="flex items-center gap-2 shrink-0 ml-1">
            {onAdd && (
            <button
                onClick={(e) => { e.stopPropagation(); onAdd(); }}
                className="p-1.5 rounded-ds-sm hover:bg-surface-high transition-colors"
            >
                <Plus className="w-5 h-5" />
            </button>
            )}

            {onClick && !onAdd && (
                 <div className={`p-1 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                     <ChevronDown className="w-5 h-5 opacity-60" />
                 </div>
            )}
        </div>
      )}
    </div>
  );
};