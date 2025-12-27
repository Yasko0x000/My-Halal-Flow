"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  Wallet, TrendingUp, Home, Plus, Trash2, Settings, Target, Briefcase, Plane, Smartphone, X, User, ArrowRight, CheckCircle2, Package, RefreshCw, Box, AlertCircle, Pencil, History, ArrowLeft, LayoutDashboard, PieChart, LogOut, ChevronRight, Car, Heart, CalendarCheck, ThumbsUp, Check, CalendarPlus, Calendar, ArrowDown
} from 'lucide-react';

// --- UTILITAIRES ANIMATIONS & UI ---

const Toast = ({ message, type = 'success', onClose }) => (
  <div className={`fixed bottom-4 right-4 z-50 px-6 py-4 rounded-xl shadow-2xl border flex items-center gap-3 transition-all duration-500 transform translate-y-0 ${type === 'success' ? 'bg-white border-emerald-100 text-emerald-800' : 'bg-white border-red-100 text-red-800'}`}>
    {type === 'success' ? <CheckCircle2 size={20} className="text-emerald-500"/> : <AlertCircle size={20} className="text-red-500"/>}
    <p className="font-medium text-sm">{message}</p>
    <button onClick={onClose} className="ml-4 opacity-50 hover:opacity-100"><X size={14}/></button>
  </div>
);

const Card = ({ children, className = "", onClick }) => (
  <div 
    onClick={onClick}
    className={`bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 ease-out ${className}`}
  >
    {children}
  </div>
);

