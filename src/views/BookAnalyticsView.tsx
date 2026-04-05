import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppStore } from '../store';
import { ArrowLeftIcon, ArrowUpCircleIcon, ArrowDownCircleIcon, WalletIcon, TrendingUpIcon } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { cn } from '../lib/utils';

interface Props {
  // Navigation handled by react-router-dom
}

const COLORS = ['#059669', '#2563EB', '#D97706', '#7C3AED', '#DB2777', '#0891B2', '#4F46E5', '#EA580C', '#65A30D'];

export const BookAnalyticsView = ({}: Props) => {
  const { bookId, businessId } = useParams<{ bookId: string, businessId: string }>();
  const navigate = useNavigate();

  if (!bookId) return <div className="p-10 text-center">Ledger ID missing</div>;

  const { dataTransactions, dataBooks } = useAppStore();
  const transactions = dataTransactions[bookId] || [];
  const books = businessId ? (dataBooks[businessId] || []) : [];
  const book = books.find(b => b.id === bookId);

  const [dateRange, setDateRange] = useState<'ALL' | '7D' | '30D' | 'THIS_MONTH'>('ALL');

  // Format currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  // Derived Data
  const filteredTxs = useMemo(() => {
    if (dateRange === 'ALL') return transactions;
    const now = new Date();
    return transactions.filter(tx => {
      const txDate = new Date(tx.date);
      if (dateRange === '7D') return (now.getTime() - txDate.getTime()) <= 7 * 24 * 60 * 60 * 1000;
      if (dateRange === '30D') return (now.getTime() - txDate.getTime()) <= 30 * 24 * 60 * 60 * 1000;
      if (dateRange === 'THIS_MONTH') return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
      return true;
    });
  }, [transactions, dateRange]);

  const totals = useMemo(() => {
    return filteredTxs.reduce((acc, tx) => {
      if (tx.type === 'IN') acc.in += tx.amount;
      else acc.out += tx.amount;
      return acc;
    }, { in: 0, out: 0 });
  }, [filteredTxs]);

  const netBalance = totals.in - totals.out;

  // Chart 1: Daily Trend
  const dailyData = useMemo(() => {
    const map: Record<string, { date: string; in: number; out: number }> = {};
    const reversed = [...filteredTxs].reverse(); // from oldest to newest if sorted desc initially
    reversed.forEach(tx => {
      const dStr = new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!map[dStr]) map[dStr] = { date: dStr, in: 0, out: 0 };
      if (tx.type === 'IN') map[dStr].in += tx.amount;
      else map[dStr].out += tx.amount;
    });
    return Object.values(map);
  }, [filteredTxs]);

  // Chart 2: Category Breakdown (Cash Out)
  const categoryOutData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredTxs.filter(tx => tx.type === 'OUT').forEach(tx => {
      const cat = tx.category || 'Uncategorized';
      map[cat] = (map[cat] || 0) + tx.amount;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
  }, [filteredTxs]);

  // Chart 3: Category Breakdown (Cash In)
  const categoryInData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredTxs.filter(tx => tx.type === 'IN').forEach(tx => {
      const cat = tx.category || 'Uncategorized';
      map[cat] = (map[cat] || 0) + tx.amount;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
  }, [filteredTxs]);

  if (!book) return <div className="p-10 text-center text-slate-500">Book not found.</div>;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-32 relative">
      <header className="bg-white border-b sticky top-0 z-20 backdrop-blur-md bg-white/80">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full hover:bg-slate-100">
              <ArrowLeftIcon className="w-5 h-5 text-slate-600" />
            </Button>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">Analytics: {book.name}</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reports & Insights</p>
            </div>
          </div>
          <div className="flex bg-slate-100 rounded-lg p-1 border border-slate-200">
             {['ALL', '7D', '30D', 'THIS_MONTH'].map(dr => (
                <button 
                  key={dr} 
                  onClick={() => setDateRange(dr as any)}
                  className={cn(
                    "px-3 h-7 text-[9px] font-black uppercase tracking-widest rounded-md transition-colors", 
                    dateRange === dr ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  {dr.replace('_', ' ')}
                </button>
             ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        
        {/* KPI Totals */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-none shadow-sm bg-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-12 -mt-12" />
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-50 rounded-lg">
                  <ArrowUpCircleIcon className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Inflow</p>
              </div>
              <p className="text-2xl font-black text-emerald-600">{formatCurrency(totals.in)}</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full -mr-12 -mt-12" />
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-rose-50 rounded-lg">
                  <ArrowDownCircleIcon className="w-4 h-4 text-rose-600" />
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Outflow</p>
              </div>
              <p className="text-2xl font-black text-rose-600">{formatCurrency(totals.out)}</p>
            </CardContent>
          </Card>

          <Card className={cn(
             "border-none shadow-md overflow-hidden relative",
             netBalance >= 0 ? "bg-blue-600 text-white" : "bg-rose-600 text-white"
          )}>
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12" />
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white/10 rounded-lg">
                  <WalletIcon className="w-4 h-4 text-white" />
                </div>
                <p className="text-xs font-bold text-white/80 uppercase tracking-wider">Period Balance</p>
              </div>
              <p className="text-3xl font-black">{formatCurrency(netBalance)}</p>
            </CardContent>
          </Card>
        </div>

        {filteredTxs.length === 0 ? (
           <div className="py-20 text-center bg-white rounded-2xl border border-slate-200">
             <TrendingUpIcon className="w-12 h-12 text-slate-200 mx-auto mb-3" />
             <p className="text-slate-500 font-bold">No data found</p>
             <p className="text-slate-400 text-sm mt-1">There are no transactions in this period to analyze.</p>
           </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Daily Trend */}
              <Card className="border-slate-200 shadow-sm col-span-1 lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-sm font-black uppercase tracking-wider text-slate-800">Cash Flow Trend</CardTitle>
                  <CardDescription className="text-xs">Daily cash inflow vs outflow.</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="date" tick={{fontSize: 10}} tickLine={false} axisLine={false} dy={10} />
                      <YAxis tick={{fontSize: 10}} tickLine={false} axisLine={false} dx={-10} tickFormatter={(val) => `₹${val/1000}k`} />
                      <RechartsTooltip cursor={{fill: '#F1F5F9'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                      <Legend wrapperStyle={{fontSize: '12px', fontWeight: 'bold', paddingTop: '20px'}} />
                      <Line type="monotone" dataKey="in" name="Cash In" stroke="#059669" strokeWidth={3} dot={false} activeDot={{r: 6}} />
                      <Line type="monotone" dataKey="out" name="Cash Out" stroke="#E11D48" strokeWidth={3} dot={false} activeDot={{r: 6}} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Expense by Category */}
              <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-sm font-black uppercase tracking-wider text-slate-800">Outflow by Category</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center">
                  {categoryOutData.length > 0 ? (
                     <ResponsiveContainer width="100%" height="100%">
                       <PieChart>
                         <Pie
                           data={categoryOutData}
                           cx="50%"
                           cy="50%"
                           innerRadius={60}
                           outerRadius={90}
                           paddingAngle={5}
                           dataKey="value"
                         >
                           {categoryOutData.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                           ))}
                         </Pie>
                         <RechartsTooltip formatter={(val: number) => formatCurrency(val)} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                         <Legend layout="horizontal" verticalAlign="bottom" wrapperStyle={{fontSize: '10px', fontWeight: 'bold'}} />
                       </PieChart>
                     </ResponsiveContainer>
                  ) : <p className="text-xs font-bold text-slate-400">No outflow categorized</p>}
                </CardContent>
              </Card>

              {/* Income by Category */}
              <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-sm font-black uppercase tracking-wider text-slate-800">Inflow by Category</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center">
                   {categoryInData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={categoryInData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                           <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E2E8F0" />
                           <XAxis type="number" tick={{fontSize: 10}} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
                           <YAxis dataKey="name" type="category" tick={{fontSize: 10, fontWeight: 'bold'}} tickLine={false} axisLine={false} />
                           <RechartsTooltip cursor={{fill: '#F1F5F9'}} formatter={(val: number) => formatCurrency(val)} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                           <Bar dataKey="value" fill="#059669" radius={[0, 4, 4, 0]}>
                             {categoryInData.map((entry, index) => (
                               <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                             ))}
                           </Bar>
                         </BarChart>
                      </ResponsiveContainer>
                   ) : <p className="text-xs font-bold text-slate-400">No inflow categorized</p>}
                </CardContent>
              </Card>

            </div>
          </>
        )}
      </main>
    </div>
  );
};
