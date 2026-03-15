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
      new Notification('Moneyboy Test', {
        body: 'Push-Benachrichtigungen funktionieren!',
        icon: '/icon-192.png',
        badge: '/icon-192.png'
      });
    }
  };

  if (!isNotificationSupported()) {
    return (
      <div className="bg-[#f38ba8]/10 border border-[#f38ba8]/30 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-[#f38ba8] flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-[#f38ba8] mb-1">
              Benachrichtigungen nicht verfügbar
            </h4>
            <p className="text-xs text-[#f38ba8]/80">
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
        <h3 className="text-lg font-semibold text-[#cdd6f4] mb-3">Push-Benachrichtigungen</h3>
        <p className="text-sm text-[#a6adc8] mb-4">
          Erhalte Erinnerungen 2 Tage vor Abo-Verlängerungen und Kündigungsfristen.
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
                  Du erhältst Push-Benachrichtigungen
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
              disabled={isRequesting || !isFirebaseActive}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#cba6f7] hover:bg-[#cba6f7]/90 text-[#1e1e2e] rounded-lg font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
              className="flex items-center gap-2 px-4 py-2 bg-[#313244] hover:bg-[#45475a] text-[#cdd6f4] rounded-lg font-bold text-sm transition-colors"
            >
              <Bell className="w-4 h-4" />
              <span>Test senden</span>
            </button>
          )}
        </div>
      </div>

      {/* Info Box */}
      {!isFirebaseActive && (
        <div className="bg-[#fab387]/10 border border-[#fab387]/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#fab387] flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-[#fab387] mb-1">
                Firebase erforderlich
              </h4>
              <p className="text-xs text-[#fab387]/80">
                Push-Benachrichtigungen benötigen eine aktive Firebase-Verbindung.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* iOS Warning */}
      {/iPhone|iPad|iPod/.test(navigator.userAgent) && (
        <div className="bg-[#89b4fa]/10 border border-[#89b4fa]/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#89b4fa] flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-[#89b4fa] mb-1">
                iOS-Hinweis
              </h4>
              <p className="text-xs text-[#89b4fa]/80">
                Füge Moneyboy zum Home-Bildschirm hinzu, damit Push-Benachrichtigungen zuverlässig funktionieren.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
