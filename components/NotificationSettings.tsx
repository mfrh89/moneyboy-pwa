import React, { useState, useEffect } from 'react';
import { Bell, BellOff, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import {
  isNotificationSupported,
  getNotificationPermissionStatus,
  requestNotificationPermission
} from '../services/notifications';

interface NotificationSettingsProps {
  userId: string | null;
  isFirebaseActive: boolean;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  userId,
  isFirebaseActive
}) => {
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const [isRequesting, setIsRequesting] = useState(false);
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  useEffect(() => {
    if (isNotificationSupported()) {
      setPermissionStatus(getNotificationPermissionStatus());
    }
  }, []);

  const handleRequestPermission = async () => {
    if (!userId || !isFirebaseActive) {
      alert('Bitte verbinde dich zuerst mit Firebase, um Push-Benachrichtigungen zu nutzen.');
      return;
    }

    setIsRequesting(true);
    try {
      const token = await requestNotificationPermission(userId);
      if (token) {
        setFcmToken(token);
        setPermissionStatus('granted');
        alert('Push-Benachrichtigungen aktiviert! Du wirst nun über bald ablaufende Abos benachrichtigt.');
      } else {
        setPermissionStatus(Notification.permission);
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      alert('Fehler beim Aktivieren der Benachrichtigungen.');
    } finally {
      setIsRequesting(false);
    }
  };

  const handleTestNotification = () => {
    if (permissionStatus === 'granted') {
      new Notification('[Test] 💳 Abo-Verlängerung', {
        body: 'Beispiel-Abo verlängert sich in 2 Tagen',
        icon: '/icon-192.png',
        badge: '/icon-192.png'
      });
    }
  };

  if (!isNotificationSupported()) {
    return (
      <div className="bg-surface-high rounded-ds-md p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-on-surface-variant flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-on-surface mb-1">
              Benachrichtigungen nicht verfügbar
            </h4>
            <p className="text-xs text-on-surface-variant">
              Dein Browser unterstützt keine Push-Benachrichtigungen.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-[1.25rem] font-semibold text-on-surface mb-3">Push-Benachrichtigungen</h3>
        <p className="text-sm text-on-surface-variant mb-4">
          Erhalte Erinnerungen 2 Tage vor Abo-Verlängerungen und Kündigungsfristen.
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
                  Du erhältst Push-Benachrichtigungen
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
              disabled={isRequesting || !isFirebaseActive}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary-container text-on-primary rounded-ds-md font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRequesting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Aktivieren...</span>
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4" />
                  <span>Aktivieren</span>
                </>
              )}
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

      {/* Notification Timing Info */}
      <div className="bg-surface-low rounded-ds-md p-4">
        <p className="text-xs text-on-surface-variant">
          Benachrichtigungen werden 2 Tage vor dem Datum gesendet, das im Feld <span className="font-bold text-on-surface">Wird verlängert am</span> gespeichert ist.
        </p>
      </div>

      {/* Info Box */}
      {!isFirebaseActive && (
        <div className="bg-surface-high rounded-ds-md p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-status-info flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-on-surface mb-1">
                Firebase erforderlich
              </h4>
              <p className="text-xs text-on-surface-variant">
                Push-Benachrichtigungen benötigen eine aktive Firebase-Verbindung.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* iOS Warning */}
      {/iPhone|iPad|iPod/.test(navigator.userAgent) && (
        <div className="bg-surface-low rounded-ds-md p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-status-info flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-on-surface mb-1">
                iOS-Hinweis
              </h4>
              <p className="text-xs text-on-surface-variant">
                Füge Moneyboy zum Home-Bildschirm hinzu, damit Push-Benachrichtigungen zuverlässig funktionieren.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};