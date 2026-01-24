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
        return 'bg-[#a6e3a1]/10 text-[#a6e3a1] border-[#a6e3a1]/20';
      case 'expense':
        return 'bg-[#f38ba8]/10 text-[#f38ba8] border-[#f38ba8]/20';
      case 'flexible':
        return 'bg-[#fab387]/10 text-[#fab387] border-[#fab387]/20';
      case 'total':
        // Transparent Red (matching Income style but red)
        return 'bg-[#f38ba8]/10 text-[#f38ba8] border-[#f38ba8]/20';
      default:
        // Balance
        return 'bg-[#cba6f7]/10 text-[#cba6f7] border-[#cba6f7]/20';
    }
  };
  
  // Specific border colors for the "tiny" bordered variant
  const getBorderColor = () => {
    switch (type) {
        case 'expense': return 'border-[#f38ba8]/40 text-[#f38ba8]';
        case 'flexible': return 'border-[#fab387]/40 text-[#fab387]';
        default: return 'border-[#cdd6f4]/40 text-[#cdd6f4]';
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
    maximumFractionDigits: 0, // No decimals for cleaner look in tiny mode
    minimumFractionDigits: 0
  }).format(amount);
  
  const preciseAmount = new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2
  }).format(amount);

  // --- LARGE VARIANT (Hero / Balance) ---
  // Updated to Horizontal Layout
  if (size === 'lg') {
    return (
      <div className="flex items-center justify-between px-2 py-1 bg-transparent w-full">
         <div className="p-3 rounded-full bg-white/5 backdrop-blur-sm text-[#cdd6f4] shrink-0 mr-4">
            {getIcon()}
         </div>
         <div className="text-right">
            <span className="block text-xs font-bold uppercase tracking-widest opacity-60 mb-0.5 text-[#a6adc8]">{label}</span>
            <span className="block text-3xl md:text-4xl font-extrabold tracking-tight text-[#cdd6f4]">{preciseAmount}</span>
         </div>
      </div>
    );
  }

  // --- TINY VARIANT (For specific expense types) ---
  if (size === 'tiny') {
    const isFilledStyle = type === 'total';
    
    const containerClasses = isFilledStyle 
      ? `border ${getColors()} bg-[#181825] shadow-sm`
      : `border ${getBorderColor()} bg-transparent border-dashed`;

    return (
      <div className={`rounded-xl py-4 px-4 flex items-center justify-between transition-transform active:scale-95 ${containerClasses}`}>
        <div className="flex items-center gap-3">
            <div className={`p-1.5 rounded-full ${isFilledStyle ? 'bg-white/10' : ''}`}>
                {getIcon()}
            </div>
            <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-80 leading-tight">{label}</span>
                <span className={`font-bold text-lg leading-tight ${isFilledStyle ? 'text-[#cdd6f4]' : ''}`}>
                    {formattedAmount}
                </span>
            </div>
        </div>
      </div>
    );
  }

  // --- DEFAULT / MD VARIANT (Income / Total Card) ---
  // Updated to Horizontal Layout (Side-by-side)
  return (
    <div 
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl p-4 border shadow-sm transition-transform active:scale-95 flex items-center gap-4 ${getColors()} bg-[#181825] ${onClick ? 'cursor-pointer hover:brightness-110' : ''}`}
    >
      {/* Icon Left */}
      <div className="p-2.5 rounded-xl bg-white/5 backdrop-blur-sm shrink-0">
        {getIcon()}
      </div>
      
      {/* Text Center/Left */}
      <div className="flex flex-col flex-grow min-w-0">
        <span className="text-[10px] font-bold uppercase tracking-wider opacity-70 leading-tight mb-0.5">{label}</span>
        <span className="text-2xl font-bold tracking-tight leading-none truncate">{preciseAmount}</span>
      </div>

      {/* Actions Right */}
      {(onAdd || onClick) && (
        <div className="flex items-center gap-2 shrink-0 ml-1">
            {onAdd && (
            <button 
                onClick={(e) => { e.stopPropagation(); onAdd(); }}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
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