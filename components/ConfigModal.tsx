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
      // Allow user to paste just the object part if they copied from JS file
      let cleanJson = jsonConfig;
      if (cleanJson.includes('const firebaseConfig =')) {
        const start = cleanJson.indexOf('{');
        const end = cleanJson.lastIndexOf('}') + 1;
        cleanJson = cleanJson.substring(start, end);
      }
      
      // Fix loose JSON (keys without quotes) if user pastes raw JS object
      // This is a simple regex fix, not perfect but helps for JS objects
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#11111b]/60 backdrop-blur-sm">
      <div className="bg-[#1e1e2e] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-[#313244]">
        <div className="flex justify-between items-center p-4 border-b border-[#313244] bg-[#181825]">
          <div className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-[#cba6f7]" />
            <h2 className="text-lg font-bold text-[#cdd6f4]">Firebase verbinden</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#313244] rounded-full transition-colors">
            <X className="w-5 h-5 text-[#a6adc8]" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-[#181825] p-4 rounded-xl text-sm text-[#cdd6f4] border border-[#cba6f7]/20">
            <p className="font-semibold mb-1 text-[#cba6f7]">So geht's:</p>
            <ol className="list-decimal pl-4 space-y-1 opacity-90 text-[#a6adc8]">
                <li>Erstelle ein Projekt auf <a href="https://console.firebase.google.com" target="_blank" className="underline text-[#89b4fa]">console.firebase.google.com</a></li>
                <li>Aktiviere <strong>Authentication</strong> (Email/Password)</li>
                <li>Aktiviere <strong>Firestore Database</strong></li>
                <li>Gehe zu Projekteinstellungen, erstelle eine Web App und kopiere die <code>firebaseConfig</code> hier rein.</li>
            </ol>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#a6adc8] mb-1">Firebase Config (JSON)</label>
            <textarea
              className="w-full h-40 font-mono text-xs p-3 rounded-lg bg-[#313244] border border-[#45475a] text-[#cdd6f4] focus:ring-2 focus:ring-[#cba6f7] focus:border-[#cba6f7] outline-none"
              placeholder={'{ "apiKey": "...", "authDomain": "...", ... }'}
              value={jsonConfig}
              onChange={(e) => {
                  setJsonConfig(e.target.value);
                  setError('');
              }}
            />
             {error && (
            <div className="mt-2 text-[#f38ba8] text-xs flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {error}
            </div>
          )}
          </div>

          <button
            onClick={handleSave}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#cba6f7] hover:bg-[#cba6f7]/90 text-[#1e1e2e] rounded-xl font-bold transition-colors shadow-lg shadow-[#cba6f7]/20"
          >
            <Save className="w-5 h-5" />
            Verbinden & Neu laden
          </button>
        </div>
      </div>
    </div>
  );
};