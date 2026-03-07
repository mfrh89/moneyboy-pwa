import React from 'react';
import { FinanceItem } from '../types';
import { TransactionList } from './TransactionList';

interface WohnenViewProps {
  items: FinanceItem[];
  total: number;
  onEdit: (item: FinanceItem) => void;
  onAdd: () => void;
}

export const WohnenView: React.FC<WohnenViewProps> = ({ items, total, onEdit, onAdd }) => {
  const format = (val: number) => new Intl.NumberFormat('de-DE', {
    style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(val);

  const formattedTotal = format(total);

  const hasSplitItems = items.some(i => i.isSplit);
  const combinedTotal = items.reduce((sum, i) => sum + (i.isSplit ? i.amount * 2 : i.amount), 0);
  const formattedCombined = format(combinedTotal);

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <h2 className="text-2xl font-bold text-[#cdd6f4]">Wohnen</h2>

      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#181825] to-[#11111b] shadow-2xl p-8 flex flex-col items-center gap-3">
        <p className="text-xs font-bold uppercase tracking-widest text-[#a6adc8]">Monatliche Wohnkosten</p>
        <p className={`text-5xl font-extrabold tracking-tight ${items.length === 0 ? 'text-[#45475a]' : 'text-[#cdd6f4]'}`}>
          {items.length === 0 ? '—' : formattedTotal}
        </p>
        {items.length === 0 && (
          <p className="text-xs text-[#6c7086]">Füge unten Kosten hinzu</p>
        )}
        {hasSplitItems && (
          <p className="text-xs text-[#6c7086]">Gesamt: {formattedCombined}</p>
        )}
      </section>

      <TransactionList
        title="Wohnkosten"
        items={items}
        onEdit={onEdit}
        onAdd={onAdd}
        emptyMessage="Noch keine Wohnkosten erfasst."
        accentColor="text-[#89b4fa]"
      />
    </div>
  );
};
