import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Trash2, Loader2, CreditCard, Users, ChevronDown, Check, Repeat, Calendar, AlertTriangle } from 'lucide-react';
import { FinanceItem, TransactionType, SubscriptionCycle } from '../types';
import { DatePicker } from './DatePicker';

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: FinanceItem) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  initialItem?: FinanceItem | null;
  defaultType: TransactionType;
  defaultIsFlexible?: boolean;
  defaultIsSubscription?: boolean;
  availableCategories: string[];
}

export const EditModal: React.FC<EditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialItem,
  defaultType,
  defaultIsFlexible = false,
  defaultIsSubscription = false,
  availableCategories
}) => {
  const [title, setTitle] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [category, setCategory] = useState('');
  const [type, setType] = useState<TransactionType>(defaultType);
  const [isFlexible, setIsFlexible] = useState(defaultIsFlexible);
  const [isSplit, setIsSplit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Subscription state
  const [isSubscription, setIsSubscription] = useState(false);
  const [subscriptionNextBilling, setSubscriptionNextBilling] = useState('');
  const [subscriptionCancellationDeadline, setSubscriptionCancellationDeadline] = useState('');
  const [subscriptionCycle, setSubscriptionCycle] = useState<SubscriptionCycle>('monthly');

  // Category AutoSuggest State
  const [showSuggestions, setShowSuggestions] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialItem) {
        setTitle(initialItem.title);
        const val = initialItem.isSplit ? initialItem.amount * 2 : initialItem.amount;
        setInputValue(val.toString());
        setCategory(initialItem.category);
        setType(initialItem.type);
        setIsFlexible(!!initialItem.isFlexible);
        setIsSplit(!!initialItem.isSplit);
        setIsSubscription(!!initialItem.isSubscription);
        setSubscriptionNextBilling(initialItem.subscriptionNextBilling ? new Date(initialItem.subscriptionNextBilling).toISOString().split('T')[0] : '');
        setSubscriptionCancellationDeadline(initialItem.subscriptionCancellationDeadline ? new Date(initialItem.subscriptionCancellationDeadline).toISOString().split('T')[0] : '');
        setSubscriptionCycle(initialItem.subscriptionCycle || 'monthly');
      } else {
        setTitle('');
        setInputValue('');
        setCategory('');
        setType(defaultType);
        setIsFlexible(defaultIsFlexible);
        setIsSplit(false);
        setIsSubscription(defaultIsSubscription);
        setSubscriptionNextBilling('');
        setSubscriptionCancellationDeadline('');
        setSubscriptionCycle('monthly');
      }
      setIsSubmitting(false);
      setShowSuggestions(false);
    }
  }, [isOpen, initialItem, defaultType, defaultIsFlexible, defaultIsSubscription]);

  // Handle outside click to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
            inputRef.current && !inputRef.current.contains(event.target as Node)) {
            setShowSuggestions(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const handleSplitAmount = () => {
    const currentVal = parseFloat(inputValue);
    if (!isNaN(currentVal) && currentVal > 0) {
      setInputValue((currentVal / 2).toFixed(2));
      setIsSplit(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
        let val = parseFloat(inputValue);
        if (isNaN(val)) val = 0;

        const finalAmount = (type === 'expense' && isSplit) ? val / 2 : val;
        const finalCategory = category.trim() || 'Sonstiges';

        const newItem: FinanceItem = {
        id: initialItem?.id || Date.now().toString(36) + Math.random().toString(36).substr(2),
        title,
        amount: finalAmount,
        type,
        category: finalCategory,
        isFlexible: type === 'expense' ? isFlexible : false,
        isSplit: type === 'expense' ? isSplit : false,
        createdAt: initialItem?.createdAt || Date.now(),
        isSubscription: type === 'expense' ? isSubscription : false,
        subscriptionNextBilling: (type === 'expense' && isSubscription && subscriptionNextBilling)
          ? new Date(subscriptionNextBilling).getTime()
          : undefined,
        subscriptionCancellationDeadline: (type === 'expense' && isSubscription && subscriptionCancellationDeadline)
          ? new Date(subscriptionCancellationDeadline).getTime()
          : undefined,
        subscriptionCycle: (type === 'expense' && isSubscription) ? subscriptionCycle : undefined
        };
        await onSave(newItem);
        onClose();
    } catch (error) {
        console.error("Failed to save", error);
        alert("Fehler beim Speichern.");
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDeleteClick = async () => {
      if (!initialItem || isSubmitting) return;

      if (window.confirm('Möchten Sie diesen Eintrag wirklich löschen?')) {
        setIsSubmitting(true);
        try {
            await onDelete(initialItem.id);
            onClose();
        } catch (error) {
            console.error("Failed to delete", error);
            alert("Fehler beim Löschen.");
            setIsSubmitting(false);
        }
      }
  };

  // Filter suggestions
  const filteredCategories = availableCategories.filter(c =>
      c.toLowerCase().includes(category.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-primary/10 backdrop-blur-sm touch-none"
      onTouchMove={(e) => e.preventDefault()}
    >
      <div
        className="flex items-center justify-center p-4 overflow-y-auto h-full overscroll-contain touch-pan-y"
        onTouchMove={(e) => e.stopPropagation()}
      >
      <div className="bg-surface-lowest rounded-ds-xl w-full max-w-md shadow-float animate-in fade-in zoom-in duration-200 my-8">
        <div className="flex justify-between items-center p-4 bg-surface-low rounded-t-[24px] sticky top-0 z-10">
          <h2 className="text-[1.25rem] font-semibold text-on-surface pl-2">
            {initialItem ? 'Eintrag bearbeiten' : 'Neuer Eintrag'}
          </h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 hover:bg-surface-high rounded-ds-sm transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-on-surface-variant" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          {/* Toggle Type */}
          <div className="flex bg-surface-mid p-1 rounded-ds-md">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => { setType('income'); setIsFlexible(false); setIsSplit(false); }}
              className={`flex-1 py-2 text-sm font-bold rounded-ds-md transition-all ${
                type === 'income' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Einkommen
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setType('expense')}
              className={`flex-1 py-2 text-sm font-bold rounded-ds-md transition-all ${
                type === 'expense' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Ausgabe
            </button>
          </div>

          {/* Options for Expenses */}
          {type === 'expense' && (
            <div className="grid grid-cols-3 gap-3">
                {/* Flexible Toggle */}
                <div
                    onClick={() => !isSubmitting && setIsFlexible(!isFlexible)}
                    className={`flex items-center gap-2 p-2 rounded-ds-md cursor-pointer transition-all ${
                        isFlexible
                        ? 'bg-surface-highest'
                        : 'bg-surface-low hover:bg-surface-mid'
                    }`}
                >
                    <div className={`w-4 h-4 rounded-ds-xs flex items-center justify-center transition-colors ${
                        isFlexible ? 'bg-primary' : 'bg-surface-high'
                    }`}>
                        {isFlexible && <CreditCard className="w-2.5 h-2.5 text-on-primary" />}
                    </div>
                    <span className={`text-xs font-bold ${isFlexible ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                        Variabel
                    </span>
                </div>

                {/* Split Toggle */}
                <div
                    onClick={() => !isSubmitting && setIsSplit(!isSplit)}
                    className={`flex items-center gap-2 p-2 rounded-ds-md cursor-pointer transition-all ${
                        isSplit
                        ? 'bg-surface-highest'
                        : 'bg-surface-low hover:bg-surface-mid'
                    }`}
                >
                    <div className={`w-4 h-4 rounded-ds-xs flex items-center justify-center transition-colors ${
                        isSplit ? 'bg-status-info' : 'bg-surface-high'
                    }`}>
                        {isSplit && <Users className="w-2.5 h-2.5 text-on-primary" />}
                    </div>
                    <span className={`text-xs font-bold ${isSplit ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                        Geteilt
                    </span>
                </div>

                {/* Subscription Toggle */}
                <div
                    onClick={() => !isSubmitting && setIsSubscription(!isSubscription)}
                    className={`flex items-center gap-2 p-2 rounded-ds-md cursor-pointer transition-all ${
                        isSubscription
                        ? 'bg-surface-highest'
                        : 'bg-surface-low hover:bg-surface-mid'
                    }`}
                >
                    <div className={`w-4 h-4 rounded-ds-xs flex items-center justify-center transition-colors ${
                        isSubscription ? 'bg-status-info' : 'bg-surface-high'
                    }`}>
                        {isSubscription && <Repeat className="w-2.5 h-2.5 text-on-primary" />}
                    </div>
                    <span className={`text-xs font-bold ${isSubscription ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                        Abo
                    </span>
                </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-on-surface-variant mb-1">Bezeichnung</label>
            <input
              type="text"
              required
              disabled={isSubmitting}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 rounded-ds-md bg-surface-low text-on-surface placeholder-outline-variant focus:ring-2 focus:ring-primary focus:bg-surface-highest outline-none transition-all disabled:bg-surface-mid disabled:opacity-50"
              placeholder={type === 'income' ? 'z.B. Gehalt' : 'z.B. Miete, Netflix'}
            />
          </div>

          {/* Amount Section */}
          {type === 'expense' && isSplit ? (
            <div className="space-y-4">
               <div>
                  <label className="block text-sm font-bold text-on-surface-variant mb-1">Gesamtbetrag (EUR)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    disabled={isSubmitting}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="w-full px-4 py-2 rounded-ds-md bg-surface-low text-on-surface placeholder-outline-variant focus:ring-2 focus:ring-secondary focus:bg-surface-highest outline-none transition-all disabled:bg-surface-mid disabled:opacity-50"
                    placeholder="Gesamtkosten"
                  />
               </div>
               <div className="p-3 rounded-ds-md bg-surface-high flex justify-between items-center animate-in slide-in-from-top-2 duration-200">
                   <div className="flex items-center gap-2">
                       <Users className="w-4 h-4 text-status-info" />
                       <span className="text-[0.6875rem] font-medium text-status-info uppercase tracking-[0.08em]">DEIN ANTEIL (50%)</span>
                   </div>
                   <span className="font-mono text-lg font-bold text-status-info">
                       {inputValue ? (parseFloat(inputValue) / 2).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }) : '0,00 EUR'}
                   </span>
               </div>
            </div>
          ) : (
            <div>
                <label className="block text-sm font-bold text-on-surface-variant mb-1">Monatlicher Betrag (EUR)</label>
                <input
                type="number"
                required
                min="0"
                step="0.01"
                disabled={isSubmitting}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-full px-4 py-2 rounded-ds-md bg-surface-low text-on-surface placeholder-outline-variant focus:ring-2 focus:ring-primary focus:bg-surface-highest outline-none transition-all disabled:bg-surface-mid disabled:opacity-50"
                placeholder="0.00"
                />
            </div>
          )}

          <div className="relative">
            <label className="block text-sm font-bold text-on-surface-variant mb-1">Kategorie</label>
            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    required
                    disabled={isSubmitting}
                    value={category}
                    onChange={(e) => {
                        setCategory(e.target.value);
                        setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    className="w-full px-4 py-2 rounded-ds-md bg-surface-low text-on-surface focus:ring-2 focus:ring-primary focus:bg-surface-highest outline-none transition-all disabled:bg-surface-mid disabled:opacity-50 placeholder-outline-variant"
                    placeholder="Wähle oder erstelle..."
                    autoComplete="off"
                />
                <div
                    className="absolute inset-y-0 right-0 flex items-center px-4 text-on-surface-variant cursor-pointer"
                    onClick={() => {
                        if (inputRef.current) inputRef.current.focus();
                        setShowSuggestions(!showSuggestions);
                    }}
                >
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showSuggestions ? 'rotate-180' : ''}`} />
                </div>
            </div>

            {/* Custom Dropdown */}
            {showSuggestions && (
                <div
                    ref={dropdownRef}
                    className="absolute z-50 left-0 right-0 mt-2 glass rounded-ds-md shadow-float max-h-48 overflow-y-auto"
                >
                    {filteredCategories.length > 0 ? (
                        filteredCategories.map((cat) => (
                            <div
                                key={cat}
                                onClick={() => {
                                    setCategory(cat);
                                    setShowSuggestions(false);
                                }}
                                className="px-4 py-2 hover:bg-surface-high cursor-pointer text-sm text-on-surface flex items-center justify-between group first:rounded-t-ds-md last:rounded-b-ds-md"
                            >
                                <span>{cat}</span>
                                {category === cat && <Check className="w-3 h-3 text-status-info" />}
                            </div>
                        ))
                    ) : (
                        <div className="px-4 py-3 text-sm text-on-surface-variant">
                            "{category}" wird als neue Kategorie angelegt
                        </div>
                    )}
                </div>
            )}
          </div>

          {/* Subscription Details */}
          {type === 'expense' && isSubscription && (
            <div className="space-y-4 p-4 rounded-ds-md bg-surface-low animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-2 mb-2">
                <Repeat className="w-4 h-4 text-status-info" />
                <span className="text-[0.6875rem] font-medium text-status-info uppercase tracking-[0.08em]">ABO-DETAILS</span>
              </div>

              {/* Billing Cycle */}
              <div>
                <label className="block text-sm font-bold text-on-surface-variant mb-1">Abrechnungszyklus</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['monthly', 'quarterly', 'yearly'] as SubscriptionCycle[]).map((cycle) => (
                    <button
                      key={cycle}
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => setSubscriptionCycle(cycle)}
                      className={`py-2 px-3 rounded-ds-md text-xs font-bold transition-all ${
                        subscriptionCycle === cycle
                          ? 'bg-primary text-on-primary'
                          : 'bg-surface-mid text-on-surface-variant hover:bg-surface-high'
                      }`}
                    >
                      {cycle === 'monthly' ? 'Monatlich' : cycle === 'quarterly' ? 'Quartalsweise' : 'Jährlich'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Next Billing Date */}
              <DatePicker
                label="Nächste Abbuchung"
                value={subscriptionNextBilling}
                onChange={setSubscriptionNextBilling}
                disabled={isSubmitting}
                placeholder="Datum wählen"
              />

              {/* Cancellation Deadline */}
              <DatePicker
                label="Kündigungsfrist (optional)"
                value={subscriptionCancellationDeadline}
                onChange={setSubscriptionCancellationDeadline}
                disabled={isSubmitting}
                placeholder="Datum wählen"
              />
            </div>
          )}

          <div className="pt-4 flex gap-3">
            {initialItem && (
               <button
               type="button"
               disabled={isSubmitting}
               onClick={handleDeleteClick}
               className="px-4 py-2 text-on-surface-variant bg-surface-high hover:bg-surface-highest rounded-ds-md font-bold text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
             >
               {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
               <span>Löschen</span>
             </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary-container text-on-primary rounded-ds-md font-bold transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Speichern...</span>
                  </>
              ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Speichern</span>
                  </>
              )}
            </button>
          </div>
        </form>
      </div>
      </div>
    </div>
  );
};