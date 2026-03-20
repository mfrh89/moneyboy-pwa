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
      <div className="bg-surface-high rounded-ds-md p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-on-surface-variant flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-on-surface mb-1">
              Benachrichtigungen nicht verfügbar
            </h4>
            <p className="text-xs text-on-surface-variant">
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
        <h3 className="text-[1.25rem] font-semibold text-on-surface mb-3">Browser-Benachrichtigungen</h3>
        <p className="text-sm text-on-surface-variant mb-4">
          Erhalte Erinnerungen beim Öffnen der App, wenn Abos in den nächsten 2 Tagen ablaufen.
        </p>
      </div>

      {/* Status Card */}
      <div className={`rounded-ds-md p-4 ${
        permissionStatus === 'granted'
          ? 'bg-surface-low'
          : permissionStatus === 'denied'
          ? 'bg-surface-high'
          : 'bg-surface-low'
      }`}>
        <div className="flex items-center gap-3 mb-3">
          {permissionStatus === 'granted' ? (
            <>
              <CheckCircle className="w-5 h-5 text-status-success" />
              <div>
                <h4 className="text-sm font-bold text-status-success">Aktiviert</h4>
                <p className="text-xs text-on-surface-variant">
                  Du erhältst Browser-Benachrichtigungen
                </p>
              </div>
            </>
          ) : permissionStatus === 'denied' ? (
            <>
              <BellOff className="w-5 h-5 text-on-surface-variant" />
              <div>
                <h4 className="text-sm font-bold text-on-surface">Blockiert</h4>
                <p className="text-xs text-on-surface-variant">
                  Benachrichtigungen wurden in den Browser-Einstellungen blockiert
                </p>
              </div>
            </>
          ) : (
            <>
              <Bell className="w-5 h-5 text-on-surface" />
              <div>
                <h4 className="text-sm font-bold text-on-surface">Deaktiviert</h4>
                <p className="text-xs text-on-surface-variant">
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
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary-container text-on-primary rounded-ds-md font-bold text-sm transition-colors"
            >
              <Bell className="w-4 h-4" />
              <span>Aktivieren</span>
            </button>
          )}

          {permissionStatus === 'granted' && (
            <button
              onClick={handleTestNotification}
              className="flex items-center gap-2 px-4 py-2 bg-surface-high hover:bg-surface-highest text-on-surface rounded-ds-md font-bold text-sm transition-colors"
            >
              <Bell className="w-4 h-4" />
              <span>Test senden</span>
            </button>
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-surface-low rounded-ds-md p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-status-info flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-on-surface mb-1">
              So funktioniert's
            </h4>
            <ul className="text-xs text-on-surface-variant space-y-1">
              <li>Benachrichtigungen erscheinen beim Öffnen der App</li>
              <li>Maximale eine Benachrichtigung pro Tag</li>
              <li>Funktioniert auch wenn App im Hintergrund ist (Browser offen)</li>
              <li>Komplett kostenlos, kein Server nötig</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};