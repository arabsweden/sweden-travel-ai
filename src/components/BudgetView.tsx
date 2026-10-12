import React, { useState, useEffect } from 'react';
import { 
  Calculator,
  Plus, 
  Trash2, 
  DollarSign, 
  TrendingUp, 
  CheckCircle,
  WifiOff,
  Bookmark,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';

interface BudgetViewProps {
  language: Language;
  user: any;
  onBack: () => void;
  onLogin: () => void;
}

interface BudgetItem {
  id: string;
  category: string;
  amount: number;
  notes?: string;
}

const PRESETS = {
  backpacker: {
    name: { en: 'Backpacker Preset (Minimalist)', sv: 'Backpacker-förval (Minimalistisk)', ar: 'مسبق الظهر (اقتصادي)' },
    limit: 10000,
    items: [
      { category: 'Hotels/Hostels', amount: 3500 },
      { category: 'Flights/Transport', amount: 2500 },
      { category: 'Food/Dining', amount: 2000 },
      { category: 'Activities', amount: 1200 },
      { category: 'Shopping', amount: 500 },
      { category: 'Others', amount: 300 },
    ]
  },
  standard: {
    name: { en: 'Standard Preset (Balanced)', sv: 'Standard-förval (Balanserad)', ar: 'مسبق قياسي (متوازن)' },
    limit: 25000,
    items: [
      { category: 'Hotels/Hostels', amount: 9500 },
      { category: 'Flights/Transport', amount: 6000 },
      { category: 'Food/Dining', amount: 5000 },
      { category: 'Activities', amount: 2500 },
      { category: 'Shopping', amount: 1200 },
      { category: 'Others', amount: 800 },
    ]
  },
  luxury: {
    name: { en: 'Luxury Preset (Premium)', sv: 'Lyx-förval (Premium)', ar: 'مسبق فاخر (ممتاز)' },
    limit: 60000,
    items: [
      { category: 'Hotels/Hostels', amount: 24000 },
      { category: 'Flights/Transport', amount: 14000 },
      { category: 'Food/Dining', amount: 11000 },
      { category: 'Activities', amount: 6000 },
      { category: 'Shopping', amount: 3500 },
      { category: 'Others', amount: 1500 },
    ]
  }
};

const COLORS = [
  '#004B87', // Scandi Blue
  '#1E3A8A', // Deep Blue
  '#F59E0B', // Amber Yellow
  '#10B981', // Emerald Green
  '#EC4899', // Pink
  '#64748B'  // Slate Grey
];

const FALLBACK_RATES: { [key: string]: number } = {
  USD: 0.095,
  EUR: 0.088,
  GBP: 0.075,
  CAD: 0.13,
  AUD: 0.14,
  SAR: 0.36,
  AED: 0.35,
  JPY: 14.5,
  INR: 7.9,
  SEK: 1.0
};

const CURRENCY_SYMBOLS: { [key: string]: string } = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  CAD: 'C$',
  AUD: 'A$',
  SAR: 'SR',
  AED: 'AED',
  JPY: '¥',
  INR: '₹',
  SEK: 'kr'
};

