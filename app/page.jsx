'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  Wallet,
  TrendingUp,
  TrendingDown,
  Target,
  Landmark,
  CalendarClock,
  Plus,
  Trash2,
  MoreHorizontal,
  X,
  ArrowRightLeft
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

import {
  getHalalFlowData,
  addTransactionAction,
  deleteTransactionAction,
  upsertAssetAction,
  deleteAssetAction,
  upsertGoalAction,
  deleteGoalAction,
  addFutureOpAction,
  deleteFutureOpAction
} from './actions';

// --- Utility Functions ---

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2
  }).format(Number(amount) || 0);
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  // Handle both ISO strings and Date objects if serialization changes
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

// --- Sub-Components ---

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-xl border border-slate-200 shadow-sm ${className}`}>
    {children}
  </div>
);

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h3 className="font-semibold text-lg text-slate-800">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, amount, icon: Icon, trend, colorClass }) => (
  <Card className="p-6 flex items-start justify-between hover:shadow-md transition-shadow">
    <div>
      <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-slate-900">{formatCurrency(amount)}</h3>
      {trend && <p className={`text-xs mt-2 ${trend > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
        {trend > 0 ? '+' : ''}{trend}% vs mois dernier
      </p>}
    </div>
    <div className={`p-3 rounded-lg ${colorClass}`}>
      <Icon size={24} className="opacity-80" />
    </div>
  </Card>
);

const EmptyState = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-12 text-slate-400">
    <LayoutDashboard size={48} className="mb-4 opacity-20" />
    <p>{message}</p>
  </div>
);

