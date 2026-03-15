
import React, { useState } from 'react';
import { FinanceItem } from '../types';
import { Pencil, Plus, Users, Home, Repeat, Filter } from 'lucide-react';

interface TransactionListProps {
  title: string;
  items: FinanceItem[];
  onEdit: (item: FinanceItem) => void;
  onAdd?: () => void; // New prop for quick add
  emptyMessage: string;
  accentColor?: string; // e.g. 'text-[#f38ba8]'
  showSubscriptionFilter?: boolean; // Show subscription filter toggle
}

export const TransactionList: React.FC<TransactionListProps> = ({ 
  title, 
  items, 
  onEdit, 
  onAdd,
  emptyMessage,
  accentColor = 'text-[#cdd6f4]',
  showSubscriptionFilter = false
}) => {
  const [showOnlySubscriptions, setShowOnlySubscriptions] = useState(false);
  
  const filteredItems = showOnlySubscriptions 
    ? items.filter(item => item.isSubscription)
    : items;
  
  const subscriptionCount = items.filter(item => item.isSubscription).length;
  
  return (
    <div className="bg-[#181825] rounded-2xl border border-[#313244] shadow-sm overflow-hidden flex flex-col h-fit">
      <div className="p-4 border-b border-[#313244] bg-[#1e1e2e] flex justify-between items-center shrink-0">
        <h3 className={`font-bold ${accentColor}`}>{title}</h3>
        <div className="flex items-center gap-2">
            {showSubscriptionFilter && subscriptionCount > 0 && (
                <button
                    onClick={() => setShowOnlySubscriptions(!showOnlySubscriptions)}
                    className={`px-2 py-1 rounded-md h-[26px] flex items-center gap-1.5 transition-all text-xs font-bold ${
                        showOnlySubscriptions 
                            ? 'bg-[#cba6f7] text-[#1e1e2e]' 
                            : 'bg-[#45475a] hover:bg-[#585b70] text-[#cdd6f4]'
                    }`}
                    title={showOnlySubscriptions ? 'Alle anzeigen' : 'Nur Abos'}
                >
                    <Repeat className="w-3 h-3" />
                    {showOnlySubscriptions && <span>{subscriptionCount}</span>}
                </button>
            )}
            <span className="text-xs font-bold px-2 py-1 bg-[#45475a] text-[#cdd6f4] rounded-md min-w-[28px] h-[26px] flex items-center justify-center">
                {filteredItems.length}
            </span>
            {onAdd && (
                <button 
                    onClick={onAdd}
                    className="px-2 py-1 bg-[#45475a] hover:bg-[#585b70] text-[#cdd6f4] rounded-md h-[26px] flex items-center justify-center transition-colors"
                    title="Eintrag hinzufügen"
                >
                    <Plus className="w-3.5 h-3.5" />
                </button>
            )}
        </div>
      </div>
      
      <div className="p-2">
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center text-[#6c7086] text-sm italic">
            {showOnlySubscriptions ? 'Keine Abos vorhanden' : emptyMessage}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => onEdit(item)}
                className="group flex items-center justify-between p-2 rounded-xl hover:bg-[#313244] border border-transparent hover:border-[#45475a] transition-all cursor-pointer"
              >
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    {item.isWohnkosten && (
                      <div className="p-0.5 rounded bg-[#89b4fa]/15 text-[#89b4fa]">
                        <Home className="w-3 h-3" strokeWidth={2.5} />
                      </div>
                    )}
                    {item.isSubscription && (
                      <div className="p-0.5 rounded bg-[#cba6f7]/15 text-[#cba6f7]">
                        <Repeat className="w-3 h-3" strokeWidth={2.5} />
                      </div>
                    )}
                    <span className="font-bold text-[#cdd6f4] text-sm">{item.title}</span>
                    {item.isSplit && (
                        <Users className="w-3 h-3 text-[#89b4fa]" strokeWidth={2.5} />
                    )}
                  </div>
                  <span className="text-[10px] text-[#a6adc8] font-medium">{item.category}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex flex-col items-end">
                    <span className={`font-mono font-bold text-sm ${item.type === 'income' ? 'text-[#a6e3a1]' : accentColor}`}>
                      {item.type === 'expense' ? '-' : '+'}
                      {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(item.amount)}
                    </span>
                    {item.isSplit && (
                      <span className="font-mono text-[10px] text-[#6c7086]">
                        {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(item.amount * 2)}
                      </span>
                    )}
                  </div>
                  <Pencil className="w-3 h-3 text-[#6c7086] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
