import { FinanceItem } from '../types';

interface UpcomingSubscription {
  item: FinanceItem;
  daysUntil: number;
  type: 'billing' | 'cancellation';
  date: number;
}

/**
 * Checks for subscriptions expiring within the next X days
 */
export const checkUpcomingSubscriptions = (
  items: FinanceItem[],
  daysAhead: number = 2
): UpcomingSubscription[] => {
  const now = Date.now();
  const deadline = now + (daysAhead * 24 * 60 * 60 * 1000);
  
  const upcoming: UpcomingSubscription[] = [];
  
  items.forEach(item => {
    if (!item.isSubscription) return;
    
    // Check next billing
    if (item.subscriptionNextBilling) {
      const billingDate = item.subscriptionNextBilling;
      if (billingDate >= now && billingDate <= deadline) {
        const daysUntil = Math.ceil((billingDate - now) / (24 * 60 * 60 * 1000));
        upcoming.push({
          item,
          daysUntil,
          type: 'billing',
          date: billingDate
        });
      }
    }
    
    // Check cancellation deadline
    if (item.subscriptionCancellationDeadline) {
      const cancelDate = item.subscriptionCancellationDeadline;
      if (cancelDate >= now && cancelDate <= deadline) {
        const daysUntil = Math.ceil((cancelDate - now) / (24 * 60 * 60 * 1000));
        upcoming.push({
          item,
          daysUntil,
          type: 'cancellation',
          date: cancelDate
        });
      }
    }
  });
  
  // Sort by date (most urgent first)
  return upcoming.sort((a, b) => a.date - b.date);
};

/**
 * Shows browser notification for upcoming subscription
 */
export const showSubscriptionNotification = async (
  subscription: UpcomingSubscription
): Promise<void> => {
  if (!('Notification' in window)) {
    console.log('Browser does not support notifications');
    return;
  }
  
  if (Notification.permission !== 'granted') {
    console.log('Notification permission not granted');
    return;
  }
  
  const { item, daysUntil, type } = subscription;
  
  const timeText = daysUntil === 0 ? 'heute' : daysUntil === 1 ? 'morgen' : `in ${daysUntil} Tagen`;
  
  const title = type === 'cancellation' 
    ? '⚠️ Kündigungsfrist läuft ab!'
    : '💳 Abo-Verlängerung';
  
  const body = type === 'cancellation'
    ? `${item.title} muss ${timeText} gekündigt werden`
    : `${item.title} verlängert sich ${timeText}`;
  
  try {
    new Notification(title, {
      body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: `subscription-${item.id}`,
      requireInteraction: type === 'cancellation', // Cancellation needs user action
      silent: false
    });
  } catch (error) {
    console.error('Error showing notification:', error);
  }
};

/**
 * Request notification permission and store preference
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    return false;
  }
  
  if (Notification.permission === 'granted') {
    return true;
  }
  
  if (Notification.permission === 'denied') {
    return false;
  }
  
  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

/**
 * Get last notification check timestamp from localStorage
 */
const LAST_CHECK_KEY = 'moneyboy_last_notification_check';

export const getLastNotificationCheck = (): number => {
  const stored = localStorage.getItem(LAST_CHECK_KEY);
  return stored ? parseInt(stored, 10) : 0;
};

export const setLastNotificationCheck = (timestamp: number): void => {
  localStorage.setItem(LAST_CHECK_KEY, timestamp.toString());
};

/**
 * Check if we should show notifications (once per day max)
 */
export const shouldCheckNotifications = (): boolean => {
  const lastCheck = getLastNotificationCheck();
  const now = Date.now();
  const oneDayAgo = now - (24 * 60 * 60 * 1000);
  
  return lastCheck < oneDayAgo;
};

/**
 * Main function: Check and notify about upcoming subscriptions
 */
export const checkAndNotifySubscriptions = async (items: FinanceItem[]): Promise<number> => {
  if (!shouldCheckNotifications()) {
    return 0;
  }
  
  if (Notification.permission !== 'granted') {
    return 0;
  }
  
  const upcoming = checkUpcomingSubscriptions(items, 2);
  
  if (upcoming.length === 0) {
    setLastNotificationCheck(Date.now());
    return 0;
  }
  
  // Show notification for most urgent subscription
  await showSubscriptionNotification(upcoming[0]);
  
  setLastNotificationCheck(Date.now());
  return upcoming.length;
};
