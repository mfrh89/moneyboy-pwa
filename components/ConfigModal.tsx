import React, { useState } from 'react';
import { X, Cloud, Save, AlertTriangle } from 'lucide-react';
import { FirebaseConfig } from '../types';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: FirebaseConfig) => void;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({ isOpen, onClose, onSave }) => {
  const [jsonConfig, setJsonConfig] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    try {
      let cleanJson = jsonConfig;
      if (cleanJson.includes('const firebaseConfig =')) {
        const start = cleanJson.indexOf('{');
        const end = cleanJson.lastIndexOf('}') + 1;
        cleanJson = cleanJson.substring(start, end);
      }

      cleanJson = cleanJson.replace(/(['"])?([a-z0-9A-Z_]+)(['"])?:/g, '"$2": ');
      cleanJson = cleanJson.replace(/'/g, '"');

      const config = JSON.parse(cleanJson);

      if (!config.apiKey || !config.projectId) {
        throw new Error('Ungültige Konfiguration. apiKey und projectId fehlen.');
      }

      onSave(config);
      onClose();
    } catch (e) {
      setError('Ungültiges JSON Format. Bitte kopiere das config Objekt aus der Firebase Konsole.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/10 backdrop-blur-sm">
      <div className="bg-surface-lowest rounded-ds-lg w-full max-w-lg shadow-float overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-4 bg-surface-low rounded-t-[16px]">
          <div className="flex items-center gap-2 pl-2">
            <Cloud className="w-5 h-5 text-status-info" />
            <h2 className="text-[1.25rem] font-semibold text-on-surface">Firebase verbinden</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface-high rounded-ds-sm transition-colors">
            <X className="w-5 h-5 text-on-surface-variant" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-surface-high p-4 rounded-ds-md text-sm text-on-surface">
            <p className="font-semibold mb-1 text-status-info">So geht's:</p>
            <ol className="list-decimal pl-4 space-y-1 text-on-surface-variant">
                <li>Erstelle ein Projekt auf <a href="https://console.firebase.google.com" target="_blank" className="underline text-status-info">console.firebase.google.com</a></li>
                <li>Aktiviere <strong>Authentication</strong> (Email/Password)</li>
                <li>Aktiviere <strong>Firestore Database</strong></li>
                <li>Gehe zu Projekteinstellungen, erstelle eine Web App und kopiere die <code className="bg-surface-highest px-1 rounded-ds-xs">firebaseConfig</code> hier rein.</li>
            </ol>
          </div>

          <div>
            <label className="block text-sm font-medium text-on-surface-variant mb-1">Firebase Config (JSON)</label>
            <textarea
              className="w-full h-40 font-mono text-xs p-3 rounded-ds-md bg-surface-mid text-on-surface focus:ring-2 focus:ring-primary focus:bg-surface-highest outline-none transition-all"
              placeholder={'{ "apiKey": "...", "authDomain": "...", ... }'}
              value={jsonConfig}
              onChange={(e) => {
                  setJsonConfig(e.target.value);
                  setError('');
              }}
            />
             {error && (
            <div className="mt-2 text-on-surface-variant text-xs flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {error}
            </div>
          )}
          </div>

          <button
            onClick={handleSave}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary hover:bg-primary-container text-on-primary rounded-ds-md font-bold transition-colors"
          >
            <Save className="w-5 h-5" />
            Verbinden & Neu laden
          </button>
        </div>
      </div>
    </div>
  );
};