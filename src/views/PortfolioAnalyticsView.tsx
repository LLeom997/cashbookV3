import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { 
  ArrowLeftIcon, 
  TrendingUpIcon, 
  TrendingDownIcon, 
  WalletIcon, 
  PieChartIcon, 
  BarChart3Icon,
  LayoutGridIcon,
  CalendarIcon
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { LoadingScreen } from '../components/LoadingScreen';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar,
  Legend
} from 'recharts';
import { cn, formatCurrency } from '../lib/utils';
import { getBusinesses } from '../services/businesses';
import { getGlobalTransactions, getPortfolioSummary } from '../services/analytics';
import { Transaction, TransactionType, BusinessWithTotals } from '../types';

const COLORS = ['#2563EB', '#059669', '#D97706', '#7C3AED', '#DB2777', '#0891B2', '#4F46E5', '#EA580C', '#65A30D'];

export const PortfolioAnalyticsView = () => {
  const navigate = useNavigate();
  const { user, hasHydrated } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState({ totalIn: 0, totalOut: 0, balance: 0, projectCount: 0 });
  const [businesses, setBusinesses] = useState<BusinessWithTotals[]>([]);
  const [dateRange, setDateRange] = useState<'ALL' | '7D' | '30D' | '90D'>('ALL');
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasHydrated || !user) return;
    loadData();
  }, [user, dateRange, hasHydrated]);

  const loadData = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [allTxs, portSummary, bizs] = await Promise.all([
        getGlobalTransactions(user!.id, 2000),
        getPortfolioSummary(user!.id),
        getBusinesses(user!.id)
      ]);
      setTransactions(allTxs);
      setSummary(portSummary);
      setBusinesses(bizs);
    } catch (err) {
      console.error("Failed to load analytics", err);
      setLoadError("Couldn't load portfolio analytics.");
    } finally {
      setLoading(false);
    }
  };

  // 📈 Chart 1: Global Trend (Area)
  const trendData = useMemo(() => {
    const map: Record<string, { date: string, in: number, out: number }> = {};
    const filteredByDate = transactions.filter(tx => {
      if (dateRange === 'ALL') return true;
      const txDate = new Date(tx.date);
      const now = new Date();
      const diff = now.getTime() - txDate.getTime();
      const days = diff / (1000 * 60 * 60 * 24);
      if (dateRange === '7D') return days <= 7;
      if (dateRange === '30D') return days <= 30;
      if (dateRange === '90D') return days <= 90;
      return true;
    });

    const reversed = [...filteredByDate].reverse();
    reversed.forEach(tx => {
      const dStr = new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!map[dStr]) map[dStr] = { date: dStr, in: 0, out: 0 };
      if (tx.type === TransactionType.IN) map[dStr].in += tx.amount;
      else map[dStr].out += tx.amount;
    });
    return Object.values(map);
  }, [transactions, dateRange]);

  // 📊 Chart 2: Business Performance (Bar)
  const bizData = useMemo(() => {
    return businesses
      .map(b => ({ name: b.name, balance: b.balance }))
      .sort((a, b) => b.balance - a.balance);
  }, [businesses]);

  // 🍩 Chart 3: Category Breakdown
  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.forEach(tx => {
      if (tx.type === TransactionType.OUT) {
        const cat = tx.category || 'Other / Generic';
        map[cat] = (map[cat] || 0) + tx.amount;
      }
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [transactions]);

  if (loading && transactions.length === 0) {
    return (
      <LoadingScreen
        title="Analyzing portfolio"
        subtitle="Aggregating trends, category splits, and business performance."
      />
    );
  }

  if (loadError && transactions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <p className="text-lg font-black text-slate-900">Analytics unavailable</p>
          <p className="mt-2 text-sm font-medium text-slate-500">{loadError}</p>
          <Button onClick={loadData} className="mt-4 bg-blue-600 hover:bg-blue-700">Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 font-sans">
      <header className="bg-white/80 border-b sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-3 min-h-16 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
              <ArrowLeftIcon className="w-5 h-5 text-slate-600" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-lg font-black text-slate-900 tracking-tight">Portfolio Analytics</h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Insights • {businesses.length} Businesses</p>
            </div>
          </div>

          <div className="grid w-full grid-cols-4 sm:w-auto bg-slate-100 rounded-xl p-1 border border-slate-200">
            {(['7D', '30D', '90D', 'ALL'] as const).map(dr => (
              <button
                key={dr}
                onClick={() => setDateRange(dr)}
                className={cn(
                  "px-3 h-8 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all",
                  dateRange === dr ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                {dr}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        
        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Card className="border-none shadow-xl bg-blue-600 text-white overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500" />
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-white/10 rounded-xl">
                  <WalletIcon className="w-5 h-5 text-white" />
                </div>
                <p className="text-[10px] font-black text-white/70 uppercase tracking-widest">Total Net Worth</p>
              </div>
              <h2 className="text-4xl font-black tracking-tighter mb-1">{formatCurrency(summary.balance)}</h2>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold px-2 py-0.5 bg-white/10 rounded-full border border-white/10">Active Portfolio</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110" />
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-50 rounded-xl">
                  <TrendingUpIcon className="w-5 h-5 text-emerald-600" />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Cash In</p>
              </div>
              <h2 className="text-3xl font-black text-emerald-600 tracking-tight">{formatCurrency(summary.totalIn)}</h2>
              <p className="text-[9px] font-bold text-slate-400 mt-1">Cross-platform inflow</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110" />
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-rose-50 rounded-xl">
                  <TrendingDownIcon className="w-5 h-5 text-rose-600" />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Cash Out</p>
              </div>
              <h2 className="text-3xl font-black text-rose-600 tracking-tight">{formatCurrency(summary.totalOut)}</h2>
              <p className="text-[9px] font-bold text-slate-400 mt-1">Cross-platform expense</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Portfolio Trend */}
          <Card className="lg:col-span-8 border-slate-200/60 shadow-sm overflow-hidden bg-white">
            <CardHeader className="pb-2 border-b border-slate-50">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    <TrendingUpIcon className="w-4 h-4 text-blue-600" />
                    Global Portfolio Trend
                  </CardTitle>
                  <CardDescription className="text-xs">Combined transactions over time.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-8 h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#E11D48" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#E11D48" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis 
                    dataKey="date" 
                    tick={{fontSize: 10, fontWeight: 'bold', fill: '#64748B'}} 
                    tickLine={false} 
                    axisLine={false} 
                    dy={10} 
                  />
                  <YAxis 
                    tick={{fontSize: 10, fontWeight: 'bold', fill: '#64748B'}} 
                    tickLine={false} 
                    axisLine={false} 
                    dx={-10} 
                    tickFormatter={(val) => `₹${val>=1000 ? (val/1000).toFixed(0)+'k' : val}`}
                  />
                  <RechartsTooltip 
                    cursor={{stroke: '#2563EB', strokeWidth: 1, strokeDasharray: '4 4'}}
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)', padding: '12px'}}
                  />
                  <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', paddingBottom: '20px'}} />
                  <Area type="monotone" dataKey="in" name="Cash In" stroke="#059669" strokeWidth={3} fillOpacity={1} fill="url(#colorIn)" />
                  <Area type="monotone" dataKey="out" name="Cash Out" stroke="#E11D48" strokeWidth={3} fillOpacity={1} fill="url(#colorOut)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Category Breakdown */}
          <Card className="lg:col-span-4 border-slate-200/60 shadow-sm bg-white overflow-hidden">
            <CardHeader className="pb-2 border-b border-slate-50">
              <CardTitle className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-blue-600" />
                Global Outflow
              </CardTitle>
              <CardDescription className="text-xs">Category allocation across all books.</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px] pt-4">
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="45%"
                      innerRadius={70}
                      outerRadius={105}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={4} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(val: number) => formatCurrency(val)} />
                    <Legend 
                      verticalAlign="bottom" 
                      align="center"
                      layout="horizontal"
                      wrapperStyle={{fontSize: '8px', fontWeight: 'black', textTransform: 'uppercase', letterSpacing: '0.05em'}}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 italic text-xs font-bold uppercase tracking-widest">No global data</div>
              )}
            </CardContent>
          </Card>

          {/* Business Comparison */}
          <Card className="lg:col-span-12 border-slate-200/60 shadow-sm bg-white overflow-hidden">
            <CardHeader className="pb-2 border-b border-slate-50">
              <CardTitle className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <BarChart3Icon className="w-4 h-4 text-blue-600" />
                Performance by Business
              </CardTitle>
              <CardDescription className="text-xs">Net balance comparison for each project.</CardDescription>
            </CardHeader>
            <CardContent className="pt-8 h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bizData} layout="vertical" margin={{ left: 20, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E2E8F0" />
                  <XAxis 
                    type="number" 
                    tick={{fontSize: 10, fontWeight: 'bold', fill: '#64748B'}} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(val) => `₹${val>=1000 ? (val/1000).toFixed(0)+'k' : val}`}
                  />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    tick={{fontSize: 10, fontWeight: 'black', fill: '#334155', textTransform: 'uppercase'}} 
                    width={100}
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <RechartsTooltip cursor={{fill: '#F1F5F9'}} formatter={(val: number) => formatCurrency(val)} />
                  <Bar dataKey="balance" radius={[0, 6, 6, 0]} barSize={24}>
                    {bizData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.balance >= 0 ? '#2563EB' : '#E11D48'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  );
};