// --- Main Page Component ---

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Modal States
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [isFutureModalOpen, setIsFutureModalOpen] = useState(false);

  // Form States
  const [txForm, setTxForm] = useState({ amount: '', label: '', type: 'expense', date: new Date().toISOString().split('T')[0] });
  const [goalForm, setGoalForm] = useState({ name: '', targetAmount: '', iconKey: 'Target' });
  const [assetForm, setAssetForm] = useState({ name: '', value: '', category: 'Autre' });
  const [futureForm, setFutureForm] = useState({ amount: '', label: '', type: 'expense', date: '' });

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getHalalFlowData();
      if (!result) throw new Error("Aucune donnée reçue du serveur");
      setData(result);
    } catch (err) {
      console.error("Load Error:", err);
      setError(err.message || "Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // -- Handlers --

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    try {
      await addTransactionAction({
        amount: Number(txForm.amount),
        label: txForm.label,
        type: txForm.type,
        date: new Date(txForm.date)
      });
      setIsTxModalOpen(false);
      setTxForm({ amount: '', label: '', type: 'expense', date: new Date().toISOString().split('T')[0] });
      loadData();
    } catch (err) {
      alert("Erreur: " + err.message);
    }
  };

  const handleDeleteTransaction = async (id) => {
    if (confirm('Supprimer cette transaction ?')) {
      try {
        await deleteTransactionAction(id);
        loadData();
      } catch (err) {
        alert("Erreur: " + err.message);
      }
    }
  };

  const handleAddGoal = async (e) => {
    e.preventDefault();
    try {
      await upsertGoalAction({
        name: goalForm.name,
        targetAmount: Number(goalForm.targetAmount),
        iconKey: goalForm.iconKey
      });
      setIsGoalModalOpen(false);
      setGoalForm({ name: '', targetAmount: '', iconKey: 'Target' });
      loadData();
    } catch (err) {
      alert("Erreur: " + err.message);
    }
  };

  const handleDeleteGoal = async (id) => {
    if (confirm('Supprimer cet objectif ?')) {
      await deleteGoalAction(id);
      loadData();
    }
  };

  const handleAddAsset = async (e) => {
    e.preventDefault();
    try {
      await upsertAssetAction({
        name: assetForm.name,
        value: Number(assetForm.value),
        category: assetForm.category
      });
      setIsAssetModalOpen(false);
      setAssetForm({ name: '', value: '', category: 'Autre' });
      loadData();
    } catch (err) {
      alert("Erreur: " + err.message);
    }
  };

  const handleDeleteAsset = async (id) => {
    if (confirm('Supprimer cet actif ?')) {
      await deleteAssetAction(id);
      loadData();
    }
  };

  const handleAddFutureOp = async (e) => {
    e.preventDefault();
    try {
      await addFutureOpAction({
        amount: Number(futureForm.amount),
        label: futureForm.label,
        type: futureForm.type,
        date: new Date(futureForm.date)
      });
      setIsFutureModalOpen(false);
      setFutureForm({ amount: '', label: '', type: 'expense', date: '' });
      loadData();
    } catch (err) {
      alert("Erreur: " + err.message);
    }
  };

  const handleDeleteFutureOp = async (id) => {
    await deleteFutureOpAction(id);
    loadData();
  };

  // -- Charts Data --
  const chartData = useMemo(() => {
    if (!data?.transactions) return [];
    const grouped = data.transactions.reduce((acc, t) => {
      const dateObj = new Date(t.date);
      if (isNaN(dateObj)) return acc;
      const month = dateObj.toLocaleString('fr-FR', { month: 'short' });
      if (!acc[month]) acc[month] = { name: month, income: 0, expense: 0 };
      if (t.type === 'income') acc[month].income += Number(t.amount);
      else acc[month].expense += Number(t.amount);
      return acc;
    }, {});
    return Object.values(grouped);
  }, [data?.transactions]);

  // -- Render --

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md text-center">
          <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X size={32} className="text-rose-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Erreur Serveur</h2>
          <p className="text-slate-600 mb-4">{error}</p>
          <button onClick={loadData} className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition">
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  const { user, transactions, goals, assets, futureOps } = data || {};

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">

      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
            <Wallet size={18} className="text-white" />
          </div>
          <span className="font-bold text-slate-900">HalalFlow</span>
        </div>
        <button onClick={() => setActiveTab('overview')} className="p-2 border rounded">
          <LayoutDashboard size={20} />
        </button>
      </div>

      {/* Sidebar */}
      <nav className="fixed top-0 left-0 h-full w-20 lg:w-64 bg-slate-900 text-slate-300 flex flex-col z-40 hidden md:flex">
        <div className="p-6 flex items-center gap-3 text-white mb-6">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
            <Wallet size={18} className="text-white" />
          </div>
          <span className="font-bold text-lg hidden lg:block tracking-tight">HalalFlow</span>
        </div>
        <div className="flex-1 px-4 space-y-2">
          {[
            { id: 'overview', icon: LayoutDashboard, label: 'Vue d\'ensemble' },
            { id: 'transactions', icon: ArrowRightLeft, label: 'Transactions' },
            { id: 'goals', icon: Target, label: 'Objectifs' },
            { id: 'assets', icon: Landmark, label: 'Patrimoine' },
            { id: 'future', icon: CalendarClock, label: 'Prévisionnel' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                activeTab === item.id
                  ? 'bg-emerald-500/10 text-emerald-400 font-medium'
                  : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              <span className="hidden lg:block">{item.label}</span>
            </button>
          ))}
        </div>
        <div className="p-4 mt-auto border-t border-slate-800">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="hidden lg:block">
              <p className="text-sm font-medium text-white">{user?.name || 'Utilisateur'}</p>
              <p className="text-xs text-slate-500">Compte Principal</p>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="md:pl-20 lg:pl-64 min-h-screen p-4 lg:p-8">

        {/* Top Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {activeTab === 'overview' && 'Tableau de bord'}
              {activeTab === 'transactions' && 'Transactions'}
              {activeTab === 'goals' && 'Objectifs'}
              {activeTab === 'assets' && 'Patrimoine'}
              {activeTab === 'future' && 'Prévisionnel'}
            </h1>
          </div>
          <div className="flex gap-2">
             {activeTab === 'transactions' && (
                <button onClick={() => setIsTxModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg">
                  <Plus size={18} /> <span>Ajouter</span>
                </button>
             )}
          </div>
        </header>

        {/* --- TABS CONTENT --- */}

        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard title="Solde" amount={user?.balance || 0} icon={Wallet} colorClass="bg-blue-100 text-blue-600" />
              <StatCard title="Revenus (Mois)" amount={user?.monthlyIncome || 0} icon={TrendingUp} colorClass="bg-emerald-100 text-emerald-600" />
              <StatCard title="Dépenses (Mois)" amount={user?.monthlyExpenses || 0} icon={TrendingDown} colorClass="bg-rose-100 text-rose-600" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="lg:col-span-2 p-6 h-[400px]">
                <h3 className="font-bold text-slate-800 mb-6">Évolution</h3>
                <ResponsiveContainer width="100%" height="90%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip />
                      <Bar dataKey="income" fill="#10B981" radius={[4,4,0,0]} />
                      <Bar dataKey="expense" fill="#F43F5E" radius={[4,4,0,0]} />
                    </BarChart>
                </ResponsiveContainer>
              </Card>

              <Card className="p-0 overflow-hidden flex flex-col h-[400px]">
                 <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800">Dernières opérations</h3>
                    <button onClick={() => setActiveTab('transactions')} className="text-xs text-emerald-600 font-bold">Voir tout</button>
                 </div>
                 <div className="flex-1 overflow-y-auto p-2">
                    {transactions?.slice(0, 5).map(t => (
                      <div key={t.id} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-lg">
                         <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${t.type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                               {t.type === 'income' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                            </div>
                            <div>
                               <p className="text-sm font-bold text-slate-900">{t.label}</p>
                               <p className="text-xs text-slate-500">{formatDate(t.date)}</p>
                            </div>
                         </div>
                         <span className={`text-sm font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-slate-900'}`}>
                            {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                         </span>
                      </div>
                    ))}
                    {!transactions?.length && <EmptyState message="Aucune transaction" />}
                 </div>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
           <Card className="overflow-hidden">
             <div className="overflow-x-auto">
               <table className="w-full text-left">
                 <thead className="bg-slate-50 border-b border-slate-200">
                   <tr>
                     <th className="p-4 text-xs uppercase text-slate-500">Date</th>
                     <th className="p-4 text-xs uppercase text-slate-500">Libellé</th>
                     <th className="p-4 text-xs uppercase text-slate-500">Montant</th>
                     <th className="p-4 text-xs uppercase text-slate-500 text-center">Action</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {transactions?.map(t => (
                     <tr key={t.id} className="hover:bg-slate-50">
                       <td className="p-4 text-sm text-slate-600">{formatDate(t.date)}</td>
                       <td className="p-4 text-sm font-bold text-slate-900">{t.label}</td>
                       <td className={`p-4 text-sm font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-slate-900'}`}>
                         {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                       </td>
                       <td className="p-4 text-center">
                         <button onClick={() => handleDeleteTransaction(t.id)} className="text-slate-400 hover:text-rose-500">
                           <Trash2 size={16} />
                         </button>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
               {!transactions?.length && <EmptyState message="Aucune transaction" />}
             </div>
           </Card>
        )}

        {activeTab === 'goals' && (
          <>
            <div className="flex justify-end mb-6">
               <button onClick={() => setIsGoalModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg">
                 <Plus size={18} /> <span>Ajouter</span>
               </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {goals?.map(g => (
                <Card key={g.id} className="p-6 relative group">
                   <button onClick={() => handleDeleteGoal(g.id)} className="absolute top-4 right-4 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition">
                      <Trash2 size={16} />
                   </button>
                   <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-slate-900 text-white rounded-xl"><Target size={24} /></div>
                      <div>
                        <h3 className="font-bold text-slate-900">{g.name}</h3>
                        <p className="text-sm text-slate-500">Cible: {formatCurrency(g.targetAmount)}</p>
                      </div>
                   </div>
                   <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full" style={{ width: '0%' }}></div>
                   </div>
                   <p className="text-xs text-right mt-1 text-slate-500">0%</p>
                </Card>
              ))}
            </div>
            {!goals?.length && <EmptyState message="Aucun objectif" />}
          </>
        )}

        {activeTab === 'assets' && (
          <>
            <div className="flex justify-end mb-6">
               <button onClick={() => setIsAssetModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg">
                 <Plus size={18} /> <span>Ajouter</span>
               </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {assets?.map(a => (
                <Card key={a.id} className="p-6 border-l-4 border-emerald-500 relative">
                   <button onClick={() => handleDeleteAsset(a.id)} className="absolute top-4 right-4 text-slate-300 hover:text-rose-500">
                      <Trash2 size={16} />
                   </button>
                   <p className="text-xs font-bold text-emerald-600 uppercase mb-1">{a.category}</p>
                   <h3 className="text-xl font-bold text-slate-900">{a.name}</h3>
                   <p className="text-2xl text-slate-700 mt-2 font-mono">{formatCurrency(a.value)}</p>
                </Card>
              ))}
            </div>
            {!assets?.length && <EmptyState message="Aucun actif" />}
          </>
        )}

        {activeTab === 'future' && (
          <>
             <div className="flex justify-end mb-6">
               <button onClick={() => setIsFutureModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg">
                 <Plus size={18} /> <span>Planifier</span>
               </button>
            </div>
            <div className="space-y-4">
               {futureOps?.map(op => (
                 <Card key={op.id} className="p-4 flex items-center justify-between border-l-4 border-indigo-500">
                    <div className="flex items-center gap-4">
                       <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><CalendarClock size={20} /></div>
                       <div>
                          <p className="font-bold text-slate-900">{op.label}</p>
                          <p className="text-sm text-slate-500">{formatDate(op.date)}</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-4">
                       <span className="font-bold font-mono text-slate-700">{formatCurrency(op.amount)}</span>
                       <button onClick={() => handleDeleteFutureOp(op.id)} className="text-slate-400 hover:text-rose-500"><Trash2 size={18} /></button>
                    </div>
                 </Card>
               ))}
               {!futureOps?.length && <EmptyState message="Aucune opération future" />}
            </div>
          </>
        )}

      </main>

      {/* --- MODALS --- */}
      <Modal isOpen={isTxModalOpen} onClose={() => setIsTxModalOpen(false)} title="Nouvelle Transaction">
         <form onSubmit={handleAddTransaction} className="space-y-4">
            <input type="number" step="0.01" required placeholder="Montant" className="w-full p-3 border rounded-lg" value={txForm.amount} onChange={e => setTxForm({...txForm, amount: e.target.value})} />
            <input type="text" required placeholder="Libellé" className="w-full p-3 border rounded-lg" value={txForm.label} onChange={e => setTxForm({...txForm, label: e.target.value})} />
            <div className="grid grid-cols-2 gap-4">
               <select className="w-full p-3 border rounded-lg" value={txForm.type} onChange={e => setTxForm({...txForm, type: e.target.value})}>
                  <option value="expense">Dépense</option>
                  <option value="income">Revenu</option>
               </select>
               <input type="date" required className="w-full p-3 border rounded-lg" value={txForm.date} onChange={e => setTxForm({...txForm, date: e.target.value})} />
            </div>
            <button className="w-full py-3 bg-slate-900 text-white font-bold rounded-lg">Valider</button>
         </form>
      </Modal>

      <Modal isOpen={isGoalModalOpen} onClose={() => setIsGoalModalOpen(false)} title="Nouvel Objectif">
         <form onSubmit={handleAddGoal} className="space-y-4">
            <input type="text" required placeholder="Nom" className="w-full p-3 border rounded-lg" value={goalForm.name} onChange={e => setGoalForm({...goalForm, name: e.target.value})} />
            <input type="number" step="0.01" required placeholder="Montant Cible" className="w-full p-3 border rounded-lg" value={goalForm.targetAmount} onChange={e => setGoalForm({...goalForm, targetAmount: e.target.value})} />
            <button className="w-full py-3 bg-slate-900 text-white font-bold rounded-lg">Créer</button>
         </form>
      </Modal>

      <Modal isOpen={isAssetModalOpen} onClose={() => setIsAssetModalOpen(false)} title="Ajouter Actif">
         <form onSubmit={handleAddAsset} className="space-y-4">
            <input type="text" required placeholder="Nom" className="w-full p-3 border rounded-lg" value={assetForm.name} onChange={e => setAssetForm({...assetForm, name: e.target.value})} />
            <input type="number" step="0.01" required placeholder="Valeur" className="w-full p-3 border rounded-lg" value={assetForm.value} onChange={e => setAssetForm({...assetForm, value: e.target.value})} />
            <select className="w-full p-3 border rounded-lg" value={assetForm.category} onChange={e => setAssetForm({...assetForm, category: e.target.value})}>
               <option value="Autre">Autre</option>
               <option value="Immobilier">Immobilier</option>
               <option value="Bourse">Bourse</option>
               <option value="Épargne">Épargne</option>
               <option value="Or/Argent">Or/Argent</option>
            </select>
            <button className="w-full py-3 bg-emerald-600 text-white font-bold rounded-lg">Ajouter</button>
         </form>
      </Modal>

      <Modal isOpen={isFutureModalOpen} onClose={() => setIsFutureModalOpen(false)} title="Planifier">
         <form onSubmit={handleAddFutureOp} className="space-y-4">
            <input type="text" required placeholder="Libellé" className="w-full p-3 border rounded-lg" value={futureForm.label} onChange={e => setFutureForm({...futureForm, label: e.target.value})} />
            <input type="number" step="0.01" required placeholder="Montant" className="w-full p-3 border rounded-lg" value={futureForm.amount} onChange={e => setFutureForm({...futureForm, amount: e.target.value})} />
            <div className="grid grid-cols-2 gap-4">
                <input type="date" required className="w-full p-3 border rounded-lg" value={futureForm.date} onChange={e => setFutureForm({...futureForm, date: e.target.value})} />
                <select className="w-full p-3 border rounded-lg" value={futureForm.type} onChange={e => setFutureForm({...futureForm, type: e.target.value})}>
                  <option value="expense">Dépense</option>
                  <option value="income">Revenu</option>
                </select>
            </div>
            <button className="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg">Planifier</button>
         </form>
      </Modal>

    </div>
  );
}
