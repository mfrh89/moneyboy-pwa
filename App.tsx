import React, { useState, useEffect, useMemo } from 'react';
import {
  subscribeToItems,
  addItem,
  updateItem,
  deleteItem,
  subscribeToAuth,
  loginUser,
  registerUser,
  logoutUser,
  isFirebaseActive,
  saveFirebaseConfig,
  clearFirebaseConfig,
  seedData,
  hasLocalData,
  syncLocalToFirebase
} from './services/storage';
import { FinanceItem, ViewState, TransactionType, FirebaseConfig } from './types';
import { SummaryCard } from './components/SummaryCard';
import { TransactionList } from './components/TransactionList';
import { EditModal } from './components/EditModal';
import { FinanceChart } from './components/FinanceChart';
import { AuthScreen } from './components/AuthScreen';
import { ConfigModal } from './components/ConfigModal';
import { CategoryManager } from './components/CategoryManager';
import { SankeyChart } from './components/SankeyChart';
import { WohnenView } from './components/WohnenView';
import { AboView } from './components/AboView';
import { SubscriptionAlert } from './components/SubscriptionAlert';
import { NotificationSettings } from './components/NotificationSettings';
import { checkAndNotifySubscriptions } from './services/subscriptionChecker';
import { setupForegroundMessageHandler } from './services/notifications';
import { LayoutDashboard, Plus, Settings, LogOut, Database, Cloud, Wifi, WifiOff, UploadCloud, Loader2, WalletCards, PieChart, Home, Repeat } from 'lucide-react';

