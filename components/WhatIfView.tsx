import React, { useState, useMemo, useEffect } from 'react';
import { FinanceItem, TransactionType } from '../types';
import { loadScenario, saveScenario } from '../services/storage';
import { Plus, RotateCcw, Pencil, X, Check, Trash2, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface WhatIfViewProps {
  items: FinanceItem[];
  user: any;
}

function calcSummary(items: FinanceItem[]) {
  const income = items
    .filter(i => i.type === 'income' && !i.excluded)
    .reduce((sum, i) => sum + i.amount, 0);
  const fixed = items
    .filter(i => i.type === 'expense' && !i.isFlexible && !i.excluded)
    .reduce((sum, i) => sum + i.amount, 0);
  const flexible = items
    .filter(i => i.type === 'expense' && i.isFlexible && !i.excluded)
    .reduce((sum, i) => sum + i.amount, 0);
  return {
    totalIncome: income,
    totalAllExpenses: fixed + flexible,
    balance: income - fixed - flexible,
  };
}

const fmt = (n: number) =>
  new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(n);

export const WhatIfView: React.FC<WhatIfViewProps> = ({ items, user }) => {
  const [overrides, setOverrides] = useState<Record<string, number>>({});
  const [scenarioExcluded, setScenarioExcluded] = useState<Set<string>>(new Set());
  const [additions, setAdditions] = useState<FinanceItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newType, setNewType] = useState<TransactionType>('expense');
  const [newIsFlexible, setNewIsFlexible] = useState(false);

  // Load scenario from Firebase (or localStorage fallback) on mount
  useEffect(() => {
    loadScenario(user).then((data) => {
      setOverrides(data?.overrides ?? {});
      setScenarioExcluded(new Set(data?.excluded ?? []));
      setAdditions(data?.additions ?? []);
      setLoaded(true);
    });
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist to Firebase (or localStorage fallback) on every change
  useEffect(() => {
    if (!loaded) return;
    saveScenario(user, {
      overrides,
      excluded: [...scenarioExcluded],
      additions,
    });
  }, [overrides, scenarioExcluded, additions, loaded]); // eslint-disable-line react-hooks/exhaustive-deps

  const currentSummary = useMemo(() => calcSummary(items), [items]);

  const scenarioItems = useMemo(() => {
    const base = items.map(item => ({
      ...item,
      amount: overrides[item.id] !== undefined ? overrides[item.id] : item.amount,
      excluded: scenarioExcluded.has(item.id) ? true : item.excluded,
    }));
    return [...base, ...additions];
  }, [items, overrides, scenarioExcluded, additions]);

  const scenarioSummary = useMemo(() => calcSummary(scenarioItems), [scenarioItems]);

  const delta = scenarioSummary.balance - currentSummary.balance;
  const isImproved = delta > 0;
  const hasChanges =
    Object.keys(overrides).length > 0 || scenarioExcluded.size > 0 || additions.length > 0;

  const handleReset = () => {
    setOverrides({});
    setScenarioExcluded(new Set());
    setAdditions([]);
    setEditingId(null);
    saveScenario(user, null);
  };

  const startEdit = (item: FinanceItem) => {
    const currentAmount = overrides[item.id] !== undefined ? overrides[item.id] : item.amount;
    setEditingId(item.id);
    setEditValue(currentAmount.toString());
  };

  const confirmEdit = (itemId: string) => {
    const parsed = parseFloat(editValue.replace(',', '.'));
    if (!isNaN(parsed) && parsed >= 0) {
      setOverrides(prev => ({ ...prev, [itemId]: parsed }));
    }
    setEditingId(null);
  };

  const resetOverride = (itemId: string) => {
    setOverrides(prev => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
  };

  const toggleScenarioExcluded = (itemId: string) => {
    setScenarioExcluded(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const removeAddition = (id: string) => {
    setAdditions(prev => prev.filter(i => i.id !== id));
  };

  const handleAddItem = () => {
    const parsed = parseFloat(newAmount.replace(',', '.'));
    if (!newTitle.trim() || isNaN(parsed) || parsed <= 0) return;
    const newItem: FinanceItem = {
      id: `whatif_${Date.now()}`,
      title: newTitle.trim(),
      amount: parsed,
      type: newType,
      category: newType === 'income' ? 'Gehalt' : 'Sonstiges',
      isFlexible: newType === 'expense' ? newIsFlexible : false,
      createdAt: Date.now(),
    };
    setAdditions(prev => [...prev, newItem]);
    setNewTitle('');
    setNewAmount('');
    setNewType('expense');
    setNewIsFlexible(false);
    setShowAddForm(false);
  };

  const incomeItems = items.filter(i => i.type === 'income').sort((a, b) => b.amount - a.amount);
  const expenseItems = items.filter(i => i.type === 'expense').sort((a, b) => b.amount - a.amount);

  const renderItem = (item: FinanceItem, isAddition = false) => {
    const isExcluded = isAddition ? false : (scenarioExcluded.has(item.id) || !!item.excluded);
    const scenarioAmount = overrides[item.id] !== undefined ? overrides[item.id] : item.amount;
    const hasAmountChange = !isAddition && overrides[item.id] !== undefined && overrides[item.id] !== item.amount;
    const isEditing = editingId === item.id;
    const isOriginallyExcluded = !isAddition && !!item.excluded && !scenarioExcluded.has(item.id);

    return (
      <div
        key={item.id}
        className={`flex items-center gap-2 py-3 px-4 rounded-ds-md transition-all ${isExcluded ? 'opacity-40' : ''}`}
      >
        {/* Title + category */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            {isAddition && (
              <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded uppercase tracking-wide">
                Neu
              </span>
            )}
            <span className={`font-bold text-sm text-on-surface truncate ${isExcluded ? 'line-through' : ''}`}>
              {item.title}
            </span>
          </div>
          <span className="text-[0.6875rem] text-on-surface-variant uppercase tracking-[0.08em]">
            {item.category}
          </span>
        </div>

        {/* Amount */}
        <div className="flex flex-col items-end shrink-0">
          {hasAmountChange && (
            <span className="text-[10px] text-on-surface-variant line-through font-mono">
              {fmt(item.amount)}
            </span>
          )}
          {isEditing ? (
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') confirmEdit(item.id);
                  if (e.key === 'Escape') setEditingId(null);
                }}
                className="w-24 text-right bg-surface-mid border border-primary rounded-ds-sm px-2 py-1 text-sm font-mono text-on-surface focus:outline-none"
                autoFocus
              />
              <button onClick={() => confirmEdit(item.id)} className="w-11 h-11 flex items-center justify-center text-status-success">
                <Check className="w-4 h-4" />
              </button>
              <button onClick={() => setEditingId(null)} className="w-11 h-11 flex items-center justify-center text-on-surface-variant">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <span
              className={`font-mono font-bold text-sm ${
                item.type === 'income' ? 'text-status-success' : 'text-on-surface'
              } ${isExcluded ? 'line-through' : ''}`}
            >
              {item.type === 'expense' ? '-' : '+'}
              {fmt(scenarioAmount)}
            </span>
          )}
        </div>

        {/* Actions */}
        {!isEditing && (
          <div className="flex items-center shrink-0">
            {isAddition ? (
              <button
                onClick={() => removeAddition(item.id)}
                className="w-11 h-11 flex items-center justify-center text-on-surface-variant hover:text-status-error transition-colors"
                title="Entfernen"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => startEdit(item)}
                  className="w-11 h-11 flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
                  title="Betrag anpassen"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                {hasAmountChange && (
                  <button
                    onClick={() => resetOverride(item.id)}
                    className="w-11 h-11 flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
                    title="Zurücksetzen"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
                {!isOriginallyExcluded && (
                  <button
                    onClick={() => toggleScenarioExcluded(item.id)}
                    className={`w-11 h-11 flex items-center justify-center transition-colors ${
                      scenarioExcluded.has(item.id)
                        ? 'text-primary'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                    title={scenarioExcluded.has(item.id) ? 'Wieder einschließen' : 'Ausschließen'}
                  >
                    {scenarioExcluded.has(item.id) ? (
                      <Plus className="w-4 h-4" />
                    ) : (
                      <Minus className="w-4 h-4" />
                    )}
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-[2rem] md:text-[2.5rem] font-bold text-on-surface tracking-[-0.02em] leading-[1.15]">
            Was wäre wenn?
          </h2>
          <p className="text-sm text-on-surface-variant mt-1">
            Simuliere Änderungen ohne echte Daten zu verändern
          </p>
        </div>
        {hasChanges && (
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-3 py-2 rounded-ds-md bg-surface-high hover:bg-surface-highest text-on-surface-variant transition-colors text-sm mt-1"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        )}
      </div>

      {/* Comparison Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-surface-lowest rounded-ds-lg shadow-float p-5">
          <span className="text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-on-surface-variant">
            Aktuell
          </span>
          <div
            className={`text-2xl font-extrabold tracking-tight mt-1 ${
              currentSummary.balance >= 0 ? 'text-status-success' : 'text-status-error'
            }`}
          >
            {fmt(currentSummary.balance)}
          </div>
          <div className="mt-3 space-y-1 text-xs text-on-surface-variant">
            <div className="flex justify-between">
              <span>Einkommen</span>
              <span className="font-mono text-status-success">+{fmt(currentSummary.totalIncome)}</span>
            </div>
            <div className="flex justify-between">
              <span>Ausgaben</span>
              <span className="font-mono">-{fmt(currentSummary.totalAllExpenses)}</span>
            </div>
          </div>
        </div>

        <div
          className={`rounded-ds-lg shadow-float p-5 border-2 transition-colors ${
            hasChanges
              ? 'bg-surface-lowest border-primary/40'
              : 'bg-surface-lowest border-transparent'
          }`}
        >
          <span className="text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-primary">
            Szenario
          </span>
          <div
            className={`text-2xl font-extrabold tracking-tight mt-1 ${
              scenarioSummary.balance >= 0 ? 'text-status-success' : 'text-status-error'
            }`}
          >
            {fmt(scenarioSummary.balance)}
          </div>
          <div className="mt-3 space-y-1 text-xs text-on-surface-variant">
            <div className="flex justify-between">
              <span>Einkommen</span>
              <span className="font-mono text-status-success">+{fmt(scenarioSummary.totalIncome)}</span>
            </div>
            <div className="flex justify-between">
              <span>Ausgaben</span>
              <span className="font-mono">-{fmt(scenarioSummary.totalAllExpenses)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Delta */}
      {hasChanges && (
        <div
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-ds-lg font-bold ${
            isImproved
              ? 'bg-status-success/10 text-status-success'
              : delta < 0
              ? 'bg-status-error/10 text-status-error'
              : 'bg-surface-high text-on-surface-variant'
          }`}
        >
          {isImproved ? (
            <TrendingUp className="w-5 h-5 shrink-0" />
          ) : delta < 0 ? (
            <TrendingDown className="w-5 h-5 shrink-0" />
          ) : null}
          <span className="text-lg">
            {isImproved ? '+' : ''}
            {fmt(delta)}
          </span>
          <span className="text-sm font-normal opacity-80">Unterschied zum aktuellen Budget</span>
        </div>
      )}

      {/* Item lists */}
      <div className="space-y-4">
        {/* Income */}
        <div className="bg-surface-lowest rounded-ds-lg shadow-float overflow-hidden">
          <div className="px-4 py-3 bg-surface-high flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-status-success" />
            <h3 className="font-semibold text-on-surface">Einkommen</h3>
            <span className="ml-auto text-xs font-bold px-2 py-1 bg-surface-high text-on-surface rounded-ds-md min-w-[28px] h-[26px] flex items-center justify-center">
              {incomeItems.length}
            </span>
          </div>
          <div className="py-2">
            {incomeItems.length === 0 ? (
              <div className="p-6 text-center text-outline-variant text-sm">
                Keine Einkünfte vorhanden
              </div>
            ) : (
              incomeItems.map(item => renderItem(item))
            )}
          </div>
        </div>

        {/* Expenses */}
        <div className="bg-surface-lowest rounded-ds-lg shadow-float overflow-hidden">
          <div className="px-4 py-3 bg-surface-high flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-status-error" />
            <h3 className="font-semibold text-on-surface">Ausgaben</h3>
            <span className="ml-auto text-xs font-bold px-2 py-1 bg-surface-high text-on-surface rounded-ds-md min-w-[28px] h-[26px] flex items-center justify-center">
              {expenseItems.length}
            </span>
          </div>
          <div className="py-2">
            {expenseItems.length === 0 ? (
              <div className="p-6 text-center text-outline-variant text-sm">
                Keine Ausgaben vorhanden
              </div>
            ) : (
              expenseItems.map(item => renderItem(item))
            )}
          </div>
        </div>

        {/* Hypothetical additions */}
        {additions.length > 0 && (
          <div className="bg-surface-lowest rounded-ds-lg shadow-float overflow-hidden">
            <div className="px-4 py-3 bg-primary/10 flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <h3 className="font-semibold text-on-surface">Hypothetische Einträge</h3>
              <span className="ml-auto text-xs font-bold px-2 py-1 bg-primary/20 text-primary rounded-ds-md min-w-[28px] h-[26px] flex items-center justify-center">
                {additions.length}
              </span>
            </div>
            <div className="py-2">{additions.map(item => renderItem(item, true))}</div>
          </div>
        )}
      </div>

      {/* Add hypothetical item */}
      {!showAddForm ? (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-outline-variant/40 rounded-ds-lg text-on-surface-variant hover:border-primary hover:text-primary transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">Hypothetischen Eintrag hinzufügen</span>
        </button>
      ) : (
        <div className="bg-surface-lowest rounded-ds-lg shadow-float p-5 space-y-4">
          <h3 className="font-semibold text-on-surface">Neuer hypothetischer Eintrag</h3>
          <input
            type="text"
            placeholder="Bezeichnung (z.B. Gehaltserhöhung, neues Abo)"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            className="w-full bg-surface-mid border border-outline-variant/30 rounded-ds-md px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              placeholder="Betrag (€)"
              value={newAmount}
              onChange={e => setNewAmount(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddItem()}
              className="bg-surface-mid border border-outline-variant/30 rounded-ds-md px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setNewType('expense')}
                className={`flex-1 py-2 rounded-ds-md text-xs font-bold transition-colors ${
                  newType === 'expense'
                    ? 'bg-status-error text-white'
                    : 'bg-surface-mid text-on-surface-variant'
                }`}
              >
                Ausgabe
              </button>
              <button
                onClick={() => setNewType('income')}
                className={`flex-1 py-2 rounded-ds-md text-xs font-bold transition-colors ${
                  newType === 'income'
                    ? 'bg-status-success text-white'
                    : 'bg-surface-mid text-on-surface-variant'
                }`}
              >
                Einnahme
              </button>
            </div>
          </div>
          {newType === 'expense' && (
            <button
              onClick={() => setNewIsFlexible(!newIsFlexible)}
              className={`text-xs px-3 py-1.5 rounded-ds-md font-medium transition-colors ${
                newIsFlexible
                  ? 'bg-status-warning/20 text-status-warning'
                  : 'bg-surface-mid text-on-surface-variant'
              }`}
            >
              {newIsFlexible ? 'Variable Ausgabe' : 'Fixkosten'}
            </button>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleAddItem}
              disabled={!newTitle.trim() || !newAmount}
              className="flex-1 bg-primary text-on-primary py-2.5 rounded-ds-md text-sm font-bold hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Hinzufügen
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewTitle('');
                setNewAmount('');
                setNewType('expense');
                setNewIsFlexible(false);
              }}
              className="px-4 bg-surface-mid text-on-surface-variant py-2.5 rounded-ds-md text-sm hover:bg-surface-high transition-colors"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
