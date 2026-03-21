
import React, { useState } from 'react';
import { FinanceItem } from '../types';
import { Pencil, Plus, Users, Home, Repeat, Filter } from 'lucide-react';

interface TransactionListProps {
  title: string;
  items: FinanceItem[];
  onEdit: (item: FinanceItem) => void;
  onAdd?: () => void;
  emptyMessage: string;
  accentColor?: string;
  showSubscriptionFilter?: boolean;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  title,
  items,
  onEdit,
  onAdd,
  emptyMessage,
  accentColor = 'text-on-surface',
  showSubscriptionFilter = false
}) => {
  const [showOnlySubscriptions, setShowOnlySubscriptions] = useState(false);

  const filteredItems = showOnlySubscriptions
    ? items.filter(item => item.isSubscription)
    : items;

  const subscriptionCount = items.filter(item => item.isSubscription).length;

  return (
    <div className="bg-surface-lowest rounded-ds-lg shadow-float overflow-hidden flex flex-col h-fit">
      <div className="p-4 bg-surface-high flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2.5">
          <div className={`w-2 h-2 rounded-full ${accentColor.replace('text-', 'bg-')}`} />
          <h3 className="font-semibold text-[1.25rem] text-on-surface">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
            {showSubscriptionFilter && subscriptionCount > 0 && (
                <button
                    onClick={() => setShowOnlySubscriptions(!showOnlySubscriptions)}
                    className={`px-2 py-1 rounded-ds-md h-[26px] flex items-center gap-1.5 transition-all text-xs font-bold ${
                        showOnlySubscriptions
                            ? 'bg-primary text-on-primary'
                            : 'bg-surface-high hover:bg-surface-highest text-on-surface'
                    }`}
                    title={showOnlySubscriptions ? 'Alle anzeigen' : 'Nur Abos'}
                >
                    <Repeat className="w-3 h-3" />
                    {showOnlySubscriptions && <span>{subscriptionCount}</span>}
                </button>
            )}
            <span className="text-xs font-bold px-2 py-1 bg-surface-high text-on-surface rounded-ds-md min-w-[28px] h-[26px] flex items-center justify-center">
                {filteredItems.length}
            </span>
            {onAdd && (
                <button
                    onClick={onAdd}
                    className="px-2 py-1 bg-primary hover:bg-primary-container text-on-primary rounded-ds-md h-[26px] flex items-center justify-center transition-colors"
                    title="Eintrag hinzufügen"
                >
                    <Plus className="w-3.5 h-3.5" />
                </button>
            )}
        </div>
      </div>

      <div className="p-3">
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center text-outline-variant text-sm">
            {showOnlySubscriptions ? 'Keine Abos vorhanden' : emptyMessage}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => onEdit(item)}
                className="group flex items-center justify-between p-3 rounded-ds-md can-hover:hover:bg-surface-low transition-all cursor-pointer"
              >
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    {item.isWohnkosten && (
                      <div className="p-0.5 rounded-ds-xs bg-surface-high text-status-info">
                        <Home className="w-3 h-3" strokeWidth={2.5} />
                      </div>
                    )}
                    {item.isSubscription && (
                      <div className="p-0.5 rounded-ds-xs bg-surface-high text-status-info">
                        <Repeat className="w-3 h-3" strokeWidth={2.5} />
                      </div>
                    )}
                    <span className="font-bold text-on-surface text-sm">{item.title}</span>
                    {item.isSplit && (
                        <Users className="w-3 h-3 text-status-info" strokeWidth={2.5} />
                    )}
                  </div>
                  <span className="text-[0.6875rem] text-on-surface-variant font-medium tracking-[0.08em] uppercase">{item.category}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex flex-col items-end">
                    <span className={`font-mono font-bold text-sm ${item.type === 'income' ? 'text-status-success' : 'text-on-surface'}`}>
                      {item.type === 'expense' ? '-' : '+'}
                      {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(item.amount)}
                    </span>
                    {item.isSplit && (
                      <span className="font-mono text-[10px] text-outline-variant">
                        {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(item.amount * 2)}
                      </span>
                    )}
                  </div>
                  <Pencil className="w-3 h-3 text-outline-variant opacity-0 can-hover:group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