const Button = ({ children, onClick, variant = "primary", className = "", disabled = false, size = "md" }) => {
  const sizes = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2.5 text-sm", lg: "px-6 py-3 text-base" };
  const variants = {
    primary: "bg-slate-900 text-white hover:bg-slate-800 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-slate-900/20",
    emerald: "bg-emerald-600 text-white hover:bg-emerald-700 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-emerald-600/20",
    secondary: "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200",
    danger: "bg-white text-red-600 border border-red-100 hover:bg-red-50",
    ghost: "text-slate-500 hover:text-slate-900 hover:bg-slate-50",
    outline: "border border-slate-300 text-slate-700 hover:bg-slate-50"
  };
  
  return (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      className={`${sizes[size]} rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

const InputGroup = ({ label, type = "text", value, onChange, placeholder, icon: Icon, options = null }) => (
  <div className="flex flex-col gap-1.5 w-full group">
    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 group-focus-within:text-emerald-600 transition-colors">{label}</label>
    <div className="relative">
      {Icon && (
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors">
          <Icon size={18} />
        </div>
      )}
      {options ? (
        <select 
          value={value} 
          onChange={onChange}
          className={`w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 block p-3 outline-none transition-all ${Icon ? 'pl-11' : ''}`}
        >
           {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
      ) : (
        <input 
          type={type} 
          value={value} 
          onChange={onChange} 
          placeholder={placeholder}
          className={`w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 block p-3 outline-none transition-all placeholder:text-slate-400 ${Icon ? 'pl-11' : ''}`}
        />
      )}
    </div>
  </div>
);

// --- MOTEUR DE DONNÉES ---
const mockDb = {
  load: () => {
    if (typeof window === 'undefined') return null;
    try {
        const data = localStorage.getItem('halalFlow_db_v4'); // V4 pour futureOperations
        return data ? JSON.parse(data) : null;
    } catch (e) {
        console.error("Erreur lecture DB", e);
        return null;
    }
  },
  save: (data) => {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem('halalFlow_db_v4', JSON.stringify(data));
    } catch (e) {
        console.error("Erreur sauvegarde DB", e);
    }
  }
};

// --- APP ---
export default function MyHalalFlow() {
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // --- STATE ---
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false); 
  const [onboarded, setOnboarded] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');
  const [showMonthlyCheck, setShowMonthlyCheck] = useState(false);
  
  // Data State
  const [user, setUser] = useState({ name: 'Utilisateur' });
  const [finance, setFinance] = useState({ 
      balance: 0, 
      income: 0, 
      expenses: 0, 
      lastBudgetCheck: null 
  });
  const [transactions, setTransactions] = useState([]);
  const [goals, setGoals] = useState([]);
  const [assets, setAssets] = useState([]);
  const [futureOperations, setFutureOperations] = useState([]); // Renommé pour inclure dépenses

  const [editingItem, setEditingItem] = useState(null);

  // --- INITIALISATION ---
  useEffect(() => {
    setMounted(true);
    setTimeout(() => {
      const data = mockDb.load();
      if (data) {
        setUser(data.user || { name: 'Utilisateur' });
        
        const loadedFinance = data.finance || { balance: 0, income: 0, expenses: 0, lastBudgetCheck: null };
        setFinance({
            ...loadedFinance,
            balance: Number(loadedFinance.balance) || 0,
            income: Number(loadedFinance.income) || 0,
            expenses: Number(loadedFinance.expenses) || 0
        });
        
        setTransactions(data.transactions || []);
        const loadedGoals = (data.goals || []).map(g => ({...g, status: g.status || 'active'}));
        setGoals(loadedGoals);
        const loadedAssets = (data.assets || []).map(a => ({...a, status: a.status || 'active'}));
        setAssets(loadedAssets);
        // Migration V3 -> V4 (futureIncomes -> futureOperations)
        let loadedOps = [];
        if (data.futureOperations) {
            loadedOps = data.futureOperations;
        } else if (data.futureIncomes) {
            loadedOps = data.futureIncomes.map(i => ({...i, type: 'in'})); // Migration ancien format
        }
        setFutureOperations(loadedOps.map(i => ({...i, received: i.received || false})));
        
        setOnboarded(true);

        if (true) { 
            const lastCheck = loadedFinance.lastBudgetCheck ? new Date(loadedFinance.lastBudgetCheck) : new Date(0);
            const now = new Date();
            if (loadedFinance.lastBudgetCheck && (lastCheck.getMonth() !== now.getMonth() || lastCheck.getFullYear() !== now.getFullYear())) {
                setShowMonthlyCheck(true);
            }
        }
      }
      setLoading(false);
    }, 500); 
  }, []);

  // --- PERSISTANCE ---
  useEffect(() => {
    if (!loading && onboarded) {
      mockDb.save({ user, finance, transactions, goals, assets, futureOperations });
    }
  }, [user, finance, transactions, goals, assets, futureOperations, loading, onboarded]);


  // --- ACTIONS METIERS ---

  const handleOnboarding = (formData) => {
    setUser({ name: formData.pseudo });
    setFinance({
      balance: parseFloat(formData.balance) || 0,
      income: parseFloat(formData.income) || 0,
      expenses: parseFloat(formData.expenses) || 0,
      lastBudgetCheck: new Date().toISOString()
    });
    setGoals([{ id: 1, name: "Épargne de Sécurité", target: 3000, color: "bg-emerald-500", iconKey: "Wallet", status: 'active' }]);
    setOnboarded(true);
    showToast("Espace configuré avec succès !");
  };

  const confirmMonthlyBudget = (newBalanceInput) => {
      const newDate = new Date().toISOString();
      const newBalance = parseFloat(newBalanceInput);

      if (!isNaN(newBalance) && Math.abs(newBalance - finance.balance) > 0.01) {
          const diff = newBalance - finance.balance;
          const adjustmentTx = {
              id: Date.now(),
              date: newDate,
              type: diff > 0 ? 'in' : 'out',
              amount: Math.abs(diff),
              label: 'Ajustement Solde Mensuel'
          };
          setTransactions(prev => [adjustmentTx, ...prev]);
          setFinance(prev => ({ ...prev, balance: Number(newBalance), lastBudgetCheck: newDate }));
          showToast(`Solde ajusté (${diff > 0 ? '+' : ''}${formatMoney(diff)}) !`);
      } else {
          setFinance(prev => ({ ...prev, lastBudgetCheck: newDate }));
          showToast("Solde validé, c'est carré !");
      }
      setShowMonthlyCheck(false);
  };

  // --- CORE TRANSACTIONS ---
  const addTransaction = (type, amount, label, relatedGoalId = null, relatedAssetId = null, relatedOpId = null) => {
    const val = parseFloat(amount);
    if (isNaN(val) || !label) return;

    const newTx = { 
        id: Date.now(), 
        date: new Date().toISOString(), 
        type, 
        amount: val, 
        label,
        relatedGoalId,
        relatedAssetId,
        relatedOpId
    };

    setTransactions(prev => [newTx, ...prev]);
    
    setFinance(prev => ({
      ...prev,
      balance: type === 'in' ? Number(prev.balance) + val : Number(prev.balance) - val
    }));

    if (relatedGoalId) {
        setGoals(prev => prev.map(g => g.id === relatedGoalId ? { ...g, status: 'completed' } : g));
    }
    
    if (relatedAssetId) {
        setAssets(prev => prev.map(a => a.id === relatedAssetId ? { ...a, status: 'sold' } : a));
    }

    if (relatedOpId) {
        setFutureOperations(prev => prev.map(i => i.id === relatedOpId ? { ...i, received: true } : i));
    }

    showToast((relatedGoalId || relatedAssetId || relatedOpId) ? "Opération validée avec succès !" : "Transaction enregistrée");
    setCurrentView('dashboard');
  };

  const deleteTransaction = (id) => {
      const txToDelete = transactions.find(t => t.id === id);
      if(!txToDelete) return;

      if(!confirm("Annuler cette transaction ? Cela annulera l'effet sur le solde.")) return;

      setFinance(prev => ({
          ...prev,
          balance: txToDelete.type === 'in' 
            ? Number(prev.balance) - Number(txToDelete.amount) 
            : Number(prev.balance) + Number(txToDelete.amount)
      }));

      // Rollback intelligent
      if (txToDelete.relatedGoalId) {
          setGoals(prev => prev.map(g => g.id === txToDelete.relatedGoalId ? { ...g, status: 'active' } : g));
          showToast("Objectif réactivé (achat annulé) !", "success");
      } else if (txToDelete.relatedAssetId) {
          setAssets(prev => prev.map(a => a.id === txToDelete.relatedAssetId ? { ...a, status: 'active' } : a));
          showToast("Bien remis en stock (vente annulée) !", "success");
      } else if (txToDelete.relatedOpId) {
          setFutureOperations(prev => prev.map(i => i.id === txToDelete.relatedOpId ? { ...i, received: false } : i));
          showToast("Opération réactivée au planning !", "success");
      } else {
          showToast("Transaction annulée", "error");
      }

      setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const upsertGoal = (goalData) => {
    if (editingItem) {
        setGoals(prev => prev.map(g => g.id === editingItem.id ? { ...g, ...goalData } : g));
        showToast("Objectif mis à jour");
    } else {
        setGoals(prev => [...prev, { id: Date.now(), ...goalData, status: 'active' }]);
        showToast("Nouvel objectif créé");
    }
    setEditingItem(null);
    setCurrentView('dashboard');
  };

  const deleteGoal = (id) => {
      if(confirm("Supprimer définitivement cet objectif ?")) {
          setGoals(prev => prev.filter(g => g.id !== id));
          showToast("Objectif supprimé", "error");
      }
  };

  const completeGoal = (goal) => {
      const realCostStr = prompt(`Génial ! Tu as acheté "${goal.name}".\nCombien as-tu payé exactement ?`, goal.target);
      if (realCostStr) {
          const realCost = parseFloat(realCostStr);
          if (isNaN(realCost)) return showToast("Prix invalide", "error");
          addTransaction('out', realCost, `Achat : ${goal.name}`, goal.id, null);
      }
  };

  const upsertAsset = (assetData) => {
      if (editingItem) {
          setAssets(prev => prev.map(a => a.id === editingItem.id ? { ...a, ...assetData } : a));
          showToast("Bien mis à jour");
      } else {
          setAssets(prev => [...prev, { id: Date.now(), ...assetData, status: 'active' }]);
          showToast("Bien ajouté au patrimoine");
      }
      setEditingItem(null);
      setCurrentView('dashboard');
  };
  
  const deleteAsset = (id) => {
      if(confirm("Supprimer définitivement ce bien ?")) {
          setAssets(prev => prev.filter(a => a.id !== id));
          showToast("Bien supprimé", "error");
      }
  };

  const sellAsset = (asset) => {
      const priceStr = prompt(`Prix de vente final pour ${asset.name} (€) :`, asset.value);
      if (priceStr) {
          const price = parseFloat(priceStr);
          if (isNaN(price)) return showToast("Montant invalide", "error");
          addTransaction('in', price, `Vente : ${asset.name}`, null, asset.id);
      }
  };

  // --- ACTIONS FUTURE OPERATIONS ---
  const addFutureOperation = (data) => {
      setFutureOperations(prev => [...prev, { id: Date.now(), ...data, amount: parseFloat(data.amount), received: false }]);
      showToast(data.type === 'in' ? "Rentrée planifiée !" : "Dépense planifiée !");
      setCurrentView('planning');
  };

  const validateFutureOperation = (op) => {
      const realAmountStr = prompt(`Confirmer "${op.label}" ?\nMontant réel (€) :`, op.amount);
      if (realAmountStr) {
          const realAmount = parseFloat(realAmountStr);
          if (isNaN(realAmount)) return showToast("Montant invalide", "error");
          
          // On utilise op.type pour savoir si c'est une entrée ou une sortie
          const type = op.type || 'in'; 
          const prefix = type === 'in' ? 'Revenu' : 'Dépense';
          
          addTransaction(type, realAmount, `${prefix} : ${op.label}`, null, null, op.id);
      }
  };

  const deleteFutureOperation = (id) => {
      if(confirm("Supprimer cette planification ?")) {
          setFutureOperations(prev => prev.filter(i => i.id !== id));
      }
  };

  const resetAll = () => {
      if(confirm("⚠ ATTENTION : RESET USINE ? Tout sera perdu.")) {
          localStorage.removeItem('halalFlow_db_v4');
          window.location.reload();
      }
  };

  // --- CALCULS & PROJECTIONS ---
  const formatMoney = (amount) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount);
  
  const totalAssets = (assets || []).filter(a => a.status === 'active').reduce((sum, item) => sum + Number(item.value), 0); 
  const netWorth = (Number(finance.balance) || 0) + totalAssets;
  const monthlySavings = (Number(finance.income) || 0) - (Number(finance.expenses) || 0);

  // --- PROJECTION CORRIGÉE (Avec Dépenses Futures) ---
  const projectionData = useMemo(() => {
    const data = [];
    const months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
    const today = new Date();
    
    let runningCash = Number(finance.balance) || 0;
    let runningPotential = (Number(finance.balance) || 0) + totalAssets;

    for (let i = 0; i < 12; i++) {
        runningCash += monthlySavings;
        runningPotential += monthlySavings;

        const projDate = new Date(today.getFullYear(), today.getMonth() + i + 1, 1);
        
        futureOperations.forEach(op => {
            if (op.received) return; // Déjà validé, donc déjà dans le cash réel
            
            const opDate = new Date(op.date);
            if (opDate.getMonth() === projDate.getMonth() && opDate.getFullYear() === projDate.getFullYear()) {
                const amount = Number(op.amount);
                // Si c'est une dépense, on soustrait du potentiel
                if (op.type === 'out') {
                    runningPotential -= amount;
                } else {
                    runningPotential += amount;
                }
            }
        });

        const mIndex = (today.getMonth() + i + 1) % 12;
        data.push({
            name: months[mIndex],
            soldeReel: runningCash,
            soldeOptimiste: runningPotential, 
        });
    }
    return data;
  }, [finance.balance, monthlySavings, totalAssets, futureOperations]);

  const historyData = useMemo(() => {
      let bal = Number(finance.balance) || 0;
      const data = [{ date: 'Maintenant', val: bal }];
      
      const sortedTx = [...transactions].sort((a,b) => new Date(b.date) - new Date(a.date));
      
      sortedTx.forEach(tx => {
          bal = tx.type === 'in' ? bal - Number(tx.amount) : bal + Number(tx.amount);
          data.unshift({ date: new Date(tx.date).toLocaleDateString(), val: bal });
      });
      return data;
  }, [finance.balance, transactions]);


  // --- ICONS MAPPING ---
  const IconMap = { Wallet, Heart, Car, Home, Target, Briefcase, Plane, Smartphone, Package };

  // --- VIEWS ---

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium animate-pulse">Chargement de votre espace...</p>
    </div>
  );

  if (!onboarded) return <OnboardingView onFinish={handleOnboarding} />;

  const activeGoals = goals.filter(g => g.status !== 'completed');
  const activeAssets = assets.filter(a => a.status !== 'sold');

  return (
    <div className="flex min-h-screen bg-[#f8fafc] font-sans text-slate-900 selection:bg-emerald-100 relative">
      
      {showMonthlyCheck && (
          <MonthlyCheckModal 
            userName={user.name}
            currentBalance={finance.balance}
            onConfirm={confirmMonthlyBudget}
          />
      )}

      {/* SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200 h-screen sticky top-0 p-6 z-20">
        <div className="flex items-center gap-3 mb-10 px-2">
            <div className="bg-slate-900 text-white p-2 rounded-xl shadow-lg shadow-emerald-900/10">
                <TrendingUp size={24} />
            </div>
            <div>
                <h1 className="font-bold text-lg tracking-tight">My Halal Flow</h1>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Pro</span>
            </div>
        </div>

        <nav className="flex-1 space-y-2">
            <NavItem icon={LayoutDashboard} label="Tableau de bord" active={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')} />
            <NavItem icon={History} label="Historique" active={currentView === 'history'} onClick={() => setCurrentView('history')} />
            <NavItem icon={CalendarPlus} label="Planning Financier" active={currentView === 'planning'} onClick={() => setCurrentView('planning')} />
            <NavItem icon={Settings} label="Budget & Config" active={currentView === 'settings'} onClick={() => setCurrentView('settings')} />
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-100">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                        {(user.name || "U").charAt(0)}
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-bold truncate">{user.name}</p>
                        <p className="text-xs text-slate-500">Free Plan</p>
                    </div>
                </div>
                <button onClick={resetAll} className="w-full text-xs text-slate-400 hover:text-red-500 flex items-center gap-1 mt-2">
                    <LogOut size={12}/> Déconnexion (Reset)
                </button>
            </div>
        </div>
      </aside>

      {/* MOBILE HEADER */}
      <div className="lg:hidden fixed top-0 w-full bg-white/80 backdrop-blur-md z-40 border-b border-slate-200 px-4 py-3 flex justify-between items-center">
         <div className="flex items-center gap-2">
            <div className="bg-slate-900 text-white p-1.5 rounded-lg"><TrendingUp size={18}/></div>
            <span className="font-bold text-sm">My Halal Flow</span>
         </div>
         <button onClick={() => setCurrentView('planning')} className="p-2 bg-slate-100 rounded-full"><CalendarPlus size={18}/></button>
      </div>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-4 lg:p-10 lg:pl-10 mt-14 lg:mt-0 max-w-7xl mx-auto w-full">
        {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

        {currentView === 'dashboard' && (
            <div className="space-y-8 animate-fade-in">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">Vue d'ensemble</h2>
                        <p className="text-slate-500">Bienvenue, voici ta situation financière actuelle.</p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="secondary" onClick={() => { setEditingItem(null); setCurrentView('asset_form'); }}><Package size={16}/> Stock</Button>
                        <Button variant="emerald" onClick={() => setCurrentView('tx_form')}><Plus size={16}/> Transaction</Button>
                    </div>
                </div>

                {/* KPIs Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none relative overflow-hidden group">
                        <div className="relative z-10">
                            <p className="text-slate-400 text-sm font-medium mb-1 flex items-center gap-2">
                                <Wallet size={14}/> Solde Disponible
                            </p>
                            <h3 className="text-4xl font-bold tracking-tight mt-2">{formatMoney(finance.balance)}</h3>
                            <div className="mt-4 flex items-center gap-2 text-xs text-slate-300 bg-white/10 w-fit px-3 py-1 rounded-full backdrop-blur-sm">
                                <TrendingUp size={12} className="text-emerald-400"/>
                                <span>Capacité : +{formatMoney(monthlySavings)}/mois</span>
                            </div>
                        </div>
                        <div className="absolute -right-10 -top-10 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl group-hover:bg-emerald-500/30 transition-all duration-500"></div>
                    </Card>

                    <Card className="p-6 relative overflow-hidden group">
                         <div className="relative z-10">
                            <p className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-1 flex items-center gap-2">
                                <Package size={14}/> Patrimoine Net
                            </p>
                            <h3 className="text-3xl font-bold text-slate-900 mt-2">{formatMoney(netWorth)}</h3>
                            <p className="text-xs text-slate-400 mt-2">Cash + {activeAssets.length} biens en stock</p>
                        </div>
                        <div className="absolute right-4 top-4 text-emerald-100 group-hover:scale-110 transition-transform duration-500">
                            <PieChart size={60} />
                        </div>
                    </Card>

                    <Card className="p-6 flex flex-col justify-center gap-4">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-slate-600">Revenus</span>
                            <span className="font-bold text-emerald-600">+{formatMoney(finance.income)}</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 w-[70%]"></div>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-slate-600">Charges Fixes</span>
                            <span className="font-bold text-red-500">-{formatMoney(finance.expenses)}</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                            <div className="h-full bg-red-500 w-[40%]"></div>
                        </div>
                    </Card>
                </div>

                {/* Graphique Principal */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <Card className="lg:col-span-2 p-6">
                        <div className="flex justify-between items-end mb-6">
                             <div>
                                <h3 className="font-bold text-lg text-slate-800">Trajectoire Financière</h3>
                                <p className="text-sm text-slate-500">Simulation 12 mois (inclut planning)</p>
                             </div>
                             <div className="flex gap-4 text-xs font-medium">
                                 <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>Cash Réel</div>
                                 <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>Potentiel Total</div>
                             </div>
                        </div>
                        <div className="h-[300px] w-full">
                            {mounted ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={projectionData} margin={{top:10, right:0, left:-20, bottom:0}}>
                                        <defs>
                                            <linearGradient id="gradEmerald" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.2}/><stop offset="100%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                                            <linearGradient id="gradBlue" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6" stopOpacity={0.1}/><stop offset="100%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(1)}k` : val} />
                                        <Tooltip 
                                            contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)'}} 
                                            formatter={(val, name) => [formatMoney(val), name === 'soldeReel' ? 'Cash' : 'Patrimoine']}
                                        />
                                        <Area type="monotone" dataKey="soldeOptimiste" stroke="#3b82f6" strokeWidth={3} strokeDasharray="4 4" fill="url(#gradBlue)" />
                                        <Area type="monotone" dataKey="soldeReel" stroke="#10b981" strokeWidth={3} fill="url(#gradEmerald)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full w-full flex items-center justify-center bg-slate-50 rounded-xl"><p className="text-slate-400 text-sm">Chargement...</p></div>
                            )}
                        </div>
                    </Card>

                    <Card className="p-0 flex flex-col">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-slate-800">Derniers flux</h3>
                            <button onClick={() => setCurrentView('history')} className="text-xs font-bold text-emerald-600 hover:underline">Voir tout</button>
                        </div>
                        <div className="flex-1 overflow-y-auto max-h-[300px] p-4 space-y-3 custom-scrollbar">
                            {transactions.length === 0 ? <div className="text-center text-slate-400 py-10 text-sm">Rien à signaler 😴</div> : 
                                transactions.slice(0, 5).map(tx => (
                                    <div key={tx.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors group">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-full ${tx.type === 'in' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                                {tx.type === 'in' ? <ArrowRight className="-rotate-45" size={14}/> : <ArrowRight className="rotate-45" size={14}/>}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-700">{tx.label}</p>
                                                <p className="text-[10px] text-slate-400">{new Date(tx.date).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <span className={`font-bold text-sm ${tx.type === 'in' ? 'text-emerald-600' : 'text-slate-800'}`}>
                                            {tx.type === 'in' ? '+' : '-'}{formatMoney(tx.amount)}
                                        </span>
                                    </div>
                                ))
                            }
                        </div>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Objectifs */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2"><Target className="text-emerald-500"/> Objectifs</h3>
                            <Button variant="ghost" size="sm" onClick={() => { setEditingItem(null); setCurrentView('goal_form'); }}><Plus size={16}/> Ajouter</Button>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            {activeGoals.map(goal => {
                                const progress = Math.min(100, Math.round((finance.balance / goal.target) * 100));
                                const Icon = IconMap[goal.iconKey] || Target;
                                return (
                                    <Card key={goal.id} className="p-5 flex flex-col gap-4 group relative overflow-hidden border-l-4 border-l-transparent hover:border-l-emerald-500">
                                        <div className="flex justify-between items-start z-10">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-3 rounded-xl text-white shadow-md ${goal.color}`}>
                                                    <Icon size={20} />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-800">{goal.name}</h4>
                                                    <p className="text-xs text-slate-500 font-medium">Cible: {formatMoney(goal.target)}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => completeGoal(goal)} className="p-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200" title="Valider l'achat (Objectif atteint)"><Check size={16}/></button>
                                                <button onClick={() => { setEditingItem(goal); setCurrentView('goal_form'); }} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-blue-600"><Pencil size={16}/></button>
                                                <button onClick={() => deleteGoal(goal.id)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-red-600"><Trash2 size={16}/></button>
                                            </div>
                                        </div>
                                        <div className="space-y-2 z-10">
                                            <div className="flex justify-between text-xs font-bold">
                                                <span className="text-slate-400">Progression</span>
                                                <span className={progress >= 100 ? "text-emerald-600" : "text-slate-700"}>{progress}%</span>
                                            </div>
                                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                                <div className={`h-full rounded-full transition-all duration-1000 ease-out ${goal.color}`} style={{width: `${progress}%`}}></div>
                                            </div>
                                        </div>
                                    </Card>
                                )
                            })}
                            {activeGoals.length === 0 && <EmptyState onClick={() => setCurrentView('goal_form')} label="Créer un objectif" />}
                        </div>
                    </div>

                    {/* Stock / Biens */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2"><Package className="text-blue-500"/> Biens & Stock</h3>
                            <Button variant="ghost" size="sm" onClick={() => { setEditingItem(null); setCurrentView('asset_form'); }}><Plus size={16}/> Ajouter</Button>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            {activeAssets.map(asset => (
                                <Card key={asset.id} className="p-4 flex items-center justify-between group hover:bg-slate-50/50 relative">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                            {asset.category === 'Véhicule' ? <Car size={20}/> : asset.category === 'Créance' ? <User size={20}/> : <Box size={20}/>}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800">{asset.name}</h4>
                                            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{asset.category}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="font-bold text-slate-700">{formatMoney(asset.value)}</span>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => sellAsset(asset)} className="p-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200" title="Vendre"><CheckCircle2 size={16}/></button>
                                            <button onClick={() => { setEditingItem(asset); setCurrentView('asset_form'); }} className="p-2 bg-slate-100 text-slate-400 rounded-lg hover:bg-blue-100 hover:text-blue-600"><Pencil size={16}/></button>
                                            <button onClick={() => deleteAsset(asset.id)} className="p-2 bg-slate-100 text-slate-400 rounded-lg hover:bg-red-100 hover:text-red-600"><Trash2 size={16}/></button>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                            {activeAssets.length === 0 && <EmptyState onClick={() => setCurrentView('asset_form')} label="Ajouter un bien" />}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* --- AUTRES VUES --- */}

        {currentView === 'planning' && (
            <div className="animate-fade-in space-y-6">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Button variant="secondary" onClick={() => setCurrentView('dashboard')} className="w-10 h-10 p-0 rounded-full"><ArrowLeft size={20}/></Button>
                        <h2 className="text-2xl font-bold">Planning Financier</h2>
                    </div>
                    <Button onClick={() => setCurrentView('planning_form')}><Plus size={16}/> Planifier</Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="p-6 bg-blue-50 border-blue-100">
                        <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2"><CalendarCheck size={18}/> Comment ça marche ?</h3>
                        <p className="text-sm text-blue-700">Planifie tes rentrées (primes, ventes) et tes grosses dépenses futures. Elles modifient ta courbe de <strong>Potentiel</strong> mais pas ton cash réel tant qu'elles ne sont pas validées.</p>
                    </Card>
                </div>

                <div className="space-y-3">
                    {futureOperations.length === 0 ? <div className="text-center py-10 text-slate-400 italic">Aucune opération planifiée.</div> : 
                        futureOperations.sort((a,b) => new Date(a.date) - new Date(b.date)).map(op => (
                            <Card key={op.id} className={`p-4 flex justify-between items-center group ${op.received ? 'bg-slate-50 border-slate-200 opacity-60' : ''}`}>
                                <div className="flex items-center gap-4">
                                    <div className={`${op.received ? 'bg-slate-200 text-slate-500' : op.type === 'out' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'} p-3 rounded-xl`}>
                                        <Calendar size={20}/>
                                    </div>
                                    <div>
                                        <h4 className={`font-bold ${op.received ? 'text-slate-500 line-through' : 'text-slate-800'}`}>{op.label}</h4>
                                        <p className="text-xs text-slate-500">Prévu pour : {new Date(op.date).toLocaleDateString('fr-FR', {month: 'long', year: 'numeric'})}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className={`font-bold ${op.received ? 'text-slate-500' : op.type === 'out' ? 'text-red-600' : 'text-emerald-600'}`}>
                                        {op.type === 'out' ? '-' : '+'}{formatMoney(op.amount)}
                                    </span>
                                    {op.received ? (
                                        <span className="text-[10px] bg-slate-200 text-slate-500 px-2 py-1 rounded-full font-bold">VALIDÉ</span>
                                    ) : (
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => validateFutureOperation(op)}
                                                className={`p-2 rounded-lg hover:opacity-80 ${op.type === 'out' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}
                                                title="Valider l'opération"
                                            >
                                                <CheckCircle2 size={16}/>
                                            </button>
                                            <button onClick={() => deleteFutureOperation(op.id)} className="text-slate-300 hover:text-red-500 p-2"><Trash2 size={16}/></button>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        ))
                    }
                </div>
            </div>
        )}

        {currentView === 'planning_form' && (
            <FormLayout title="Planifier une opération" onBack={() => setCurrentView('planning')}>
                <FutureOpForm onSubmit={addFutureOperation} onCancel={() => setCurrentView('planning')} />
            </FormLayout>
        )}

        {currentView === 'tx_form' && (
            <FormLayout title="Nouvelle Transaction" onBack={() => setCurrentView('dashboard')}>
                 <TransactionForm onSubmit={(t, a, l) => addTransaction(t, a, l)} onCancel={() => setCurrentView('dashboard')} />
            </FormLayout>
        )}

        {currentView === 'goal_form' && (
            <FormLayout title={editingItem ? "Modifier l'objectif" : "Nouvel Objectif"} onBack={() => { setEditingItem(null); setCurrentView('dashboard'); }}>
                <GoalForm initialData={editingItem} onSubmit={upsertGoal} onCancel={() => { setEditingItem(null); setCurrentView('dashboard'); }} />
            </FormLayout>
        )}

        {currentView === 'asset_form' && (
            <FormLayout title={editingItem ? "Modifier le bien" : "Nouveau Bien / Stock"} onBack={() => { setEditingItem(null); setCurrentView('dashboard'); }}>
                <AssetForm initialData={editingItem} onSubmit={upsertAsset} onCancel={() => { setEditingItem(null); setCurrentView('dashboard'); }} />
            </FormLayout>
        )}

        {currentView === 'settings' && (
            <FormLayout title="Configuration du Budget" onBack={() => setCurrentView('dashboard')}>
                 <div className="space-y-6">
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                        <h3 className="font-bold mb-4 flex items-center gap-2"><Settings size={18}/> Paramètres Mensuels</h3>
                        <div className="space-y-4">
                            <InputGroup label="Revenus Mensuels (€)" type="number" value={finance.income} onChange={(e) => setFinance({...finance, income: parseFloat(e.target.value) || 0})} />
                            <InputGroup label="Dépenses Fixes (€)" type="number" value={finance.expenses} onChange={(e) => setFinance({...finance, expenses: parseFloat(e.target.value) || 0})} />
                        </div>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-xl text-blue-800 text-sm flex items-start gap-3">
                        <AlertCircle size={20} className="shrink-0 mt-0.5"/>
                        <p>Ces montants servent uniquement à calculer la projection future. Ils ne modifient pas le solde actuel automatiquement.</p>
                    </div>
                 </div>
            </FormLayout>
        )}

        {currentView === 'history' && (
            <div className="animate-fade-in space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="secondary" onClick={() => setCurrentView('dashboard')} className="w-10 h-10 p-0 rounded-full"><ArrowLeft size={20}/></Button>
                    <h2 className="text-2xl font-bold">Historique Complet</h2>
                </div>
                
                <Card className="p-6">
                    <div className="h-[200px] w-full">
                        {mounted && (
                         <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={historyData}>
                                <defs>
                                    <linearGradient id="gradHist" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#64748b" stopOpacity={0.2}/><stop offset="100%" stopColor="#64748b" stopOpacity={0}/></linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <Tooltip contentStyle={{borderRadius: '8px'}} formatter={(val) => [formatMoney(val), "Solde"]} />
                                <Area type="monotone" dataKey="val" stroke="#64748b" strokeWidth={2} fill="url(#gradHist)" />
                            </AreaChart>
                        </ResponsiveContainer>
                        )}
                    </div>
                </Card>

                <div className="space-y-2">
                    {transactions.sort((a,b) => new Date(b.date) - new Date(a.date)).map(tx => (
                        <Card key={tx.id} className="p-4 flex justify-between items-center group">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-xl font-bold text-xs ${tx.type === 'in' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                    {tx.type === 'in' ? 'IN' : 'OUT'}
                                </div>
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                        <p className="font-bold text-slate-900">{tx.label}</p>
                                        {tx.relatedGoalId && (
                                            <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium flex items-center gap-1">
                                                <Target size={10}/> Objectif atteint
                                            </span>
                                        )}
                                        {tx.relatedAssetId && (
                                            <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-medium flex items-center gap-1">
                                                <Package size={10}/> Vente Stock
                                            </span>
                                        )}
                                        {tx.relatedOpId && (
                                            <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-medium flex items-center gap-1">
                                                <CalendarCheck size={10}/> Planifié
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-400">{new Date(tx.date).toLocaleDateString()} • {new Date(tx.date).toLocaleTimeString()}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <span className={`font-bold ${tx.type === 'in' ? 'text-emerald-600' : 'text-slate-900'}`}>
                                    {tx.type === 'in' ? '+' : '-'}{formatMoney(tx.amount)}
                                </span>
                                <button onClick={() => deleteTransaction(tx.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={16}/></button>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        )}

      </main>
    </div>
  );
}

// --- SOUS-COMPOSANTS ---

const MonthlyCheckModal = ({ userName, currentBalance, onConfirm }) => {
    const [balance, setBalance] = useState(currentBalance);
    const [step, setStep] = useState(1);

    const handleUpdate = () => {
        onConfirm(balance);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-fade-in">
            <Card className="w-full max-w-md p-8 shadow-2xl m-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-400 to-blue-500"></div>
                
                {step === 1 ? (
                    <div className="text-center space-y-6">
                        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto text-blue-600">
                            <CalendarCheck size={32} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">Salam, {userName || "l'ami"} !</h3>
                            <p className="text-slate-500 mt-2">Nouveau mois ! Est-ce que ton solde réel en banque est bien de :</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <span className="block text-slate-500 text-xs uppercase font-bold mb-1">Solde Actuel</span>
                            <span className="block text-3xl font-bold text-slate-900">{currentBalance} €</span>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="secondary" onClick={() => setStep(2)} className="flex-1">Non, corriger</Button>
                            <Button variant="emerald" onClick={() => onConfirm(currentBalance)} className="flex-1 gap-2"><ThumbsUp size={16}/> Oui, c'est bon</Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6 animate-slide-up">
                        <div className="flex items-center gap-3 mb-2">
                            <button onClick={() => setStep(1)} className="p-1 hover:bg-slate-100 rounded-full"><ArrowLeft size={18}/></button>
                            <h3 className="font-bold text-lg">Corriger le Solde</h3>
                        </div>
                        <p className="text-sm text-slate-500">Rentre le montant exact que tu vois sur ton compte bancaire aujourd'hui.</p>
                        <InputGroup label="Vrai Solde (€)" type="number" value={balance} onChange={(e) => setBalance(e.target.value)} />
                        <Button className="w-full mt-4" onClick={handleUpdate}>Valider et Ajuster</Button>
                    </div>
                )}
            </Card>
        </div>
    );
};

const NavItem = ({ icon: Icon, label, active, onClick }) => (
    <button 
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${active ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
    >
        <Icon size={18} className={active ? "text-emerald-400" : ""} />
        {label}
        {active && <ChevronRight size={14} className="ml-auto opacity-50"/>}
    </button>
);

const EmptyState = ({ label, onClick }) => (
    <button onClick={onClick} className="w-full border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center gap-2 text-slate-400 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50/50 transition-all group">
        <Plus size={24} className="group-hover:scale-110 transition-transform"/>
        <span className="text-sm font-medium">{label}</span>
    </button>
);

const FormLayout = ({ title, onBack, children }) => (
    <div className="max-w-xl mx-auto animate-slide-up">
        <div className="flex items-center gap-4 mb-8">
            <Button variant="secondary" onClick={onBack} className="w-10 h-10 p-0 rounded-full"><ArrowLeft size={20}/></Button>
            <h2 className="text-2xl font-bold">{title}</h2>
        </div>
        {children}
    </div>
);

const TransactionForm = ({ onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({ type: 'out', amount: '', label: '' });
    return (
        <Card className="p-8 space-y-6">
            <div className="flex bg-slate-100 p-1 rounded-xl">
                {['in', 'out'].map(t => (
                    <button key={t} onClick={() => setFormData({...formData, type: t})} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${formData.type === t ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>
                        {t === 'in' ? 'Revenu (+)' : 'Dépense (-)'}
                    </button>
                ))}
            </div>
            <InputGroup label="Montant (€)" type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} placeholder="0.00" />
            <InputGroup label="Libellé" value={formData.label} onChange={e => setFormData({...formData, label: e.target.value})} placeholder="Ex: Salaire, Courses..." />
            <div className="flex gap-3 pt-4">
                <Button variant="secondary" className="flex-1" onClick={onCancel}>Annuler</Button>
                <Button variant={formData.type === 'in' ? 'emerald' : 'primary'} className="flex-1" onClick={() => onSubmit(formData.type, formData.amount, formData.label)}>Valider</Button>
            </div>
        </Card>
    );
};

const FutureOpForm = ({ onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({ type: 'in', amount: '', label: '', date: '' });
    return (
        <Card className="p-8 space-y-6">
            <div className="flex bg-slate-100 p-1 rounded-xl">
                {['in', 'out'].map(t => (
                    <button key={t} onClick={() => setFormData({...formData, type: t})} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${formData.type === t ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>
                        {t === 'in' ? 'Entrée prévue (+)' : 'Sortie prévue (-)'}
                    </button>
                ))}
            </div>
            <InputGroup label="Libellé" value={formData.label} onChange={e => setFormData({...formData, label: e.target.value})} placeholder={formData.type === 'in' ? "Ex: Prime, Vente..." : "Ex: Impôts, Facture..."} />
            <InputGroup label="Montant Prévu (€)" type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} placeholder="0.00" />
            <InputGroup label="Date prévue" type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
            <div className="flex gap-3 pt-4">
                <Button variant="secondary" className="flex-1" onClick={onCancel}>Annuler</Button>
                <Button variant={formData.type === 'in' ? 'emerald' : 'primary'} className="flex-1" onClick={() => onSubmit(formData)} disabled={!formData.amount || !formData.date}>Planifier</Button>
            </div>
        </Card>
    );
};

const GoalForm = ({ initialData, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState(initialData || { name: '', target: '', iconKey: 'Target', color: 'bg-slate-900' });
    const colors = ["bg-emerald-500", "bg-blue-600", "bg-purple-500", "bg-amber-500", "bg-pink-500", "bg-slate-900"];
    const icons = ["Target", "Car", "Home", "Heart", "Wallet", "Plane", "Smartphone", "Briefcase"];
    const IconMap = { Target, Car, Home, Heart, Wallet, Plane, Smartphone, Briefcase };

    return (
        <Card className="p-8 space-y-6">
            <InputGroup label="Nom du Projet" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            <InputGroup label="Montant Cible (€)" type="number" value={formData.target} onChange={e => setFormData({...formData, target: e.target.value})} />
            
            <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Couleur</label>
                <div className="flex gap-3">
                    {colors.map(c => <button key={c} onClick={() => setFormData({...formData, color: c})} className={`w-8 h-8 rounded-full ${c} transition-transform ${formData.color === c ? 'scale-110 ring-2 ring-offset-2 ring-slate-300' : 'opacity-50 hover:opacity-100'}`} />)}
                </div>
            </div>

            <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Icône</label>
                <div className="grid grid-cols-4 gap-2">
                    {icons.map(k => {
                        const I = IconMap[k];
                        return <button key={k} onClick={() => setFormData({...formData, iconKey: k})} className={`p-3 rounded-xl flex justify-center transition-all ${formData.iconKey === k ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-200'}`}><I size={20} /></button>
                    })}
                </div>
            </div>

            <div className="flex gap-3 pt-4">
                <Button variant="secondary" className="flex-1" onClick={onCancel}>Annuler</Button>
                <Button className="flex-1" onClick={() => onSubmit(formData)}>{initialData ? 'Mettre à jour' : 'Créer'}</Button>
            </div>
        </Card>
    );
};

const AssetForm = ({ initialData, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState(initialData || { name: '', value: '', category: 'Autre' });
    return (
        <Card className="p-8 space-y-6">
            <InputGroup label="Nom du bien / Créance" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            <InputGroup label="Valeur Estimée (€)" type="number" value={formData.value} onChange={e => setFormData({...formData, value: e.target.value})} />
            <InputGroup label="Catégorie" options={[{value:'Autre', label:'Autre'}, {value:'Véhicule', label:'Véhicule'}, {value:'High-Tech', label:'High-Tech'}, {value:'Créance', label:'Créance (Dette)'}]} value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
            <div className="flex gap-3 pt-4">
                <Button variant="secondary" className="flex-1" onClick={onCancel}>Annuler</Button>
                <Button className="flex-1" onClick={() => onSubmit(formData)}>{initialData ? 'Mettre à jour' : 'Ajouter au stock'}</Button>
            </div>
        </Card>
    );
};

const OnboardingView = ({ onFinish }) => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({ pseudo: '', balance: '', income: '', expenses: '' });
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
            <Card className="w-full max-w-lg p-10 shadow-2xl animate-scale-in">
                <div className="text-center mb-10">
                    <div className="bg-slate-900 text-white w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-slate-900/20">
                        <TrendingUp size={40} />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900">Bienvenue</h1>
                    <p className="text-slate-500 mt-2 text-lg">Configurons ton espace My Halal Flow.</p>
                </div>
                {step === 1 ? (
                    <div className="space-y-6 animate-fade-in">
                        <InputGroup label="Ton Prénom" icon={User} value={formData.pseudo} onChange={e => setFormData({...formData, pseudo: e.target.value})} placeholder="Ex: Yassine" />
                        <InputGroup label="Solde Actuel (€)" icon={Wallet} type="number" value={formData.balance} onChange={e => setFormData({...formData, balance: e.target.value})} placeholder="0.00" />
                        <Button className="w-full mt-4" size="lg" onClick={() => setStep(2)} disabled={!formData.pseudo || !formData.balance}>Suivant <ArrowRight/></Button>
                    </div>
                ) : (
                    <div className="space-y-6 animate-fade-in">
                        <InputGroup label="Revenus Mensuels (€)" icon={TrendingUp} type="number" value={formData.income} onChange={e => setFormData({...formData, income: e.target.value})} placeholder="Salaire + Primes" />
                        <InputGroup label="Charges Fixes (€)" icon={Target} type="number" value={formData.expenses} onChange={e => setFormData({...formData, expenses: e.target.value})} placeholder="Loyer + Factures" />
                        <div className="flex gap-3 mt-8">
                            <Button variant="secondary" onClick={() => setStep(1)}>Retour</Button>
                            <Button className="flex-1" size="lg" onClick={() => onFinish(formData)} disabled={!formData.income || !formData.expenses}>Commencer</Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
};