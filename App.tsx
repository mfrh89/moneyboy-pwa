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
import { LayoutDashboard, Plus, Settings, LogOut, Database, Cloud, Wifi, WifiOff, UploadCloud, Loader2, WalletCards, PieChart } from 'lucide-react';

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

  // UI State
  const [showExpenseDetails, setShowExpenseDetails] = useState(false);

  // Migration State
  const [showMigrationBanner, setShowMigrationBanner] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);

  const isLive = isFirebaseActive();

  // Auth Subscription
  useEffect(() => {
    const unsubscribe = subscribeToAuth((currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

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

  const fixedExpenseItems = useMemo(() => 
    items.filter(i => i.type === 'expense' && !i.isFlexible).sort((a,b) => b.amount - a.amount), 
  [items]);

  const flexibleExpenseItems = useMemo(() => 
    items.filter(i => i.type === 'expense' && i.isFlexible).sort((a,b) => b.amount - a.amount), 
  [items]);

  // Handlers
  const handleSave = async (item: FinanceItem) => {
    if (editingItem) {
      await updateItem(user, item);
    } else {
      const { id, ...newItem } = item;
      await addItem(user, newItem);
    }
  };

  const handleDelete = async (id: string) => {
    // Optimistic UI update for better feel
    setItems(prev => prev.filter(i => i.id !== id));
    await deleteItem(user, id);
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

  const openAddModal = (type: TransactionType, isFlexible: boolean = false) => {
    setEditingItem(null);
    setDefaultModalType(type);
    setDefaultModalFlexible(isFlexible);
    setIsModalOpen(true);
  };

  const openEditModal = (item: FinanceItem) => {
    setEditingItem(item);
    setDefaultModalType(item.type);
    setDefaultModalFlexible(!!item.isFlexible);
    setIsModalOpen(true);
  };

  if (loadingAuth) {
    return <div className="min-h-screen flex items-center justify-center bg-[#1e1e2e] text-[#cba6f7]">Lade Moneyboy...</div>;
  }

  if (!user) {
    return <AuthScreen onLogin={loginUser} onRegister={registerUser} />;
  }

  return (
    <div className="min-h-screen bg-[#1e1e2e] text-[#cdd6f4] font-sans pb-24 md:pb-28">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#1e1e2e]/80 backdrop-blur-md border-b border-[#313244] px-4 py-4 md:px-8 flex flex-col">
        <div className="flex justify-between items-center w-full max-w-7xl mx-auto">
            <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl transition-colors shadow-sm ${isLive ? 'bg-[#cba6f7] text-[#1e1e2e]' : 'bg-[#89b4fa] text-[#1e1e2e]'}`}>
                <WalletCards className="w-6 h-6" />
            </div>
            <div>
                <h1 className="text-xl font-bold text-[#cdd6f4] tracking-tight">
                    Moneyboy
                </h1>
                <p className="text-[10px] uppercase tracking-wider font-semibold text-[#a6adc8]">
                    Monthly Manager
                </p>
            </div>
            </div>
        </div>
      </header>

      {/* Migration Banner */}
      {showMigrationBanner && (
          <div className="bg-[#cba6f7] text-[#1e1e2e] p-3 px-4 md:px-8 flex items-center justify-between animate-in slide-in-from-top duration-300 shadow-md">
              <div className="flex items-center gap-2 text-sm md:text-base font-medium">
                  <Database className="w-4 h-4" />
                  <span>Lokale Daten gefunden. In die Cloud verschieben?</span>
              </div>
              <button 
                  onClick={handleMigration}
                  disabled={isMigrating}
                  className="flex items-center gap-2 bg-[#1e1e2e] text-[#cba6f7] px-3 py-1.5 rounded-lg text-xs md:text-sm font-bold hover:bg-[#313244] disabled:opacity-70 transition-colors"
              >
                  {isMigrating ? <Loader2 className="w-3 h-3 animate-spin" /> : <UploadCloud className="w-3 h-3" />}
                  Importieren
              </button>
          </div>
      )}

      <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
        
        {/* Settings View */}
        {view === ViewState.SETTINGS && (
             <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="mb-4">
                  <h2 className="text-2xl font-bold text-[#cdd6f4]">Einstellungen</h2>
                </div>
                
                <div className="bg-[#181825] rounded-2xl border border-[#313244] shadow-sm p-6 space-y-6">
                    {/* User Section */}
                    <div>
                        <h3 className="text-lg font-semibold text-[#cdd6f4] mb-3">Benutzerkonto</h3>
                        <div className="p-4 bg-[#11111b] rounded-xl flex items-center justify-between border border-[#313244]">
                             <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 rounded-full bg-[#313244] flex items-center justify-center text-[#cdd6f4]">
                                     {user.email ? user.email[0].toUpperCase() : '?'}
                                 </div>
                                 <div className="flex flex-col">
                                     <span className="text-sm font-bold">{user.email || 'Offline User'}</span>
                                     <span className="text-xs text-[#6c7086] flex items-center gap-1">
                                        {isLive ? <Wifi className="w-3 h-3 text-[#a6e3a1]" /> : <WifiOff className="w-3 h-3 text-[#f38ba8]" />}
                                        {isLive ? 'Online Mode' : 'Offline Mode'}
                                     </span>
                                 </div>
                             </div>
                             <button onClick={logoutUser} className="p-2 hover:bg-[#313244] rounded-full text-[#f38ba8] transition-colors">
                                 <LogOut className="w-5 h-5" />
                             </button>
                        </div>
                    </div>

                    {/* Data Section */}
                    <div>
                        <h3 className="text-lg font-semibold text-[#cdd6f4] mb-3">Daten & Speicher</h3>
                        <div className="space-y-3">
                            {!isLive && (
                                <button 
                                onClick={() => setIsConfigOpen(true)}
                                className="w-full flex items-center justify-between p-4 bg-[#313244]/50 hover:bg-[#313244] rounded-xl transition-colors border border-[#313244] group"
                                >
                                <div className="flex items-center gap-3">
                                    <Cloud className="w-5 h-5 text-[#89b4fa]" />
                                    <div className="text-left">
                                        <span className="block text-sm font-bold text-[#cdd6f4]">Firebase verbinden</span>
                                        <span className="text-xs text-[#a6adc8]">Synchronisiere deine Daten in der Cloud</span>
                                    </div>
                                </div>
                                <Settings className="w-4 h-4 text-[#6c7086] group-hover:text-[#cdd6f4]" />
                                </button>
                            )}
                            
                            {isLive && (
                                <button 
                                onClick={handleDisconnect}
                                className="w-full flex items-center justify-between p-4 bg-[#313244]/50 hover:bg-[#313244] rounded-xl transition-colors border border-[#313244] group"
                                >
                                <div className="flex items-center gap-3">
                                    <Cloud className="w-5 h-5 text-[#a6e3a1]" />
                                    <div className="text-left">
                                        <span className="block text-sm font-bold text-[#cdd6f4]">Verbunden (Custom)</span>
                                        <span className="text-xs text-[#a6adc8]">Tippen zum Trennen</span>
                                    </div>
                                </div>
                                <LogOut className="w-4 h-4 text-[#6c7086] group-hover:text-[#f38ba8]" />
                                </button>
                            )}

                            <button 
                                onClick={handleResetData}
                                className="w-full flex items-center justify-between p-4 bg-[#f38ba8]/5 hover:bg-[#f38ba8]/10 rounded-xl transition-colors border border-[#f38ba8]/20 group"
                            >
                                <div className="flex items-center gap-3">
                                    <Database className="w-5 h-5 text-[#f38ba8]" />
                                    <div className="text-left">
                                        <span className="block text-sm font-bold text-[#f38ba8]">Daten zurücksetzen</span>
                                        <span className="text-xs text-[#f38ba8]/70">Löscht alle lokalen Einträge</span>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
                
                <div className="text-center text-xs text-[#6c7086] mt-8">
                    Moneyboy v1.0 • Made with ❤️
                </div>
             </div>
        )}

        {/* Analysis View */}
        {view === ViewState.ANALYSIS && (
            <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <h2 className="text-2xl font-bold text-[#cdd6f4]">Analyse</h2>
                <FinanceChart items={items} />
                <div className="grid grid-cols-2 gap-4">
                    <SummaryCard label="Fixkosten" amount={summary.totalFixedExpenses} type="expense" size="tiny" />
                    <SummaryCard label="Variabel" amount={summary.totalFlexibleExpenses} type="flexible" size="tiny" />
                </div>
            </div>
        )}

        {/* Dashboard View */}
        {view === ViewState.DASHBOARD && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Hero / Balance */}
                <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#181825] to-[#11111b] shadow-2xl p-6 md:p-8 text-center">
                    <SummaryCard label="Verfügbares Budget" amount={summary.balance} type="balance" size="lg" />
                </section>

                <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest opacity-60 mb-4 text-[#a6adc8]">Cashflow Berechnung</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="h-full">
                            <SummaryCard
                                label="Einkommen"
                                amount={summary.totalIncome}
                                type="income"
                            />
                        </div>
                        <div className="h-full flex flex-col">
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
                                    <div className="grid grid-cols-2 gap-4 mt-4">
                                        <SummaryCard label="Fixkosten" amount={summary.totalFixedExpenses} type="expense" size="tiny" />
                                        <SummaryCard label="Variabel" amount={summary.totalFlexibleExpenses} type="flexible" size="tiny" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <TransactionList
                        title="Einkommen"
                        items={incomeItems}
                        onEdit={openEditModal}
                        onAdd={() => openAddModal('income')}
                        emptyMessage="Keine Einkünfte eingetragen."
                        accentColor="text-[#a6e3a1]"
                     />
                     <TransactionList
                        title="Fixkosten"
                        items={fixedExpenseItems}
                        onEdit={openEditModal}
                        onAdd={() => openAddModal('expense', false)}
                        emptyMessage="Keine Fixkosten eingetragen."
                        accentColor="text-[#f38ba8]"
                     />
                     <TransactionList
                        title="Variable Ausgaben"
                        items={flexibleExpenseItems}
                        onEdit={openEditModal}
                        onAdd={() => openAddModal('expense', true)}
                        emptyMessage="Keine variablen Ausgaben."
                        accentColor="text-[#fab387]"
                     />
                </div>
            </div>
        )}
      </main>

      {/* Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#1e1e2e]/90 backdrop-blur-xl border-t border-[#313244] pb-safe pt-2 px-6 z-40">
        <div className="flex justify-around items-center max-w-lg mx-auto h-16 relative">
            <button
                onClick={() => setView(ViewState.DASHBOARD)}
                className={`flex flex-col items-center gap-1 w-20 transition-colors ${view === ViewState.DASHBOARD ? 'text-[#cba6f7]' : 'text-[#6c7086] hover:text-[#a6adc8]'}`}
            >
                <LayoutDashboard className="w-6 h-6" />
                <span className="text-[10px] font-bold">Übersicht</span>
            </button>

            <button
                onClick={() => setView(ViewState.ANALYSIS)}
                className={`flex flex-col items-center gap-1 w-20 transition-colors ${view === ViewState.ANALYSIS ? 'text-[#cba6f7]' : 'text-[#6c7086] hover:text-[#a6adc8]'}`}
            >
                <PieChart className="w-6 h-6" />
                <span className="text-[10px] font-bold">Analyse</span>
            </button>

            <button
                onClick={() => setView(ViewState.SETTINGS)}
                className={`flex flex-col items-center gap-1 w-20 transition-colors ${view === ViewState.SETTINGS ? 'text-[#cba6f7]' : 'text-[#6c7086] hover:text-[#a6adc8]'}`}
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