
import React, { useState } from 'react';
import { Tag, Edit2, X, Save, Loader2, AlertCircle, Trash2 } from 'lucide-react';

interface CategoryManagerProps {
  categories: string[];
  onRename: (oldName: string, newName: string) => Promise<void>;
  onDelete: (category: string) => Promise<void>;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({ categories, onRename, onDelete }) => {
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const startEdit = (cat: string) => {
    setEditingCategory(cat);
    setNewName(cat);
  };

  const cancelEdit = () => {
    setEditingCategory(null);
    setNewName('');
    setIsSubmitting(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !newName.trim() || newName === editingCategory) {
      cancelEdit();
      return;
    }

    setIsSubmitting(true);
    try {
      await onRename(editingCategory, newName.trim());
      cancelEdit();
    } catch (error) {
      console.error(error);
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = async (e: React.MouseEvent, cat: string) => {
    e.stopPropagation(); // Prevent opening the edit modal
    if (cat === 'Sonstiges') {
        alert('Die Kategorie "Sonstiges" kann nicht gelöscht werden.');
        return;
    }
    
    if (window.confirm(`Kategorie "${cat}" wirklich löschen? Vorhandene Einträge werden in "Sonstiges" verschoben.`)) {
        await onDelete(cat);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-semibold text-[#cdd6f4] mb-3 flex items-center gap-2">
        <Tag className="w-5 h-5 text-[#fab387]" />
        Kategorien verwalten
      </h3>
      
      <div className="bg-[#181825] rounded-xl border border-[#313244] p-4">
        <p className="text-xs text-[#a6adc8] mb-4">
          Tippe auf eine Kategorie, um sie umzubenennen. "X" löscht die Kategorie und verschiebt Einträge nach "Sonstiges".
        </p>

        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <div
              key={cat}
              onClick={() => startEdit(cat)}
              className="group relative pl-3 pr-2 py-1.5 rounded-lg bg-[#313244] hover:bg-[#45475a] border border-[#45475a] hover:border-[#585b70] text-sm text-[#cdd6f4] font-medium transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>{cat}</span>
              
              {/* Separator Line */}
              <div className="w-px h-3 bg-[#6c7086]/30 mx-1"></div>

              {/* Delete Button */}
              <button
                onClick={(e) => handleDeleteClick(e, cat)}
                className={`p-1 rounded-md hover:bg-[#f38ba8]/20 transition-colors ${cat === 'Sonstiges' ? 'opacity-30 cursor-not-allowed' : 'text-[#a6adc8] hover:text-[#f38ba8]'}`}
                title={cat === 'Sonstiges' ? 'Kann nicht gelöscht werden' : 'Löschen'}
              >
                  <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Modal / Overlay */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#11111b]/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#1e1e2e] rounded-2xl w-full max-w-sm shadow-2xl border border-[#313244] p-5">
            <h4 className="text-base font-bold text-[#cdd6f4] mb-1">Kategorie umbenennen</h4>
            <p className="text-xs text-[#a6adc8] mb-4">
              Ändert "{editingCategory}" zu:
            </p>

            <form onSubmit={handleSave} className="space-y-4">
              <input
                autoFocus
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-[#313244] border border-[#45475a] text-[#cdd6f4] focus:ring-2 focus:ring-[#cba6f7] outline-none"
                placeholder="Neuer Name"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={cancelEdit}
                  disabled={isSubmitting}
                  className="flex-1 py-2 text-sm font-bold text-[#a6adc8] hover:text-[#cdd6f4] hover:bg-[#313244] rounded-lg transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2 bg-[#cba6f7] hover:bg-[#cba6f7]/90 text-[#1e1e2e] rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Speichern
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
