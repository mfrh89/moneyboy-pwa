import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Trash2, Loader2, CreditCard, Users, ChevronDown, Check, Repeat } from 'lucide-react';
import { FinanceItem, TransactionType, SubscriptionCycle } from '../types';

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: FinanceItem) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  initialItem?: FinanceItem | null;
  defaultType: TransactionType;
  defaultIsFlexible?: boolean;
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
        setIsSubscription(false);
        setSubscriptionNextBilling('');
        setSubscriptionCancellationDeadline('');
        setSubscriptionCycle('monthly');
      }
      setIsSubmitting(false);
      setShowSuggestions(false);
    }
  }, [isOpen, initialItem, defaultType, defaultIsFlexible]);

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
        // Default category if empty
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#11111b]/60 backdrop-blur-sm">
      <div className="bg-[#1e1e2e] rounded-2xl w-full max-w-md shadow-2xl overflow-visible animate-in fade-in zoom-in duration-200 border border-[#313244]">
        <div className="flex justify-between items-center p-4 border-b border-[#313244] bg-[#181825] rounded-t-2xl">
          <h2 className="text-lg font-bold text-[#cdd6f4]">
            {initialItem ? 'Eintrag bearbeiten' : 'Neuer Eintrag'}
          </h2>
          <button 
            onClick={onClose} 
            disabled={isSubmitting}
            className="p-2 hover:bg-[#313244] rounded-full transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-[#a6adc8]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Toggle Type */}
          <div className="flex bg-[#11111b] p-1 rounded-lg">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => { setType('income'); setIsFlexible(false); setIsSplit(false); }}
              className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${
                type === 'income' ? 'bg-[#a6e3a1] text-[#1e1e2e] shadow-sm' : 'text-[#6c7086] hover:text-[#a6adc8]'
              }`}
            >
              Einkommen
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setType('expense')}
              className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${
                type === 'expense' ? 'bg-[#f38ba8] text-[#1e1e2e] shadow-sm' : 'text-[#6c7086] hover:text-[#a6adc8]'
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
                    className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                        isFlexible 
                        ? 'bg-[#fab387]/10 border-[#fab387]/50' 
                        : 'bg-[#313244]/50 border-transparent hover:bg-[#313244]'
                    }`}
                >
                    <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                        isFlexible ? 'bg-[#fab387] border-[#fab387]' : 'border-[#6c7086]'
                    }`}>
                        {isFlexible && <CreditCard className="w-2.5 h-2.5 text-[#1e1e2e]" />}
                    </div>
                    <span className={`text-xs font-bold ${isFlexible ? 'text-[#fab387]' : 'text-[#cdd6f4]'}`}>
                        Variabel
                    </span>
                </div>

                {/* Split Toggle */}
                <div 
                    onClick={() => !isSubmitting && setIsSplit(!isSplit)}
                    className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                        isSplit 
                        ? 'bg-[#89b4fa]/10 border-[#89b4fa]/50' 
                        : 'bg-[#313244]/50 border-transparent hover:bg-[#313244]'
                    }`}
                >
                    <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                        isSplit ? 'bg-[#89b4fa] border-[#89b4fa]' : 'border-[#6c7086]'
                    }`}>
                        {isSplit && <Users className="w-2.5 h-2.5 text-[#1e1e2e]" />}
                    </div>
                    <span className={`text-xs font-bold ${isSplit ? 'text-[#89b4fa]' : 'text-[#cdd6f4]'}`}>
                        Geteilt
                    </span>
                </div>

                {/* Subscription Toggle */}
                <div 
                    onClick={() => !isSubmitting && setIsSubscription(!isSubscription)}
                    className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                        isSubscription 
                        ? 'bg-[#cba6f7]/10 border-[#cba6f7]/50' 
                        : 'bg-[#313244]/50 border-transparent hover:bg-[#313244]'
                    }`}
                >
                    <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                        isSubscription ? 'bg-[#cba6f7] border-[#cba6f7]' : 'border-[#6c7086]'
                    }`}>
                        {isSubscription && <Repeat className="w-2.5 h-2.5 text-[#1e1e2e]" />}
                    </div>
                    <span className={`text-xs font-bold ${isSubscription ? 'text-[#cba6f7]' : 'text-[#cdd6f4]'}`}>
                        Abo
                    </span>
                </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-[#a6adc8] mb-1">Bezeichnung</label>
            <input
              type="text"
              required
              disabled={isSubmitting}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-[#313244] border border-[#45475a] text-[#cdd6f4] placeholder-[#6c7086] focus:ring-2 focus:ring-[#cba6f7] focus:border-[#cba6f7] outline-none transition-shadow disabled:bg-[#181825]"
              placeholder={type === 'income' ? 'z.B. Gehalt' : 'z.B. Miete, Netflix'}
            />
          </div>

          {/* Amount Section */}
          {type === 'expense' && isSplit ? (
            <div className="space-y-4">
               <div>
                  <label className="block text-sm font-bold text-[#a6adc8] mb-1">Gesamtbetrag (€)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    disabled={isSubmitting}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-[#313244] border border-[#45475a] text-[#cdd6f4] placeholder-[#6c7086] focus:ring-2 focus:ring-[#89b4fa] focus:border-[#89b4fa] outline-none transition-shadow disabled:bg-[#181825]"
                    placeholder="Gesamtkosten"
                  />
               </div>
               <div className="p-3 rounded-lg bg-[#89b4fa]/10 border border-[#89b4fa]/20 flex justify-between items-center animate-in slide-in-from-top-2 duration-200">
                   <div className="flex items-center gap-2">
                       <Users className="w-4 h-4 text-[#89b4fa]" />
                       <span className="text-xs font-bold text-[#89b4fa] uppercase tracking-wide">Dein Anteil (50%)</span>
                   </div>
                   <span className="font-mono text-lg font-bold text-[#89b4fa]">
                       {inputValue ? (parseFloat(inputValue) / 2).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }) : '0,00 €'}
                   </span>
               </div>
            </div>
          ) : (
            <div>
                <label className="block text-sm font-bold text-[#a6adc8] mb-1">Monatlicher Betrag (€)</label>
                <input
                type="number"
                required
                min="0"
                step="0.01"
                disabled={isSubmitting}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-[#313244] border border-[#45475a] text-[#cdd6f4] placeholder-[#6c7086] focus:ring-2 focus:ring-[#cba6f7] focus:border-[#cba6f7] outline-none transition-shadow disabled:bg-[#181825]"
                placeholder="0.00"
                />
            </div>
          )}

          <div className="relative">
            <label className="block text-sm font-bold text-[#a6adc8] mb-1">Kategorie</label>
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
                    className="w-full px-4 py-2 rounded-lg bg-[#313244] border border-[#45475a] text-[#cdd6f4] focus:ring-2 focus:ring-[#cba6f7] focus:border-[#cba6f7] outline-none transition-shadow disabled:bg-[#181825] placeholder-[#6c7086]"
                    placeholder="Wähle oder erstelle..."
                    autoComplete="off"
                />
                <div 
                    className="absolute inset-y-0 right-0 flex items-center px-4 text-[#a6adc8] cursor-pointer"
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
                    className="absolute z-50 left-0 right-0 mt-1 bg-[#1e1e2e] border border-[#45475a] rounded-lg shadow-xl max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-[#45475a]"
                >
                    {filteredCategories.length > 0 ? (
                        filteredCategories.map((cat) => (
                            <div 
                                key={cat}
                                onClick={() => {
                                    setCategory(cat);
                                    setShowSuggestions(false);
                                }}
                                className="px-4 py-2 hover:bg-[#313244] cursor-pointer text-sm text-[#cdd6f4] flex items-center justify-between group"
                            >
                                <span>{cat}</span>
                                {category === cat && <Check className="w-3 h-3 text-[#a6e3a1]" />}
                            </div>
                        ))
                    ) : (
                        <div className="px-4 py-3 text-sm text-[#a6adc8] italic">
                            "{category}" wird als neue Kategorie angelegt
                        </div>
                    )}
                </div>
            )}
          </div>

          {/* Subscription Details */}
          {type === 'expense' && isSubscription && (
            <div className="space-y-4 p-4 rounded-lg bg-[#cba6f7]/5 border border-[#cba6f7]/20 animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-2 mb-2">
                <Repeat className="w-4 h-4 text-[#cba6f7]" />
                <span className="text-xs font-bold text-[#cba6f7] uppercase tracking-wide">Abo-Details</span>
              </div>

              {/* Billing Cycle */}
              <div>
                <label className="block text-sm font-bold text-[#a6adc8] mb-1">Abrechnungszyklus</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['monthly', 'quarterly', 'yearly'] as SubscriptionCycle[]).map((cycle) => (
                    <button
                      key={cycle}
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => setSubscriptionCycle(cycle)}
                      className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                        subscriptionCycle === cycle
                          ? 'bg-[#cba6f7] text-[#1e1e2e]'
                          : 'bg-[#313244] text-[#a6adc8] hover:bg-[#45475a]'
                      }`}
                    >
                      {cycle === 'monthly' ? 'Monatlich' : cycle === 'quarterly' ? 'Quartalsweise' : 'Jährlich'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Next Billing Date */}
              <div>
                <label className="block text-sm font-bold text-[#a6adc8] mb-1">Nächste Abbuchung</label>
                <input
                  type="date"
                  disabled={isSubmitting}
                  value={subscriptionNextBilling}
                  onChange={(e) => setSubscriptionNextBilling(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-[#313244] border border-[#45475a] text-[#cdd6f4] focus:ring-2 focus:ring-[#cba6f7] focus:border-[#cba6f7] outline-none transition-shadow disabled:bg-[#181825]"
                />
              </div>

              {/* Cancellation Deadline */}
              <div>
                <label className="block text-sm font-bold text-[#a6adc8] mb-1">Kündigungsfrist (optional)</label>
                <input
                  type="date"
                  disabled={isSubmitting}
                  value={subscriptionCancellationDeadline}
                  onChange={(e) => setSubscriptionCancellationDeadline(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-[#313244] border border-[#45475a] text-[#cdd6f4] focus:ring-2 focus:ring-[#cba6f7] focus:border-[#cba6f7] outline-none transition-shadow disabled:bg-[#181825]"
                />
              </div>
            </div>
          )}

          <div className="pt-4 flex gap-3">
            {initialItem && (
               <button
               type="button"
               disabled={isSubmitting}
               onClick={handleDeleteClick}
               className="px-4 py-2 text-[#f38ba8] bg-[#f38ba8]/10 hover:bg-[#f38ba8]/20 rounded-lg font-bold text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
             >
               {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
               <span>Löschen</span>
             </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#cba6f7] hover:bg-[#cba6f7]/90 text-[#1e1e2e] rounded-lg font-bold transition-colors shadow-lg shadow-[#cba6f7]/20 disabled:opacity-70 disabled:cursor-not-allowed"
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
  );
};
