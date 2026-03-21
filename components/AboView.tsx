import React from 'react';
import { FinanceItem } from '../types';
import { TransactionList } from './TransactionList';

interface AboViewProps {
  items: FinanceItem[];
  total: number;
  onEdit: (item: FinanceItem) => void;
  onAdd: () => void;
}

export const AboView: React.FC<AboViewProps> = ({ items, total, onEdit, onAdd }) => {
  const format = (val: number) => new Intl.NumberFormat('de-DE', {
    style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(val);

  const formattedTotal = format(total);

  const hasSplitItems = items.some(i => i.isSplit);
  const combinedTotal = items.reduce((sum, i) => sum + (i.isSplit ? i.amount * 2 : i.amount), 0);
  const formattedCombined = format(combinedTotal);

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <h2 className="text-[1.5rem] md:text-[2.5rem] font-bold text-on-surface tracking-[-0.02em] leading-[1.15]">Abonnements</h2>

      <section className="relative overflow-hidden rounded-ds-xl bg-surface-lowest shadow-float p-8 flex flex-col items-center gap-3">
        <p className="text-[0.75rem] font-medium uppercase tracking-[0.05em] text-on-surface-variant">MONATLICHE ABO-KOSTEN</p>
        <p className={`text-5xl font-extrabold tracking-tight ${items.length === 0 ? 'text-outline-variant' : 'text-on-surface'}`}>
          {items.length === 0 ? '\u2014' : formattedTotal}
        </p>
        {items.length === 0 && (
          <p className="text-xs text-outline-variant">Markiere Ausgaben als Abo um sie hier zu sehen</p>
        )}
        {hasSplitItems && (
          <p className="text-xs text-outline-variant">Gesamt: {formattedCombined}</p>
        )}
      </section>

      <TransactionList
        title="Abonnements"
        items={items}
        onEdit={onEdit}
        onAdd={onAdd}
        emptyMessage="Noch keine Abonnements erfasst."
        accentColor="text-status-info"
      />
    </div>
  );
};