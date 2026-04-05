import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter, 
  DialogDescription 
} from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Transaction, TransactionType, User } from '../../types';
import { cn } from '../../lib/utils';
import { ModernDatePicker, ModernTimePicker } from '../../components/ModernDateTime';
import { UserIcon, FileTextIcon, TagIcon, XIcon } from 'lucide-react';

interface TransactionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (txData: any) => Promise<void>;
  editingTx: Transaction | null;
  initialType: TransactionType;
  user: User;
  bookId: string;
  categories: string[];
  customBookCats: Record<string, string[]>;
  enableCategories: boolean;
  paymentModes: string[];
}

export const TransactionDialog: React.FC<TransactionDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  editingTx,
  initialType,
  user,
  bookId,
  categories,
  customBookCats,
  enableCategories,
  paymentModes,
}) => {
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>(initialType);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5));
  const [note, setNote] = useState('');
  const [partyName, setPartyName] = useState('');
  const [category, setCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingTx) {
      setAmount(editingTx.amount.toString());
      setType(editingTx.type);
      setDate(editingTx.date);
      setTime(editingTx.time);
      setNote(editingTx.note);
      setPartyName(editingTx.partyName || '');
      setCategory(editingTx.category || '');
      setSubCategory(editingTx.subCategory || '');
      setPaymentMode(editingTx.paymentMode || 'Cash');
    } else {
      setAmount('');
      setType(initialType);
      setDate(new Date().toISOString().split('T')[0]);
      setTime(new Date().toTimeString().slice(0, 5));
      setNote('');
      setPartyName('');
      setCategory('');
      setSubCategory('');
      setPaymentMode('Cash');
    }
    setError('');
  }, [editingTx, initialType, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) {
      setError('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      const txData = {
        bookId,
        amount: Number(amount),
        type,
        date,
        time,
        note,
        partyName,
        category: category.trim(),
        subCategory: subCategory.trim(),
        paymentMode,
        entryBy: user.name,
        createdAt: editingTx ? editingTx.createdAt : Date.now()
      };

      await onSave(txData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error saving transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent showCloseButton={false} className="w-full h-full sm:h-auto sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl flex flex-col sm:block rounded-none sm:rounded-2xl">
        <div className={cn(
          "p-6 sm:p-8 text-white shrink-0",
          type === TransactionType.IN ? 'bg-emerald-600' : 'bg-rose-600'
        )}>
          <DialogHeader>
            <div className="flex justify-between items-center sm:block">
              <DialogTitle className="text-white text-2xl sm:text-3xl font-black uppercase tracking-tight font-sans">
                {editingTx ? 'Edit Entry' : (type === TransactionType.IN ? 'Add Cash In' : 'Add Cash Out')}
              </DialogTitle>
              <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/10 rounded-full">
                <XIcon className="w-6 h-6" />
              </Button>
            </div>
            <DialogDescription className="text-white/70 font-medium mt-1">
              Record a new transaction in your ledger.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 sm:flex-none p-4 sm:p-8 space-y-6 bg-white overflow-y-auto scrollbar-hide pb-24 sm:pb-8">
          <div className="space-y-6">
            <div className="space-y-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-sans flex justify-between">
                <span>Amount</span>
                {error && <span className="text-rose-500 animate-pulse">{error}</span>}
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-3xl font-black text-slate-300 font-sans">₹</span>
                <Input
                  autoFocus
                  type="number"
                  inputMode="decimal"
                  placeholder="0"
                  className="pl-12 h-14 text-2xl font-black border-none bg-transparent focus:ring-0 rounded-none font-sans placeholder:text-slate-200"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                <ModernDatePicker value={date} onChange={setDate} label="Date" />
              </div>
              <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                <ModernTimePicker value={time} onChange={setTime} label="Time" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Customer / Party Name</label>
                <div className="relative group">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  <Input
                    placeholder="Enter name (optional)"
                    className="pl-12 h-14 border-slate-100 bg-slate-50/30 rounded-xl focus:bg-white transition-all text-sm font-bold"
                    value={partyName}
                    onChange={e => setPartyName(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Note / Description</label>
                <div className="relative group">
                  <FileTextIcon className="absolute left-4 top-4 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  <textarea
                    placeholder="What is this for?"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50/30 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white min-h-[100px] font-bold transition-all"
                    value={note}
                    onChange={e => setNote(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {enableCategories && (
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Category & Subcategory</label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <TagIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <Input
                        list="category-list"
                        placeholder="Category"
                        className="pl-9 h-14 border-slate-100 bg-slate-50/30 rounded-xl uppercase tracking-tighter text-[10px] font-black"
                        value={category}
                        onChange={e => { setCategory(e.target.value); setSubCategory(''); }}
                      />
                      <datalist id="category-list">
                        {categories.map(c => <option key={c} value={c} />)}
                      </datalist>
                    </div>
                    <div className="relative">
                      <TagIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <Input
                        list="subcategory-list"
                        placeholder="Subcategory"
                        className="pl-9 h-14 border-slate-100 bg-slate-50/30 rounded-xl uppercase tracking-tighter text-[10px] font-black"
                        value={subCategory}
                        onChange={e => setSubCategory(e.target.value)}
                        disabled={!category}
                      />
                      <datalist id="subcategory-list">
                        {(customBookCats[category] || []).map(s => <option key={s} value={s} />)}
                      </datalist>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Payment Mode</label>
              <div className="flex flex-wrap gap-2">
                {paymentModes.map(mode => (
                  <Button
                    key={mode}
                    type="button"
                    variant={paymentMode === mode ? "default" : "outline"}
                    onClick={() => setPaymentMode(mode)}
                    className={cn(
                      "h-14 px-5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                      paymentMode === mode 
                        ? (type === TransactionType.IN ? "bg-emerald-600 shadow-lg shadow-emerald-100" : "bg-rose-600 shadow-lg shadow-rose-100") 
                        : "text-slate-500 border-slate-100 bg-slate-50/30"
                    )}
                  >
                    {mode}
                  </Button>
                ))}
                
                {/* Visual Placeholder for Add New - will be handled by free-text input if needed, 
                    but for now, we'll allow typing in a separate input if 'Other' is picked or just let the user Add in settings.
                    Actually, the user wants to 'Add MORE' in form. I'll add a simple 'Quick Add' input. */}
                <div className="relative flex-1 min-w-[120px]">
                  <Input 
                    placeholder="+ Quick Add Mode" 
                    className="h-14 border-dashed border-slate-200 bg-slate-50/10 text-[10px] font-bold text-center uppercase tracking-widest rounded-xl hover:bg-white hover:border-blue-400 transition-all"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const val = (e.target as HTMLInputElement).value.trim();
                        if (val) {
                          setPaymentMode(val);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t sm:relative sm:p-0 sm:bg-transparent sm:border-none sm:pt-4 flex gap-3">
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading} className="flex-1 h-14 font-black uppercase tracking-widest text-[10px] text-slate-400 sm:hidden">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className={cn(
                "flex-[2.5] h-14 font-black uppercase tracking-widest text-[11px] shadow-2xl rounded-2xl transition-all active:scale-95",
                type === TransactionType.IN ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-100'
              )}
            >
              {loading ? 'Saving...' : (editingTx ? 'Confirm Changes' : `Save ${type === TransactionType.IN ? 'Cash In' : 'Cash Out'}`)}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
