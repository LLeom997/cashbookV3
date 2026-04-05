import React from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { formatCurrency, cn } from '../../lib/utils';
import { TrendingUpIcon, TrendingDownIcon, WalletIcon, Loader2Icon } from 'lucide-react';

interface SummaryCardsProps {
  totalIn: number;
  totalOut: number;
  balance: number;
  isLoading?: boolean;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ totalIn, totalOut, balance, isLoading }) => {
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-6">
      <Card className="bg-white border-slate-200 overflow-hidden group hover:shadow-md transition-all">
        <CardContent className="p-0">
          <div className="p-2.5 sm:p-6 relative">
            <div className="flex justify-between items-start mb-1 sm:mb-4">
              <div className="p-1 sm:p-2 bg-emerald-50 rounded-lg sm:rounded-xl group-hover:bg-emerald-100 transition-colors">
                <TrendingUpIcon className="w-3.5 h-3.5 sm:w-6 sm:h-6 text-emerald-600" />
              </div>
              {isLoading && (
                <div className="hidden md:flex items-center gap-1 text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-full animate-pulse">
                  <Loader2Icon className="w-3 h-3 animate-spin" /> Calculating...
                </div>
              )}
            </div>
            <p className="text-[7px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] sm:tracking-[0.2em] mb-0.5 sm:mb-1">Cash In</p>
            <h2 className="text-xs sm:text-2xl font-black text-slate-900 tracking-tight font-sans">+{formatCurrency(totalIn).replace('₹', '')}</h2>
          </div>
          <div className="h-0.5 sm:h-1 bg-emerald-500/20 w-full overflow-hidden">
            <div className="bg-emerald-500 h-full w-[60%] opacity-50" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-slate-200 overflow-hidden group hover:shadow-md transition-all">
        <CardContent className="p-0">
          <div className="p-2.5 sm:p-6 relative">
            <div className="flex justify-between items-start mb-1 sm:mb-4">
              <div className="p-1 sm:p-2 bg-rose-50 rounded-lg sm:rounded-xl group-hover:bg-rose-100 transition-colors">
                <TrendingDownIcon className="w-3.5 h-3.5 sm:w-6 sm:h-6 text-rose-600" />
              </div>
              {isLoading && (
                <div className="hidden sm:flex items-center gap-1 text-[10px] font-bold text-rose-600 uppercase tracking-widest bg-rose-50 px-2 py-0.5 rounded-full animate-pulse">
                  <Loader2Icon className="w-3 h-3 animate-spin" /> Calculating...
                </div>
              )}
            </div>
            <p className="text-[7px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] sm:tracking-[0.2em] mb-0.5 sm:mb-1">Cash Out</p>
            <h2 className="text-xs sm:text-2xl font-black text-slate-900 tracking-tight font-sans">-{formatCurrency(totalOut).replace('₹', '')}</h2>
          </div>
          <div className="h-0.5 sm:h-1 bg-rose-500/20 w-full overflow-hidden">
            <div className="bg-rose-500 h-full w-[40%] opacity-50" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-slate-200 overflow-hidden group hover:shadow-md transition-all ring-1 ring-blue-100">
        <CardContent className="p-0">
          <div className="p-2.5 sm:p-6 relative">
            <div className="flex justify-between items-start mb-1 sm:mb-4">
              <div className="p-1 sm:p-2 bg-blue-50 rounded-lg sm:rounded-xl group-hover:bg-blue-100 transition-colors">
                <WalletIcon className="w-3.5 h-3.5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              {isLoading && (
                <div className="hidden sm:flex items-center gap-1 text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-full animate-pulse">
                  <Loader2Icon className="w-3 h-3 animate-spin" /> Syncing...
                </div>
              )}
            </div>
            <p className="text-[7px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] sm:tracking-[0.2em] mb-0.5 sm:mb-1">Net Balance</p>
            <h2 className={cn(
              "text-xs sm:text-2xl font-black tracking-tight font-sans",
              balance >= 0 ? "text-slate-900" : "text-rose-600"
            )}>
              {formatCurrency(balance)}
            </h2>
          </div>
          <div className="h-0.5 sm:h-1 bg-blue-600/20 w-full overflow-hidden">
            <div className={cn(
              "h-full w-[100%] opacity-50",
              balance >= 0 ? "bg-blue-600" : "bg-rose-500"
            )} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