export default function BudgetView({
  language,
  user,
  onBack,
  onLogin
}: BudgetViewProps) {
  const t = TRANSLATIONS[language];
  const isRtl = language === 'ar';

  const [budgetLimit, setBudgetLimit] = useState<number>(25000);
  const [items, setItems] = useState<BudgetItem[]>([
    { id: '1', category: 'Hotels/Hostels', amount: 9500, notes: 'Comfortable hotel stay' },
    { id: '2', category: 'Flights/Transport', amount: 6000, notes: 'Flights and trains (SJ)' },
    { id: '3', category: 'Food/Dining', amount: 5000, notes: 'Meals and Swedish Fika' },
    { id: '4', category: 'Activities', amount: 2500, notes: 'Vasa Museum & Archipelagos' },
    { id: '5', category: 'Shopping', amount: 1200, notes: 'Souvenirs and Swedish snacks' },
    { id: '6', category: 'Others', amount: 800, notes: 'Emergency funds / misc' }
  ]);

  const [newCategory, setNewCategory] = useState('Hotels/Hostels');
  const [newAmount, setNewAmount] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Currency Converter States
  const [homeCurrency, setHomeCurrency] = useState<string>(() => {
    return localStorage.getItem('sweden_home_currency') || 'USD';
  });
  const [exchangeRates, setExchangeRates] = useState<{ [key: string]: number }>(FALLBACK_RATES);
  const [isLoadingRates, setIsLoadingRates] = useState<boolean>(false);
  const [liveRatesActive, setLiveRatesActive] = useState<boolean>(false);

  // Other premium tools states preserved for parity
  const [offlineMode, setOfflineMode] = useState(false);
  const [savedItems, setSavedItems] = useState<any[]>([]);
  const [isLoadingFavs, setIsLoadingFavs] = useState(false);

  useEffect(() => {
    const fetchExchangeRates = async () => {
      setIsLoadingRates(true);
      try {
        const response = await fetch('https://open.er-api.com/v6/latest/SEK');
        if (!response.ok) throw new Error('Failed to fetch exchange rates');
        const data = await response.json();
        if (data && data.rates) {
          const updatedRates = { ...FALLBACK_RATES };
          Object.keys(FALLBACK_RATES).forEach(cur => {
            if (data.rates[cur]) {
              updatedRates[cur] = data.rates[cur];
            }
          });
          setExchangeRates(updatedRates);
          setLiveRatesActive(true);
        }
      } catch (err) {
        console.error('Could not load live exchange rates, using fallback rates:', err);
        setLiveRatesActive(false);
      } finally {
        setIsLoadingRates(false);
      }
    };

    fetchExchangeRates();
  }, []);

  useEffect(() => {
    localStorage.setItem('sweden_home_currency', homeCurrency);
  }, [homeCurrency]);

  useEffect(() => {
    // Load offline preference
    const savedOffline = localStorage.getItem('sweden_offline_mode');
    if (savedOffline === 'true') setOfflineMode(true);

    // Fetch user-saved budget from firestore if logged in, otherwise load from localStorage
    const loadBudget = async () => {
      try {
        if (user) {
          const q = query(collection(db, 'budgets'), where('userId', '==', user.uid));
          const snapshot = await getDocs(q);
          if (!snapshot.empty) {
            const data = snapshot.docs[0].data();
            if (data.limit) setBudgetLimit(data.limit);
            if (data.items) setItems(data.items);
          }
        } else {
          const localLimit = localStorage.getItem('sweden_budget_limit');
          const localItems = localStorage.getItem('sweden_budget_items');
          if (localLimit) setBudgetLimit(Number(localLimit));
          if (localItems) setItems(JSON.parse(localItems));
        }
      } catch (err) {
        console.error('Failed to load budget:', err);
      }
    };

    const loadSavedFavorites = async () => {
      setIsLoadingFavs(true);
      try {
        if (user) {
          const q = query(collection(db, 'favorites'), where('userId', '==', user.uid));
          const snapshot = await getDocs(q);
          const itemsList: any[] = [];
          snapshot.forEach(doc => {
            itemsList.push({ id: doc.id, ...doc.data() });
          });
          setSavedItems(itemsList);
        } else {
          const guest = localStorage.getItem('favs_guest');
          if (guest) {
            const ids = JSON.parse(guest);
            const itemsList = ids.map((id: string) => ({
              id,
              itemName: id.replace('_', ' ').toUpperCase(),
              itemType: 'Quick Bookmark',
              itemImage: 'https://images.unsplash.com/photo-1504829857797-ddff28127792?auto=format&fit=crop&w=300&q=80'
            }));
            setSavedItems(itemsList);
          }
        }
      } catch (err) {
        console.error('Failed to load favorites in budget view:', err);
      } finally {
        setIsLoadingFavs(false);
      }
    };

    loadBudget();
    loadSavedFavorites();
  }, [user]);

  // Persist budget changes
  const saveBudgetToStorage = async (updatedLimit: number, updatedItems: BudgetItem[]) => {
    if (user) {
      setIsSaving(true);
      try {
        await setDoc(doc(db, 'budgets', user.uid), {
          userId: user.uid,
          limit: updatedLimit,
          items: updatedItems,
          updatedAt: new Date().toISOString()
        });
      } catch (err) {
        console.error('Failed to save budget to Firestore:', err);
      } finally {
        setIsSaving(false);
      }
    } else {
      localStorage.setItem('sweden_budget_limit', updatedLimit.toString());
      localStorage.setItem('sweden_budget_items', JSON.stringify(updatedItems));
    }
  };

  const handleApplyPreset = (presetKey: keyof typeof PRESETS) => {
    const preset = PRESETS[presetKey];
    const newItems = preset.items.map((item, index) => ({
      id: (index + 1).toString(),
      category: item.category,
      amount: item.amount,
      notes: `${preset.name.en} values`
    }));
    setBudgetLimit(preset.limit);
    setItems(newItems);
    saveBudgetToStorage(preset.limit, newItems);
  };

  const handleAddItem = () => {
    if (!newAmount || isNaN(Number(newAmount)) || Number(newAmount) <= 0) return;
    
    // Check if category already exists, if so merge them
    const existingIndex = items.findIndex(item => item.category === newCategory);
    let updatedItems: BudgetItem[];

    if (existingIndex > -1) {
      updatedItems = [...items];
      updatedItems[existingIndex].amount += Number(newAmount);
      if (newNotes.trim()) {
        updatedItems[existingIndex].notes = updatedItems[existingIndex].notes 
          ? `${updatedItems[existingIndex].notes}, ${newNotes}` 
          : newNotes;
      }
    } else {
      const newItem: BudgetItem = {
        id: Math.random().toString(),
        category: newCategory,
        amount: Number(newAmount),
        notes: newNotes.trim() || undefined
      };
      updatedItems = [...items, newItem];
    }

    setItems(updatedItems);
    setNewAmount('');
    setNewNotes('');
    saveBudgetToStorage(budgetLimit, updatedItems);
  };

  const handleDeleteItem = (id: string) => {
    const updated = items.filter(item => item.id !== id);
    setItems(updated);
    saveBudgetToStorage(budgetLimit, updated);
  };

  const handleLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const limit = Number(e.target.value);
    setBudgetLimit(limit);
    saveBudgetToStorage(limit, items);
  };

  const toggleOffline = (checked: boolean) => {
    setOfflineMode(checked);
    localStorage.setItem('sweden_offline_mode', checked ? 'true' : 'false');
    if (checked) {
      alert(language === 'ar' ? 'تم تفعيل وضع السفر دون اتصال بالإنترنت! تم حفظ المفضلات والبيانات محلياً.' : 'Offline Travel Mode activated! Loaded guides and bookmarked trips are cached securely in LocalStorage.');
    }
  };

  const handleDeleteFavorite = async (favId: string) => {
    setSavedItems(savedItems.filter(i => i.id !== favId));
    if (user) {
      try {
        await deleteDoc(doc(db, 'favorites', favId));
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Recharts calculations
  const totalSpent = items.reduce((acc, curr) => acc + curr.amount, 0);
  const remainingBudget = budgetLimit - totalSpent;
  const percentSpent = budgetLimit > 0 ? (totalSpent / budgetLimit) * 100 : 0;

  const chartData = items.map((item, index) => ({
    name: item.category,
    value: item.amount,
    color: COLORS[index % COLORS.length]
  }));

  // Render Category List
  const CATEGORIES = [
    'Hotels/Hostels',
    'Flights/Transport',
    'Food/Dining',
    'Activities',
    'Shopping',
    'Others'
  ];

  return (
    <div className="space-y-6 text-xs text-slate-700" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <button 
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg cursor-pointer"
          id="back-btn"
        >
          {t.backToHome}
        </button>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Calculator className="text-scandi-blue w-5 h-5 animate-pulse" />
          {language === 'ar' ? 'مخطط الميزانية والإنفاق الذكي' : language === 'sv' ? 'Budgetplanering & Utgifter' : 'Sweden Travel Budget Dashboard'}
        </h2>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Budget Configuration & Live Visual Overview */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Quick Controls & Budget Inputs */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">
                  {language === 'ar' ? 'حدد ميزانيتك الإجمالية' : language === 'sv' ? 'Ange din totala budget' : 'Set Your Total Trip Budget'}
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {language === 'ar' ? 'الميزانية بالكرونة السويدية (SEK)' : language === 'sv' ? 'Budget visas i svenska kronor (SEK)' : 'Specify budget limit in Swedish Krona (SEK).'}
                </p>
              </div>

              {/* Preset Buttons */}
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                <button
                  onClick={() => handleApplyPreset('backpacker')}
                  className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-lg cursor-pointer transition-colors"
                  id="preset-backpacker"
                >
                  {language === 'ar' ? 'اقتصادي' : language === 'sv' ? 'Backpacker' : 'Backpacker'}
                </button>
                <button
                  onClick={() => handleApplyPreset('standard')}
                  className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 text-[10px] font-bold rounded-lg cursor-pointer transition-colors"
                  id="preset-standard"
                >
                  {language === 'ar' ? 'متوسط' : language === 'sv' ? 'Standard' : 'Standard'}
                </button>
                <button
                  onClick={() => handleApplyPreset('luxury')}
                  className="px-2.5 py-1.5 bg-yellow-50 hover:bg-yellow-100 text-yellow-800 text-[10px] font-bold rounded-lg cursor-pointer transition-colors"
                  id="preset-luxury"
                >
                  {language === 'ar' ? 'فاخر' : language === 'sv' ? 'Lyx' : 'Luxury'}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <span className="font-bold text-lg text-slate-500">SEK</span>
              <input
                type="number"
                value={budgetLimit}
                onChange={handleLimitChange}
                className="w-full bg-transparent border-none text-2xl font-extrabold text-slate-900 focus:outline-none focus:ring-0"
                placeholder="25000"
                id="budget-limit-input"
              />
              {isSaving && (
                <span className="flex items-center gap-1 text-[9px] text-indigo-500 font-bold bg-indigo-50 px-2 py-0.5 rounded animate-pulse">
                  <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Saving
                </span>
              )}
            </div>

            {/* Real-time Currency Converter Control */}
            <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200/60 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <RefreshCw className={`w-3.5 h-3.5 text-scandi-blue ${isLoadingRates ? 'animate-spin' : ''}`} />
                  <span className="font-bold text-xs text-slate-800">
                    {language === 'ar' ? 'محول العملات المباشر' : language === 'sv' ? 'Valutaomvandlare i realtid' : 'Real-time Currency Converter'}
                  </span>
                  {liveRatesActive ? (
                    <span className="text-[9px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.5 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                      {language === 'ar' ? 'مباشر' : language === 'sv' ? 'Live' : 'Live Rates'}
                    </span>
                  ) : (
                    <span className="text-[9px] bg-slate-100 text-slate-600 font-bold px-1.5 py-0.5 rounded-full">
                      {language === 'ar' ? 'وضع غير متصل' : language === 'sv' ? 'Offline-kurs' : 'Cached/Offline'}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <label htmlFor="home-currency" className="text-[10px] text-slate-400 uppercase font-bold">
                    {language === 'ar' ? 'العملة الأم:' : language === 'sv' ? 'Hemvaluta:' : 'Home Currency:'}
                  </label>
                  <select
                    id="home-currency"
                    value={homeCurrency}
                    onChange={(e) => setHomeCurrency(e.target.value)}
                    className="p-1 bg-white border border-slate-200 rounded font-bold text-slate-800 text-[11px] focus:outline-none focus:ring-1 focus:ring-scandi-blue"
                  >
                    {Object.keys(FALLBACK_RATES).map(cur => (
                      <option key={cur} value={cur}>{cur} ({CURRENCY_SYMBOLS[cur]})</option>
                    ))}
                  </select>
                </div>
              </div>

              {homeCurrency !== 'SEK' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[11px] pt-2 border-t border-slate-100">
                  <div>
                    <span className="text-slate-400 font-medium block">
                      {language === 'ar' ? 'سعر الصرف المباشر:' : language === 'sv' ? 'Växelkurs:' : 'Live Exchange Rate:'}
                    </span>
                    <span className="font-mono font-bold text-slate-800">
                      1 SEK = {exchangeRates[homeCurrency]?.toFixed(4)} {homeCurrency}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block">
                      {language === 'ar' ? 'الميزانية بالعملة الأم:' : language === 'sv' ? 'Budget i hemvaluta:' : 'Budget in Home Currency:'}
                    </span>
                    <span className="font-bold text-indigo-600 text-xs">
                      {CURRENCY_SYMBOLS[homeCurrency] || ''}{(budgetLimit * (exchangeRates[homeCurrency] || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {homeCurrency}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Visual Budget Progress Ring / Bar */}
            <div className="space-y-2 pt-1">
              <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                <span>
                  {language === 'ar' ? 'إجمالي المنفق' : language === 'sv' ? 'Totalt spenderat' : 'Total Spent'}:{' '}
                  <strong className="text-slate-900">{totalSpent.toLocaleString()} SEK</strong>
                  {homeCurrency !== 'SEK' && (
                    <span className="text-slate-500 font-normal ml-1">
                      ({CURRENCY_SYMBOLS[homeCurrency] || ''}{(totalSpent * (exchangeRates[homeCurrency] || 0)).toLocaleString(undefined, { maximumFractionDigits: 0 })} {homeCurrency})
                    </span>
                  )}
                </span>
                <span>
                  {language === 'ar' ? 'المتبقي' : language === 'sv' ? 'Kvarstående' : 'Remaining'}:{' '}
                  <strong className={remainingBudget >= 0 ? 'text-emerald-600' : 'text-red-500'}>
                    {remainingBudget.toLocaleString()} SEK
                  </strong>
                  {homeCurrency !== 'SEK' && (
                    <span className={`${remainingBudget >= 0 ? 'text-emerald-500/80' : 'text-red-400'} font-normal ml-1`}>
                      ({CURRENCY_SYMBOLS[homeCurrency] || ''}{(remainingBudget * (exchangeRates[homeCurrency] || 0)).toLocaleString(undefined, { maximumFractionDigits: 0 })} {homeCurrency})
                    </span>
                  )}
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    percentSpent > 100 ? 'bg-red-500' : percentSpent > 85 ? 'bg-amber-500' : 'bg-scandi-blue'
                  }`}
                  style={{ width: `${Math.min(percentSpent, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>{percentSpent.toFixed(0)}% {language === 'ar' ? 'مستهلك' : language === 'sv' ? 'använt' : 'allocated'}</span>
                <span>
                  {budgetLimit.toLocaleString()} SEK {language === 'ar' ? 'الحد الأقصى' : language === 'sv' ? 'gräns' : 'limit'}
                  {homeCurrency !== 'SEK' && (
                    <span className="text-slate-400 ml-1">
                      ({CURRENCY_SYMBOLS[homeCurrency] || ''}{(budgetLimit * (exchangeRates[homeCurrency] || 0)).toLocaleString(undefined, { maximumFractionDigits: 0 })} {homeCurrency})
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Recharts Pie Chart & Budget Summary Breakdown */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-scandi-blue" />
              {language === 'ar' ? 'توزيع التكاليف والتحليلات البيانية' : language === 'sv' ? 'Kostnadsfördelning & Analys' : 'Expense Breakdown & Visual Analytics'}
            </h3>

            {items.length === 0 ? (
              <div className="text-center p-8 bg-slate-50 rounded-xl text-slate-400 border border-slate-100">
                No custom budget categories added yet. Choose a preset or add expenses below.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                {/* Recharts Render Stage */}
                <div className="h-64 relative w-full flex items-center justify-center bg-slate-50/50 rounded-2xl p-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={85}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => [`${Number(value).toLocaleString()} SEK`, 'Amount']}
                        contentStyle={{ 
                          backgroundColor: '#1E293B', 
                          borderRadius: '8px', 
                          border: 'none',
                          color: '#fff',
                          fontSize: '11px',
                          fontFamily: 'Inter, sans-serif'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Central Overlay statistics */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      {language === 'ar' ? 'المجموع' : language === 'sv' ? 'Totalt' : 'Total'}
                    </span>
                    <span className="text-sm font-extrabold text-slate-900 text-center">
                      {totalSpent.toLocaleString()} SEK
                      {homeCurrency !== 'SEK' && (
                        <span className="block text-[10px] text-indigo-600 font-bold mt-0.5">
                          {CURRENCY_SYMBOLS[homeCurrency] || ''}{(totalSpent * (exchangeRates[homeCurrency] || 0)).toLocaleString(undefined, { maximumFractionDigits: 0 })} {homeCurrency}
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Legend list Custom Rendering with styled items and percentages */}
                <div className="space-y-2.5">
                  <h4 className="font-bold text-xs text-slate-800 border-b border-slate-100 pb-1.5">
                    {language === 'ar' ? 'الفئات والنسب' : language === 'sv' ? 'Kategorier & Andelar' : 'Categories & Share'}
                  </h4>
                  <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                    {items.map((item, index) => {
                      const share = totalSpent > 0 ? (item.amount / totalSpent) * 100 : 0;
                      const color = COLORS[index % COLORS.length];
                      return (
                        <div key={item.id} className="flex items-center justify-between p-1.5 hover:bg-slate-50 rounded-lg transition-colors">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                            <span className="font-semibold text-slate-800 text-[11px] truncate max-w-[120px]">{item.category}</span>
                          </div>
                          <div className="text-right text-[11px]">
                            <span className="font-bold text-slate-900 block">{item.amount.toLocaleString()} SEK</span>
                            {homeCurrency !== 'SEK' && (
                              <span className="text-indigo-600 font-medium text-[10px] block">
                                {CURRENCY_SYMBOLS[homeCurrency] || ''}{(item.amount * (exchangeRates[homeCurrency] || 0)).toLocaleString(undefined, { maximumFractionDigits: 0 })} {homeCurrency}
                              </span>
                            )}
                            <span className="text-[9px] text-slate-400 block">{share.toFixed(0)}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Form to Modify/Add items to expenditure */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900">
              {language === 'ar' ? 'إضافة / تعديل نفقة مخصصة' : language === 'sv' ? 'Lägg till / Ändra utgift' : 'Add or Adjust Custom Expense'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800 text-xs"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Amount (SEK)</label>
                <input
                  type="number"
                  placeholder="e.g. 1500"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Train to Gothenburg"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleAddItem}
                className="px-4 py-2 bg-scandi-blue text-white text-xs font-bold rounded-lg hover:bg-scandi-blue/90 transition-colors flex items-center gap-1.5 cursor-pointer"
                id="add-expense-btn"
              >
                <Plus className="w-3.5 h-3.5" />
                {language === 'ar' ? 'إضافة للإنفاق' : language === 'sv' ? 'Lägg till utgift' : 'Add to Spending'}
              </button>
            </div>

            {/* List of current customized allocations */}
            <div className="border-t border-slate-100 pt-3">
              <h4 className="font-extrabold text-[11px] text-slate-900 mb-2">
                {language === 'ar' ? 'تعديل البنود الحالية' : language === 'sv' ? 'Hantera aktuella poster' : 'Detailed Expense Register'}
              </h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {items.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                    <div>
                      <span className="font-semibold text-slate-800 text-xs block">{item.category}</span>
                      {item.notes && <span className="text-[10px] text-slate-400 italic block">{item.notes}</span>}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="font-bold text-slate-950 text-xs block">{item.amount.toLocaleString()} SEK</span>
                        {homeCurrency !== 'SEK' && (
                          <span className="text-[10px] text-indigo-600 font-semibold block">
                            {CURRENCY_SYMBOLS[homeCurrency] || ''}{(item.amount * (exchangeRates[homeCurrency] || 0)).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 1 })} {homeCurrency}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Parity components (Offline Toggle & Favorites Bookmarks) */}
        <div className="space-y-6 lg:col-span-1">
          {/* Offline Mode Switch */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                <WifiOff className="w-4 h-4 text-scandi-blue" />
                Offline Travel Mode
              </h3>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={offlineMode} 
                  onChange={(e) => toggleOffline(e.target.checked)}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-scandi-blue"></div>
              </label>
            </div>
            <p className="text-slate-500 leading-relaxed text-[11px]">
              Enable to access Sweden Travel AI's loaded guides, packing checklists, and bookmarked attractions when you lose mobile signal or roam without internet in Swedish mountains or nature parks.
            </p>
          </div>

          {/* Bookmarks manager */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
              <Bookmark className="w-4 h-4 text-emerald-600" />
              Saved Bookmarks & Favorites
            </h3>

            {isLoadingFavs ? (
              <p className="text-slate-400">Loading your favorites...</p>
            ) : savedItems.length === 0 ? (
              <div className="text-center p-6 bg-slate-50 border border-slate-100 rounded-xl text-slate-400">
                You haven't bookmarked any cities or attractions yet. Click the heart icons when exploring to save them!
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {savedItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-100 rounded-xl">
                    <div className="flex items-center gap-2.5">
                      <img src={item.itemImage} alt={item.itemName} className="w-9 h-9 object-cover rounded" />
                      <div>
                        <span className="font-bold text-slate-900 block truncate max-w-[140px]">{item.itemName}</span>
                        <span className="text-[10px] text-slate-400 capitalize">{item.itemType}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDeleteFavorite(item.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Practical travel cost indicators banner for Sweden */}
          <div className="bg-gradient-to-br from-scandi-blue to-blue-900 p-5 rounded-2xl text-white shadow-sm space-y-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 opacity-10 font-bold text-9xl">kr</div>
            <h3 className="font-extrabold text-sm flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-scandi-yellow animate-pulse" />
              Swedish Pricing Context
            </h3>
            <p className="text-[10px] text-slate-200 leading-relaxed">
              Sweden is mostly cashless. Visa and Mastercard are accepted everywhere. 
              Here are typical costs in 2026:
            </p>
            <ul className="space-y-2 text-[10px] text-slate-300 font-mono">
              <li className="flex justify-between items-start gap-4">
                <span>Cup of Coffee (Fika):</span>
                <span className="text-scandi-yellow text-right">
                  45 - 55 SEK
                  {homeCurrency !== 'SEK' && (
                    <span className="text-white text-[9px] block">
                      ({CURRENCY_SYMBOLS[homeCurrency] || ''}{(45 * (exchangeRates[homeCurrency] || 0)).toFixed(1)} - {CURRENCY_SYMBOLS[homeCurrency] || ''}{(55 * (exchangeRates[homeCurrency] || 0)).toFixed(1)} {homeCurrency})
                    </span>
                  )}
                </span>
              </li>
              <li className="flex justify-between items-start gap-4">
                <span>Casual Lunch:</span>
                <span className="text-scandi-yellow text-right">
                  120 - 155 SEK
                  {homeCurrency !== 'SEK' && (
                    <span className="text-white text-[9px] block">
                      ({CURRENCY_SYMBOLS[homeCurrency] || ''}{(120 * (exchangeRates[homeCurrency] || 0)).toFixed(0)} - {CURRENCY_SYMBOLS[homeCurrency] || ''}{(155 * (exchangeRates[homeCurrency] || 0)).toFixed(0)} {homeCurrency})
                    </span>
                  )}
                </span>
              </li>
              <li className="flex justify-between items-start gap-4">
                <span>Public Transit (Single):</span>
                <span className="text-scandi-yellow text-right">
                  39 - 45 SEK
                  {homeCurrency !== 'SEK' && (
                    <span className="text-white text-[9px] block">
                      ({CURRENCY_SYMBOLS[homeCurrency] || ''}{(39 * (exchangeRates[homeCurrency] || 0)).toFixed(1)} - {CURRENCY_SYMBOLS[homeCurrency] || ''}{(45 * (exchangeRates[homeCurrency] || 0)).toFixed(1)} {homeCurrency})
                    </span>
                  )}
                </span>
              </li>
              <li className="flex justify-between items-start gap-4">
                <span>Mid-range Dinner (Per person):</span>
                <span className="text-scandi-yellow text-right">
                  250 - 400 SEK
                  {homeCurrency !== 'SEK' && (
                    <span className="text-white text-[9px] block">
                      ({CURRENCY_SYMBOLS[homeCurrency] || ''}{(250 * (exchangeRates[homeCurrency] || 0)).toFixed(0)} - {CURRENCY_SYMBOLS[homeCurrency] || ''}{(400 * (exchangeRates[homeCurrency] || 0)).toFixed(0)} {homeCurrency})
                    </span>
                  )}
                </span>
              </li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}
