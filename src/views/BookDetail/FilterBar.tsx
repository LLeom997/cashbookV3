import React from 'react';
import { SearchIcon, FilterIcon, XIcon } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { cn } from '../../lib/utils';

interface FilterBarProps {
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  showMobileFilters: boolean;
  setShowMobileFilters: (v: boolean) => void;
  filterParty: string;
  setFilterParty: (v: string) => void;
  parties: string[];
  filterCategory: string;
  setFilterCategory: (v: string) => void;
  categories: string[];
  filterPaymentMode: string;
  setFilterPaymentMode: (v: string) => void;
  payModes: string[];
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchTerm,
  setSearchTerm,
  showMobileFilters,
  setShowMobileFilters,
  filterParty,
  setFilterParty,
  parties,
  filterCategory,
  setFilterCategory,
  categories,
  filterPaymentMode,
  setFilterPaymentMode,
  payModes,
}) => {
  const clearFilters = () => {
    setFilterParty('ALL');
    setFilterCategory('ALL');
    setFilterPaymentMode('ALL');
  };

  return (
    <div className="flex flex-col gap-4 relative z-10">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by note, party, or tag..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white border-slate-200 h-11"
          />
        </div>
        <div className="flex gap-2 md:hidden">
          <Button
            variant="outline"
            onClick={() => setShowMobileFilters(true)}
            className={cn(
              "flex-1 flex items-center justify-center bg-white h-11 font-bold uppercase tracking-widest text-[10px]",
              (filterParty !== 'ALL' || filterCategory !== 'ALL' || filterPaymentMode !== 'ALL') && "border-blue-500 text-blue-600 bg-blue-50"
            )}
          >
            <FilterIcon className="w-4 h-4 mr-2" />
            Filters
            {(filterParty !== 'ALL' || filterCategory !== 'ALL' || filterPaymentMode !== 'ALL') && (
              <span className="ml-2 w-2 h-2 bg-blue-600 rounded-full"></span>
            )}
          </Button>
          {(filterParty !== 'ALL' || filterCategory !== 'ALL' || filterPaymentMode !== 'ALL' || searchTerm) && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => { clearFilters(); setSearchTerm(''); }}
              className="h-11 w-11 bg-rose-50 text-rose-500 rounded-lg"
            >
              <XIcon className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Desktop Filters (Scrollable Row) */}
      <div className="hidden md:flex overflow-x-auto gap-4 pb-2 scrollbar-hide py-1">
        <select
          value={filterParty}
          onChange={(e) => setFilterParty(e.target.value)}
          className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 cursor-pointer min-w-[140px] hover:border-blue-300"
        >
          <option value="ALL">ALL PARTIES</option>
          {parties.map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
        </select>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 cursor-pointer min-w-[140px] hover:border-blue-300"
        >
          <option value="ALL">ALL CATEGORIES</option>
          {categories.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
        </select>

        <select
          value={filterPaymentMode}
          onChange={(e) => setFilterPaymentMode(e.target.value)}
          className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 cursor-pointer min-w-[140px] hover:border-blue-300"
        >
          <option value="ALL">ALL MODES</option>
          {payModes.map(m => <option key={m} value={m}>{m.toUpperCase()}</option>)}
        </select>

        {(filterParty !== 'ALL' || filterCategory !== 'ALL' || filterPaymentMode !== 'ALL' || searchTerm) && (
          <Button variant="ghost" onClick={() => { clearFilters(); setSearchTerm(''); }} className="text-xs font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50 px-3">
            <XIcon className="w-3.5 h-3.5 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Mobile Filter Sidebar (Drawer Style) */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-[100] md:hidden">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setShowMobileFilters(false)}
          />
          
          {/* Sidebar Content */}
          <div className="absolute right-0 top-0 bottom-0 w-[280px] bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
              <div>
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Filters</h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Refine Transactions</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowMobileFilters(false)} className="rounded-full h-8 w-8">
                <XIcon className="w-5 h-5 text-slate-400" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Party Name</label>
                  <select 
                    value={filterParty} 
                    onChange={(e) => setFilterParty(e.target.value)} 
                    className="w-full px-4 h-12 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all uppercase tracking-tight"
                  >
                    <option value="ALL">All Parties</option>
                    {parties.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Category</label>
                  <select 
                    value={filterCategory} 
                    onChange={(e) => setFilterCategory(e.target.value)} 
                    className="w-full px-4 h-12 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all uppercase tracking-tight"
                  >
                    <option value="ALL">All Categories</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Payment Mode</label>
                  <select 
                    value={filterPaymentMode} 
                    onChange={(e) => setFilterPaymentMode(e.target.value)} 
                    className="w-full px-4 h-12 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all uppercase tracking-tight"
                  >
                    <option value="ALL">All Modes</option>
                    {payModes.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>

              {(filterParty !== 'ALL' || filterCategory !== 'ALL' || filterPaymentMode !== 'ALL') && (
                <Button 
                  onClick={() => { clearFilters(); setShowMobileFilters(false); }} 
                  variant="outline" 
                  className="w-full h-12 border-rose-200 text-rose-600 font-black uppercase tracking-widest text-[10px] hover:bg-rose-50 hover:border-rose-300"
                >
                  Clear All Filters
                </Button>
              )}
            </div>

            <div className="p-6 border-t bg-slate-50/50">
              <Button 
                onClick={() => setShowMobileFilters(false)} 
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-100 rounded-xl"
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
