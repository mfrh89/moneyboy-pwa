import React from 'react';
import { AlertCircle, Calendar, Repeat } from 'lucide-react';
import { FinanceItem } from '../types';

interface SubscriptionAlertProps {
  subscriptions: FinanceItem[];
  onItemClick: (item: FinanceItem) => void;
}

export const SubscriptionAlert: React.FC<SubscriptionAlertProps> = ({ subscriptions, onItemClick }) => {
  if (subscriptions.length === 0) return null;

  const getTimeDiffText = (timestamp: number): { text: string; isUrgent: boolean } => {
    const now = Date.now();
    const diff = timestamp - now;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (days < 0) return { text: 'Überfällig', isUrgent: true };
    if (days === 0) return { text: 'Heute', isUrgent: true };
    if (days === 1) return { text: 'Morgen', isUrgent: true };
    if (days === 2) return { text: 'In 2 Tagen', isUrgent: true };
    return { text: `In ${days} Tagen`, isUrgent: false };
  };

  return (
    <div className="bg-surface-lowest rounded-ds-lg p-4 shadow-float animate-in slide-in-from-top-2 duration-300">
      <div className="flex items-center gap-2 mb-3">
        <AlertCircle className="w-5 h-5 text-on-surface" />
        <h3 className="text-[0.75rem] font-medium text-on-surface uppercase tracking-[0.05em]">
          BALD FÄLLIGE ABOS ({subscriptions.length})
        </h3>
      </div>

      <div className="space-y-2">
        {subscriptions.map((sub) => {
          const nextBilling = sub.subscriptionNextBilling;
          const cancellationDeadline = sub.subscriptionCancellationDeadline;

          const relevantDate = cancellationDeadline && cancellationDeadline < (nextBilling || Infinity)
            ? { timestamp: cancellationDeadline, label: 'Kündigen bis', isCancellation: true }
            : { timestamp: nextBilling!, label: 'Verlängerung', isCancellation: false };

          const timeDiff = getTimeDiffText(relevantDate.timestamp);

          return (
            <div
              key={sub.id}
              onClick={() => onItemClick(sub)}
              className="bg-surface-low hover:bg-surface-mid rounded-ds-md p-3 cursor-pointer transition-all group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Repeat className="w-3.5 h-3.5 text-status-info flex-shrink-0" />
                    <span className="font-bold text-on-surface text-sm truncate">{sub.title}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                    <Calendar className="w-3 h-3" />
                    <span>{relevantDate.label}</span>
                    <span className="text-outline-variant">/</span>
                    <span className={timeDiff.isUrgent ? 'text-status-error font-bold' : 'text-on-surface-variant'}>
                      {timeDiff.text}
                    </span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-mono text-sm font-bold text-on-surface">
                    {sub.amount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                  </div>
                  {sub.subscriptionCycle && (
                    <div className="text-xs text-outline-variant mt-0.5">
                      {sub.subscriptionCycle === 'monthly' ? '/Monat' : sub.subscriptionCycle === 'yearly' ? '/Jahr' : '/Quartal'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};