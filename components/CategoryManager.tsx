
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
    e.stopPropagation();
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
      <h3 className="text-[1.25rem] font-semibold text-on-surface mb-3 flex items-center gap-2">
        <Tag className="w-5 h-5 text-status-warning" />
        Kategorien verwalten
      </h3>

      <div className="bg-surface-low rounded-ds-md p-4">
        <p className="text-xs text-on-surface-variant mb-4">
          Tippe auf eine Kategorie, um sie umzubenennen. "X" löscht die Kategorie und verschiebt Einträge nach "Sonstiges".
        </p>

        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <div
              key={cat}
              onClick={() => startEdit(cat)}
              className="group relative pl-3 pr-2 py-1.5 rounded-ds-md bg-surface-high hover:bg-surface-highest text-sm text-on-surface font-medium transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>{cat}</span>

              {/* Delete Button */}
              <button
                onClick={(e) => handleDeleteClick(e, cat)}
                className={`p-1 rounded-ds-sm hover:bg-surface-highest transition-colors ${cat === 'Sonstiges' ? 'opacity-30 cursor-not-allowed' : 'text-on-surface-variant hover:text-on-surface'}`}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/10 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface-lowest rounded-ds-lg w-full max-w-sm shadow-float p-5">
            <h4 className="text-[1.25rem] font-semibold text-on-surface mb-1">Kategorie umbenennen</h4>
            <p className="text-xs text-on-surface-variant mb-4">
              Ändert "{editingCategory}" zu:
            </p>

            <form onSubmit={handleSave} className="space-y-4">
              <input
                autoFocus
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-4 py-2 rounded-ds-md bg-surface-low text-on-surface focus:ring-2 focus:ring-primary focus:bg-surface-highest outline-none transition-all"
                placeholder="Neuer Name"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={cancelEdit}
                  disabled={isSubmitting}
                  className="flex-1 py-2 text-sm font-bold text-on-surface-variant hover:text-on-surface hover:bg-surface-mid rounded-ds-md transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2 bg-primary hover:bg-primary-container text-on-primary rounded-ds-md font-bold text-sm transition-colors flex items-center justify-center gap-2"
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