const DEFAULT_CATEGORIES = [
  'Wohnen',
  'Lebenshaltung',
  'Abonnements',
  'Mobilität',
  'Versicherung',
  'Freizeit',
  'Gesundheit',
  'Kleidung',
  'Reisen',
  'Bildung',
  'Geschenke',
  'Haustiere',
  'Technik',
  'Sparen',
  'Gehalt',
  'Sonstiges'
];

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const [items, setItems] = useState<FinanceItem[]>([]);
  const [view, setView] = useState<ViewState>(ViewState.DASHBOARD);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  const [editingItem, setEditingItem] = useState<FinanceItem | null>(null);
  const [defaultModalType, setDefaultModalType] = useState<TransactionType>('expense');
  const [defaultModalFlexible, setDefaultModalFlexible] = useState<boolean>(false);

  // Wohnkosten modal context
  const [isWohnkostenModal, setIsWohnkostenModal] = useState(false);

  // Abo modal context
  const [isAboModal, setIsAboModal] = useState(false);

  // UI State
  const [showExpenseDetails, setShowExpenseDetails] = useState(false);

  // Migration State
  const [showMigrationBanner, setShowMigrationBanner] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);

  // PWA Update State
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  const isLive = isFirebaseActive();

  // Auth Subscription
  useEffect(() => {
    const unsubscribe = subscribeToAuth((currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  // Service Worker Registration for Push Notifications
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/firebase-messaging-sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration);

          // Pass Firebase config to Service Worker
          const firebaseConfig = {
            apiKey: "AIzaSyBh3HMQ6eR8Q9Dw7utfg_PjnhWv3Djiz0M",
            authDomain: "moneyboy-2f088.firebaseapp.com",
            projectId: "moneyboy-2f088",
            storageBucket: "moneyboy-2f088.firebasestorage.app",
            messagingSenderId: "679174588558",
            appId: "1:679174588558:web:7615c9c0af9ea36aec21df",
            measurementId: "G-RCXP9MTNT6"
          };

          navigator.serviceWorker.ready.then((reg) => {
            reg.active?.postMessage({
              type: 'FIREBASE_CONFIG',
              config: firebaseConfig
            });
          });

          // PWA update detection
          if (registration.waiting && navigator.serviceWorker.controller) {
            setWaitingWorker(registration.waiting);
          }
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            newWorker?.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setWaitingWorker(newWorker);
              }
            });
          });

          // Check for updates immediately on start + on every foreground
          registration.update().catch(() => {});
          const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
              registration.update().catch(() => {});
            }
          };
          document.addEventListener('visibilitychange', handleVisibilityChange);
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });

      // Reload after new SW takes control
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });

      // Setup foreground message handler
      if (isLive) {
        setupForegroundMessageHandler((payload) => {
          console.log('Foreground message received:', payload);
          // Show notification even when app is in foreground
          if (Notification.permission === 'granted') {
            new Notification(payload.notification?.title || 'Moneyboy', {
              body: payload.notification?.body || 'Du hast eine neue Benachrichtigung',
              icon: '/icon-192.png',
              badge: '/icon-192.png'
            });
          }
        });
      }
    }
  }, [isLive]);

  // Data Subscription & Migration Check
  useEffect(() => {
     const handleLocalUpdate = () => {
         if (!isLive) {
             subscribeToItems(user, (data) => setItems(data));
         }
     };
     window.addEventListener('local-data-changed', handleLocalUpdate);

     const unsubscribe = subscribeToItems(user, (data) => {
       setItems(data);
     });

     if (isLive && user && hasLocalData()) {
        setShowMigrationBanner(true);
     } else {
        setShowMigrationBanner(false);
     }

      return () => {
          unsubscribe();
          window.removeEventListener('local-data-changed', handleLocalUpdate);
      };
   }, [user, isLive]);

   // Check for upcoming subscriptions and show notifications
   useEffect(() => {
     if (items.length > 0) {
       checkAndNotifySubscriptions(items);
     }
   }, [items]);

  // Derived State
  const summary = useMemo(() => {
    const income = items.filter(i => i.type === 'income').reduce((sum, i) => sum + i.amount, 0);
    const fixedExpenses = items.filter(i => i.type === 'expense' && !i.isFlexible).reduce((sum, i) => sum + i.amount, 0);
    const flexibleExpenses = items.filter(i => i.type === 'expense' && i.isFlexible).reduce((sum, i) => sum + i.amount, 0);
    const totalExpenses = fixedExpenses + flexibleExpenses;

    return {
      totalIncome: income,
      totalFixedExpenses: fixedExpenses,
      totalFlexibleExpenses: flexibleExpenses,
      totalAllExpenses: totalExpenses,
      balance: income - totalExpenses
    };
  }, [items]);

  const incomeItems = useMemo(() =>
    items.filter(i => i.type === 'income').sort((a,b) => b.amount - a.amount),
  [items]);

  const wohnkostenItems = useMemo(() =>
    items.filter(i => i.isWohnkosten).sort((a, b) => b.amount - a.amount),
  [items]);

  const wohnkostenTotal = useMemo(() =>
    wohnkostenItems.reduce((sum, i) => sum + i.amount, 0),
  [wohnkostenItems]);

  const aboItems = useMemo(() =>
    items.filter(i => i.isSubscription).sort((a, b) => b.amount - a.amount),
  [items]);

  const aboTotal = useMemo(() =>
    aboItems.reduce((sum, i) => sum + i.amount, 0),
  [aboItems]);

  const WOHNKOSTEN_SUMMARY_ID = '__wohnkosten_summary__';

  const fixedExpenseItems = useMemo(() => {
    const base = items
      .filter(i => i.type === 'expense' && !i.isFlexible && !i.isWohnkosten)
      .sort((a, b) => b.amount - a.amount);
    if (wohnkostenItems.length === 0) return base;
    const summaryItem: FinanceItem = {
      id: WOHNKOSTEN_SUMMARY_ID,
      title: 'Wohnkosten',
      amount: wohnkostenTotal,
      type: 'expense',
      category: `${wohnkostenItems.length} Posten`,
      isWohnkosten: true,
      createdAt: 0,
    };
    return [summaryItem, ...base];
  }, [items, wohnkostenItems, wohnkostenTotal]);

  const flexibleExpenseItems = useMemo(() =>
    items.filter(i => i.type === 'expense' && i.isFlexible && !i.isWohnkosten).sort((a,b) => b.amount - a.amount),
  [items]);

  // Subscriptions expiring within 2 days
  const upcomingSubscriptions = useMemo(() => {
    const now = Date.now();
    const twoDaysFromNow = now + (2 * 24 * 60 * 60 * 1000);

    return items.filter(item => {
      if (!item.isSubscription) return false;

      // Check if next billing or cancellation deadline is within 2 days
      const nextBilling = item.subscriptionNextBilling;
      const cancellationDeadline = item.subscriptionCancellationDeadline;

      if (nextBilling && nextBilling >= now && nextBilling <= twoDaysFromNow) return true;
      if (cancellationDeadline && cancellationDeadline >= now && cancellationDeadline <= twoDaysFromNow) return true;

      return false;
    }).sort((a, b) => {
      // Sort by earliest relevant date
      const aDate = Math.min(a.subscriptionNextBilling || Infinity, a.subscriptionCancellationDeadline || Infinity);
      const bDate = Math.min(b.subscriptionNextBilling || Infinity, b.subscriptionCancellationDeadline || Infinity);
      return aDate - bDate;
    });
  }, [items]);

  const availableCategories = useMemo(() => {
    const usedCategories = items.map(i => i.category).filter(Boolean);
    const all = new Set([...DEFAULT_CATEGORIES, ...usedCategories]);
    return Array.from(all).sort();
  }, [items]);

  // Handlers
  const handleSave = async (item: FinanceItem) => {
    if (editingItem) {
      await updateItem(user, { ...item, isWohnkosten: editingItem.isWohnkosten });
    } else {
      const { id, ...newItem } = item;
      await addItem(user, {
        ...newItem,
        ...(isWohnkostenModal ? { isWohnkosten: true } : {}),
        ...(isAboModal ? { isSubscription: true } : {}),
      });
    }
  };

  const handleDelete = async (id: string) => {
    // Optimistic UI update for better feel
    setItems(prev => prev.filter(i => i.id !== id));
    await deleteItem(user, id);
  };

  const handleRenameCategory = async (oldName: string, newName: string) => {
    if (!newName || oldName === newName) return;

    // Find all items using this category
    const itemsToUpdate = items.filter(i => i.category === oldName);

    for (const item of itemsToUpdate) {
      await updateItem(user, { ...item, category: newName });
    }
  };

  const handleDeleteCategory = async (categoryToDelete: string) => {
      // Find all items using this category
      const itemsToUpdate = items.filter(i => i.category === categoryToDelete);

      // Update them to "Sonstiges"
      for (const item of itemsToUpdate) {
          await updateItem(user, { ...item, category: 'Sonstiges' });
      }
  };

  const handleResetData = () => {
    if(confirm('Möchten Sie wirklich alle Daten zurücksetzen?')) {
       localStorage.removeItem('finance_pwa_data_v1');
       seedData();
       window.dispatchEvent(new CustomEvent('local-data-changed'));
       setView(ViewState.DASHBOARD);
    }
  }

  const handleFirebaseConfig = (config: FirebaseConfig) => {
      saveFirebaseConfig(config);
  };

  const handleDisconnect = () => {
      if(confirm('Verbindung zu Firebase trennen? Die App wechselt zurück in den lokalen Modus.')) {
          clearFirebaseConfig();
      }
  };

  const handleMigration = async () => {
      setIsMigrating(true);
      try {
          await syncLocalToFirebase(user);
          setShowMigrationBanner(false);
          alert('Daten erfolgreich in die Cloud übertragen!');
      } catch (e) {
          console.error(e);
          alert('Fehler beim Übertragen der Daten.');
      } finally {
          setIsMigrating(false);
      }
  };

  const handleToggleWohnkostenCategory = (category: string) => {
    const updated = wohnkostenCategories.includes(category)
      ? wohnkostenCategories.filter(c => c !== category)
      : [...wohnkostenCategories, category];
    setWohnkostenCategories(updated);
    saveWohnkostenCategories(updated);
  };

  const openAddModal = (type: TransactionType, isFlexible: boolean = false) => {
    setEditingItem(null);
    setDefaultModalType(type);
    setDefaultModalFlexible(isFlexible);
    setIsWohnkostenModal(false);
    setIsAboModal(false);
    setIsModalOpen(true);
  };

  const openAddWohnkostenModal = () => {
    setEditingItem(null);
    setDefaultModalType('expense');
    setDefaultModalFlexible(false);
    setIsWohnkostenModal(true);
    setIsAboModal(false);
    setIsModalOpen(true);
  };

  const openAddAboModal = () => {
    setEditingItem(null);
    setDefaultModalType('expense');
    setDefaultModalFlexible(false);
    setIsWohnkostenModal(false);
    setIsAboModal(true);
    setIsModalOpen(true);
  };

  const openEditModal = (item: FinanceItem) => {
    if (item.id === WOHNKOSTEN_SUMMARY_ID) {
      setView(ViewState.WOHNEN);
      return;
    }
    setEditingItem(item);
    setDefaultModalType(item.type);
    setDefaultModalFlexible(!!item.isFlexible);
    setIsWohnkostenModal(false);
    setIsAboModal(false);
    setIsModalOpen(true);
  };

  if (loadingAuth) {
    return <div className="min-h-screen flex items-center justify-center bg-surface text-on-surface">Lade Moneyboy...</div>;
  }

  if (!user) {
    return <AuthScreen onLogin={loginUser} onRegister={registerUser} />;
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface-variant font-mono pb-24 md:pb-28">
      {/* Header */}
      <header className="sticky top-0 z-30 glass px-4 pt-header-safe pb-3 md:px-8 flex flex-col">
        <div className="flex justify-between items-center w-full max-w-7xl mx-auto">
            <div className="flex items-center gap-3">
            <div className="p-2 rounded-ds-sm bg-primary text-on-primary transition-colors">
                <WalletCards className="w-6 h-6" />
            </div>
            <div>
                <h1 className="text-xl font-bold text-on-surface tracking-tight">
                    Moneyboy
                </h1>
                <p className="text-[10px] uppercase tracking-[0.08em] font-medium text-on-surface-variant">
                    Monthly Manager
                </p>
            </div>
            </div>
        </div>
      </header>

      {/* PWA Update Banner */}
      {waitingWorker && (
        <div className="bg-primary text-on-primary p-3 px-4 md:px-8 flex items-center justify-between animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2 text-sm font-medium">
            <span>Update verfügbar</span>
          </div>
          <button
            onClick={() => waitingWorker.postMessage({ type: 'SKIP_WAITING' })}
            className="bg-on-primary text-primary px-3 py-1.5 rounded-ds-md text-xs font-bold hover:bg-surface-highest transition-colors"
          >
            Jetzt aktualisieren
          </button>
        </div>
      )}

      {/* Migration Banner */}
      {showMigrationBanner && (
          <div className="bg-primary text-on-primary p-3 px-4 md:px-8 flex items-center justify-between animate-in slide-in-from-top duration-300">
              <div className="flex items-center gap-2 text-sm md:text-base font-medium">
                  <Database className="w-4 h-4" />
                  <span>Lokale Daten gefunden. In die Cloud verschieben?</span>
              </div>
              <button
                  onClick={handleMigration}
                  disabled={isMigrating}
                  className="flex items-center gap-2 bg-on-primary text-primary px-3 py-1.5 rounded-ds-md text-xs md:text-sm font-bold hover:bg-surface-highest disabled:opacity-70 transition-colors"
              >
                  {isMigrating ? <Loader2 className="w-3 h-3 animate-spin" /> : <UploadCloud className="w-3 h-3" />}
                  Importieren
              </button>
          </div>
      )}

      <main className="max-w-7xl mx-auto p-4 md:p-10 space-y-12">

        {/* Settings View */}
        {view === ViewState.SETTINGS && (
             <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="mb-4">
                  <h2 className="text-[2rem] md:text-[2.5rem] font-bold text-on-surface tracking-[-0.02em] leading-[1.15]">Einstellungen</h2>
                </div>

                <div className="bg-surface-lowest rounded-ds-lg shadow-float p-6 space-y-8">
                    {/* User Section */}
                    <div>
                        <h3 className="text-[1.25rem] font-semibold text-on-surface mb-3">Benutzerkonto</h3>
                        <div className="p-4 bg-surface-low rounded-ds-md flex items-center justify-between">
                             <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 rounded-full bg-surface-high flex items-center justify-center text-on-surface font-bold">
                                     {user.email ? user.email[0].toUpperCase() : '?'}
                                 </div>
                                 <div className="flex flex-col">
                                     <span className="text-sm font-bold text-on-surface">{user.email || 'Offline User'}</span>
                                     <span className="text-xs text-on-surface-variant flex items-center gap-1">
                                        {isLive ? <Wifi className="w-3 h-3 text-status-success" /> : <WifiOff className="w-3 h-3 text-on-surface-variant" />}
                                        {isLive ? 'Online Mode' : 'Offline Mode'}
                                     </span>
                                 </div>
                             </div>
                             <button onClick={logoutUser} className="p-2 hover:bg-surface-high rounded-ds-sm text-on-surface-variant transition-colors">
                                 <LogOut className="w-5 h-5" />
                             </button>
                        </div>
                    </div>

                    {/* Category Management */}
                    <CategoryManager
                      categories={availableCategories}
                      onRename={handleRenameCategory}
                      onDelete={handleDeleteCategory}
                    />

                    {/* Notification Settings */}
                    <NotificationSettings userId={user?.uid || null} isFirebaseActive={isLive} />

                    {/* Data Section */}
                    <div>
                        <h3 className="text-[1.25rem] font-semibold text-on-surface mb-3">Daten & Speicher</h3>
                        <div className="space-y-3">
                            {!isLive && (
                                <button
                                onClick={() => setIsConfigOpen(true)}
                                className="w-full flex items-center justify-between p-4 bg-surface-low hover:bg-surface-mid rounded-ds-md transition-colors group"
                                >
                                <div className="flex items-center gap-3">
                                    <Cloud className="w-5 h-5 text-status-info" />
                                    <div className="text-left">
                                        <span className="block text-sm font-bold text-on-surface">Firebase verbinden</span>
                                        <span className="text-xs text-on-surface-variant">Synchronisiere deine Daten in der Cloud</span>
                                    </div>
                                </div>
                                <Settings className="w-4 h-4 text-outline-variant group-hover:text-on-surface" />
                                </button>
                            )}

                            {isLive && (
                                <button
                                onClick={handleDisconnect}
                                className="w-full flex items-center justify-between p-4 bg-surface-low hover:bg-surface-mid rounded-ds-md transition-colors group"
                                >
                                <div className="flex items-center gap-3">
                                    <Cloud className="w-5 h-5 text-status-info" />
                                    <div className="text-left">
                                        <span className="block text-sm font-bold text-on-surface">Verbunden (Custom)</span>
                                        <span className="text-xs text-on-surface-variant">Tippen zum Trennen</span>
                                    </div>
                                </div>
                                <LogOut className="w-4 h-4 text-outline-variant group-hover:text-on-surface" />
                                </button>
                            )}

                            <button
                                onClick={handleResetData}
                                className="w-full flex items-center justify-between p-4 bg-surface-high/50 hover:bg-surface-high rounded-ds-md transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <Database className="w-5 h-5 text-on-surface-variant" />
                                    <div className="text-left">
                                        <span className="block text-sm font-bold text-on-surface">Daten zurücksetzen</span>
                                        <span className="text-xs text-on-surface-variant">Löscht alle lokalen Einträge</span>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="text-center text-xs text-outline-variant mt-8">
                    Moneyboy v1.0
                </div>
             </div>
        )}

        {/* Wohnen View */}
        {view === ViewState.WOHNEN && (
          <WohnenView
            items={wohnkostenItems}
            total={wohnkostenTotal}
            onEdit={openEditModal}
            onAdd={openAddWohnkostenModal}
          />
        )}

        {/* Abos View */}
        {view === ViewState.ABOS && (
          <AboView
            items={aboItems}
            total={aboTotal}
            onEdit={openEditModal}
            onAdd={openAddAboModal}
          />
        )}

        {/* Analysis View */}
        {view === ViewState.ANALYSIS && (
            <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <h2 className="text-[2rem] md:text-[2.5rem] font-bold text-on-surface tracking-[-0.02em] leading-[1.15]">Analyse</h2>
                <SankeyChart items={items} />
            </div>
        )}

        {/* Dashboard View */}
        {view === ViewState.DASHBOARD && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Hero / Balance */}
                <section className="relative overflow-hidden rounded-ds-xl bg-surface-lowest shadow-float p-6 md:p-8 text-center">
                    <SummaryCard label="Verfügbares Budget" amount={summary.balance} type="balance" size="lg" />
                </section>

                {/* Subscription Alert */}
                {upcomingSubscriptions.length > 0 && (
                    <SubscriptionAlert
                        subscriptions={upcomingSubscriptions}
                        onItemClick={openEditModal}
                    />
                )}

                <div>
                    <h3 className="text-[0.75rem] font-medium uppercase tracking-[0.05em] text-on-surface-variant mb-6">CASHFLOW BERECHNUNG</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        <div className="h-full">
                            <SummaryCard
                                label="Einkommen"
                                amount={summary.totalIncome}
                                type="income"
                            />
                        </div>
                        <div className="h-full flex flex-col lg:col-span-2">
                            <SummaryCard
                                label="Gesamtausgaben"
                                amount={summary.totalAllExpenses}
                                type="total"
                                size="md"
                                onClick={() => setShowExpenseDetails(!showExpenseDetails)}
                                isOpen={showExpenseDetails}
                            />

                            {/* Animated Accordion */}
                            <div className={`grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${showExpenseDetails ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                                <div className="overflow-hidden min-h-0">
                                    <div className="grid grid-cols-2 gap-6 mt-4">
                                        <SummaryCard label="Fixkosten" amount={summary.totalFixedExpenses} type="expense" size="tiny" />
                                        <SummaryCard label="Variabel" amount={summary.totalFlexibleExpenses} type="flexible" size="tiny" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     <TransactionList
                        title="Einkommen"
                        items={incomeItems}
                        onEdit={openEditModal}
                        onAdd={() => openAddModal('income')}
                        emptyMessage="Keine Einkünfte eingetragen."
                        accentColor="text-status-success"
                     />
                     <TransactionList
                        title="Fixkosten"
                        items={fixedExpenseItems}
                        onEdit={openEditModal}
                        onAdd={() => openAddModal('expense', false)}
                        emptyMessage="Keine Fixkosten eingetragen."
                        accentColor="text-status-error"
                        showSubscriptionFilter={true}
                     />
                     <TransactionList
                        title="Variable Ausgaben"
                        items={flexibleExpenseItems}
                        onEdit={openEditModal}
                        onAdd={() => openAddModal('expense', true)}
                        emptyMessage="Keine variablen Ausgaben."
                        accentColor="text-status-warning"
                        showSubscriptionFilter={true}
                     />
                </div>
            </div>
        )}
      </main>

      {/* Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 glass border-t border-outline-variant/20 pb-safe pt-2 px-6 z-40">
        <div className="flex justify-around items-center max-w-lg mx-auto h-16 relative">
            <button
                onClick={() => setView(ViewState.DASHBOARD)}
                className={`flex flex-col items-center gap-1 w-20 transition-colors ${view === ViewState.DASHBOARD ? 'text-primary' : 'text-outline-variant can-hover:hover:text-on-surface-variant'}`}
            >
                <LayoutDashboard className="w-6 h-6" />
                <span className="text-[10px] font-bold">Übersicht</span>
            </button>

            <button
                onClick={() => setView(ViewState.WOHNEN)}
                className={`flex flex-col items-center gap-1 w-20 transition-colors ${view === ViewState.WOHNEN ? 'text-primary' : 'text-outline-variant can-hover:hover:text-on-surface-variant'}`}
            >
                <Home className="w-6 h-6" />
                <span className="text-[10px] font-bold">Wohnen</span>
            </button>

            <button
                onClick={() => setView(ViewState.ABOS)}
                className={`flex flex-col items-center gap-1 w-20 transition-colors ${view === ViewState.ABOS ? 'text-primary' : 'text-outline-variant can-hover:hover:text-on-surface-variant'}`}
            >
                <Repeat className="w-6 h-6" />
                <span className="text-[10px] font-bold">Abos</span>
            </button>

            <button
                onClick={() => setView(ViewState.ANALYSIS)}
                className={`flex flex-col items-center gap-1 w-20 transition-colors ${view === ViewState.ANALYSIS ? 'text-primary' : 'text-outline-variant can-hover:hover:text-on-surface-variant'}`}
            >
                <PieChart className="w-6 h-6" />
                <span className="text-[10px] font-bold">Analyse</span>
            </button>

            <button
                onClick={() => setView(ViewState.SETTINGS)}
                className={`flex flex-col items-center gap-1 w-20 transition-colors ${view === ViewState.SETTINGS ? 'text-primary' : 'text-outline-variant can-hover:hover:text-on-surface-variant'}`}
            >
                <Settings className="w-6 h-6" />
                <span className="text-[10px] font-bold">Settings</span>
            </button>
        </div>
      </nav>

      <EditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        onDelete={handleDelete}
        initialItem={editingItem}
        defaultType={defaultModalType}
        defaultIsFlexible={defaultModalFlexible}
        defaultIsSubscription={isAboModal}
        availableCategories={availableCategories}
      />

      <ConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        onSave={handleFirebaseConfig}
      />
    </div>
  );
};

export default App;