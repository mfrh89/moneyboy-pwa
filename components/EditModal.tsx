import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, Loader2, CreditCard } from 'lucide-react';
import { FinanceItem, TransactionType } from '../types';

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: FinanceItem) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  initialItem?: FinanceItem | null;
  defaultType: TransactionType;
  defaultIsFlexible?: boolean; // New prop
}

export const EditModal: React.FC<EditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialItem,
  defaultType,
  defaultIsFlexible = false
}) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [type, setType] = useState<TransactionType>(defaultType);
  const [isFlexible, setIsFlexible] = useState(defaultIsFlexible);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialItem) {
        setTitle(initialItem.title);
        setAmount(initialItem.amount.toString());
        setCategory(initialItem.category);
        setType(initialItem.type);
        setIsFlexible(!!initialItem.isFlexible);
      } else {
        setTitle('');
        setAmount('');
        setCategory('');
        setType(defaultType);
        setIsFlexible(defaultIsFlexible);
      }
      setIsSubmitting(false);
    }
  }, [isOpen, initialItem, defaultType, defaultIsFlexible]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
        const newItem: FinanceItem = {
        id: initialItem?.id || Date.now().toString(36) + Math.random().toString(36).substr(2),
        title,
        amount: parseFloat(amount),
        type,
        category: category || 'Sonstiges',
        isFlexible: type === 'expense' ? isFlexible : false,
        createdAt: initialItem?.createdAt || Date.now()
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#11111b]/60 backdrop-blur-sm">
      <div className="bg-[#1e1e2e] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-[#313244]">
        <div className="flex justify-between items-center p-4 border-b border-[#313244] bg-[#181825]">
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
              onClick={() => { setType('income'); setIsFlexible(false); }}
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

          {/* Flexible Cost Toggle (Only for expenses) */}
          {type === 'expense' && (
            <div 
                onClick={() => !isSubmitting && setIsFlexible(!isFlexible)}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    isFlexible 
                    ? 'bg-[#fab387]/10 border-[#fab387]/50' 
                    : 'bg-[#313244]/50 border-transparent hover:bg-[#313244]'
                }`}
            >
                <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                    isFlexible ? 'bg-[#fab387] border-[#fab387]' : 'border-[#6c7086]'
                }`}>
                    {isFlexible && <CreditCard className="w-3 h-3 text-[#1e1e2e]" />}
                </div>
                <div className="flex-1">
                    <span className={`block text-sm font-bold ${isFlexible ? 'text-[#fab387]' : 'text-[#cdd6f4]'}`}>
                        Variable Kosten
                    </span>
                    <span className="text-xs text-[#a6adc8]">
                        z.B. Kreditkarte, Lebensmittel, Tanken
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

          <div>
            <label className="block text-sm font-bold text-[#a6adc8] mb-1">Monatlicher Betrag (€)</label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              disabled={isSubmitting}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-[#313244] border border-[#45475a] text-[#cdd6f4] placeholder-[#6c7086] focus:ring-2 focus:ring-[#cba6f7] focus:border-[#cba6f7] outline-none transition-shadow disabled:bg-[#181825]"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-[#a6adc8] mb-1">Kategorie</label>
            <input
              type="text"
              value={category}
              disabled={isSubmitting}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-[#313244] border border-[#45475a] text-[#cdd6f4] placeholder-[#6c7086] focus:ring-2 focus:ring-[#cba6f7] focus:border-[#cba6f7] outline-none transition-shadow disabled:bg-[#181825]"
              placeholder="z.B. Wohnen, Streaming"
              list="categories"
            />
            <datalist id="categories">
              <option value="Wohnen" />
              <option value="Abonnements" />
              <option value="Lebenshaltung" />
              <option value="Kreditkarte" />
              <option value="Versicherung" />
              <option value="Mobilität" />
              <option value="Sparen" />
              <option value="Gehalt" />
            </datalist>
          </div>

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