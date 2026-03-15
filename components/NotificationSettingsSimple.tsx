import React, { useState, useEffect } from 'react';
import { Bell, BellOff, CheckCircle, AlertCircle } from 'lucide-react';
import { requestNotificationPermission } from '../services/subscriptionChecker';

export const NotificationSettingsSimple: React.FC = () => {
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    setPermissionStatus(Notification.permission);
    
    if (granted) {
      alert('Browser-Benachrichtigungen aktiviert! Du wirst beim Öffnen der App über bald ablaufende Abos benachrichtigt (max. 1x täglich).');
    }
  };

  const handleTestNotification = () => {
    if (permissionStatus === 'granted') {
      new Notification('Moneyboy Test', {
        body: 'Browser-Benachrichtigungen funktionieren!',
        icon: '/icon-192.png'
      });
    }
  };

  if (!('Notification' in window)) {
    return (
      <div className="bg-[#f38ba8]/10 border border-[#f38ba8]/30 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-[#f38ba8] flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-[#f38ba8] mb-1">
              Benachrichtigungen nicht verfügbar
            </h4>
            <p className="text-xs text-[#f38ba8]/80">
              Dein Browser unterstützt keine Benachrichtigungen.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-[#cdd6f4] mb-3">Browser-Benachrichtigungen</h3>
        <p className="text-sm text-[#a6adc8] mb-4">
          Erhalte Erinnerungen beim Öffnen der App, wenn Abos in den nächsten 2 Tagen ablaufen.
        </p>
      </div>

      {/* Status Card */}
      <div className={`rounded-xl p-4 border ${
        permissionStatus === 'granted' 
          ? 'bg-[#a6e3a1]/10 border-[#a6e3a1]/30'
          : permissionStatus === 'denied'
          ? 'bg-[#f38ba8]/10 border-[#f38ba8]/30'
          : 'bg-[#313244]/50 border-[#313244]'
      }`}>
        <div className="flex items-center gap-3 mb-3">
          {permissionStatus === 'granted' ? (
            <>
              <CheckCircle className="w-5 h-5 text-[#a6e3a1]" />
              <div>
                <h4 className="text-sm font-bold text-[#a6e3a1]">Aktiviert</h4>
                <p className="text-xs text-[#a6e3a1]/80">
                  Du erhältst Browser-Benachrichtigungen
                </p>
              </div>
            </>
          ) : permissionStatus === 'denied' ? (
            <>
              <BellOff className="w-5 h-5 text-[#f38ba8]" />
              <div>
                <h4 className="text-sm font-bold text-[#f38ba8]">Blockiert</h4>
                <p className="text-xs text-[#f38ba8]/80">
                  Benachrichtigungen wurden in den Browser-Einstellungen blockiert
                </p>
              </div>
            </>
          ) : (
            <>
              <Bell className="w-5 h-5 text-[#cdd6f4]" />
              <div>
                <h4 className="text-sm font-bold text-[#cdd6f4]">Deaktiviert</h4>
                <p className="text-xs text-[#a6adc8]">
                  Aktiviere Benachrichtigungen, um Erinnerungen zu erhalten
                </p>
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {permissionStatus !== 'granted' && permissionStatus !== 'denied' && (
            <button
              onClick={handleRequestPermission}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#cba6f7] hover:bg-[#cba6f7]/90 text-[#1e1e2e] rounded-lg font-bold text-sm transition-colors"
            >
              <Bell className="w-4 h-4" />
              <span>Aktivieren</span>
            </button>
          )}
          
          {permissionStatus === 'granted' && (
            <button
              onClick={handleTestNotification}
              className="flex items-center gap-2 px-4 py-2 bg-[#313244] hover:bg-[#45475a] text-[#cdd6f4] rounded-lg font-bold text-sm transition-colors"
            >
              <Bell className="w-4 h-4" />
              <span>Test senden</span>
            </button>
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-[#89b4fa]/10 border border-[#89b4fa]/30 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-[#89b4fa] flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-[#89b4fa] mb-1">
              So funktioniert's
            </h4>
            <ul className="text-xs text-[#89b4fa]/80 space-y-1">
              <li>• Benachrichtigungen erscheinen beim Öffnen der App</li>
              <li>• Maximale eine Benachrichtigung pro Tag</li>
              <li>• Funktioniert auch wenn App im Hintergrund ist (Browser offen)</li>
              <li>• Komplett kostenlos, kein Server nötig</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
