import React, { useEffect, useId, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Transaction, TransactionType, User } from '../../types';
import { cn } from '../../lib/utils';
import { ModernDatePicker, ModernTimePicker } from '../../components/ModernDateTime';
import {
  UserIcon,
  FileTextIcon,
  TagIcon,
  XIcon,
  ArrowDownCircleIcon,
  ArrowUpCircleIcon
} from 'lucide-react';

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

  const amountId = useId();
  const partyId = useId();
  const noteId = useId();
  const categoryId = useId();
  const subCategoryId = useId();
  const quickAddModeId = useId();
  const errorId = useId();
  const categoryListId = useId();
  const subcategoryListId = useId();

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
    if (!amount || Number.isNaN(Number(amount)) || Number(amount) <= 0) {
      setError('Enter a valid amount greater than zero');
      return;
    }

    setLoading(true);
    try {
      await onSave({
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
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error saving transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="flex h-full w-full flex-col overflow-hidden rounded-none border-none p-0 shadow-2xl sm:h-auto sm:max-w-[920px] sm:rounded-2xl"
      >
        <div className="flex flex-1 flex-col sm:grid sm:grid-cols-[320px_minmax(0,1fr)]">
          <aside
            className={cn(
              'shrink-0 border-b p-6 text-white sm:border-r sm:border-b-0 sm:p-8',
              type === TransactionType.IN ? 'border-emerald-500/20 bg-emerald-600' : 'border-rose-500/20 bg-rose-600'
            )}
          >
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                    {editingTx ? 'Edit transaction' : 'New transaction'}
                  </DialogTitle>
                  <DialogDescription className="mt-2 max-w-xs font-medium text-white/70">
                    Record money moving in or out of this ledger.
                  </DialogDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full text-white hover:bg-white/10">
                  <XIcon className="h-6 w-6" />
                </Button>
              </div>
            </DialogHeader>

            <div className="mt-6 space-y-4">
              <fieldset className="space-y-3">
                <legend className="text-[11px] font-black uppercase tracking-[0.22em] text-white/65">
                  Transaction Type
                </legend>

                <div className="grid gap-3">
                  <button
                    type="button"
                    aria-pressed={type === TransactionType.IN}
                    onClick={() => setType(TransactionType.IN)}
                    className={cn(
                      'flex items-start gap-3 rounded-2xl border p-4 text-left transition-all',
                      type === TransactionType.IN
                        ? 'border-white/25 bg-white/14 shadow-sm'
                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                    )}
                  >
                    <ArrowUpCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-white" />
                    <div>
                      <p className="text-sm font-black text-white">Cash in</p>
                      <p className="mt-1 text-xs font-medium text-white/70">Income, receipts, customer payments, deposits.</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    aria-pressed={type === TransactionType.OUT}
                    onClick={() => setType(TransactionType.OUT)}
                    className={cn(
                      'flex items-start gap-3 rounded-2xl border p-4 text-left transition-all',
                      type === TransactionType.OUT
                        ? 'border-white/25 bg-white/14 shadow-sm'
                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                    )}
                  >
                    <ArrowDownCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-white" />
                    <div>
                      <p className="text-sm font-black text-white">Cash out</p>
                      <p className="mt-1 text-xs font-medium text-white/70">Expenses, withdrawals, supplier payments, refunds.</p>
                    </div>
                  </button>
                </div>
              </fieldset>

              <fieldset className="space-y-3 rounded-2xl border border-white/10 bg-white/8 p-4">
                <legend className="px-2 text-[11px] font-black uppercase tracking-[0.22em] text-white/65">
                  Amount
                </legend>

                <label htmlFor={amountId} className="flex justify-between text-[10px] font-black uppercase tracking-widest text-white/65">
                  <span>{type === TransactionType.IN ? 'Cash in amount' : 'Cash out amount'}</span>
                  {error && (
                    <span id={errorId} className="text-amber-200" aria-live="polite">
                      {error}
                    </span>
                  )}
                </label>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-white/45 sm:text-3xl">Rs</span>
                  <Input
                    id={amountId}
                    autoFocus
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    placeholder="0"
                    aria-describedby={error ? errorId : undefined}
                    className="h-16 rounded-xl border-none bg-white/10 pl-12 text-2xl font-black text-white placeholder:text-white/30 focus:bg-white/15 focus:ring-2 focus:ring-white/20 sm:text-3xl"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>
              </fieldset>
            </div>
          </aside>

          <form onSubmit={handleSubmit} className="flex-1 space-y-5 overflow-y-auto bg-white p-4 pb-24 sm:p-8 sm:pb-8">
            <fieldset className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
              <legend className="px-2 text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">
                Timing
              </legend>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-3">
                  <ModernDatePicker value={date} onChange={setDate} label="Date" />
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-3">
                  <ModernTimePicker value={time} onChange={setTime} label="Time" />
                </div>
              </div>
            </fieldset>

            <fieldset className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
              <legend className="px-2 text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">
                Details
              </legend>

              <div className="space-y-2">
                <label htmlFor={partyId} className="pl-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Customer or party name
                </label>
                <div className="group relative">
                  <UserIcon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-500" />
                  <Input
                    id={partyId}
                    autoComplete="organization"
                    placeholder="Who is this transaction with?"
                    className="h-14 rounded-xl border-slate-100 bg-slate-50/30 pl-12 text-sm font-bold transition-all focus:bg-white"
                    value={partyName}
                    onChange={(e) => setPartyName(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor={noteId} className="pl-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Description
                </label>
                <div className="group relative">
                  <FileTextIcon className="absolute left-4 top-4 h-4 w-4 text-slate-400 transition-colors group-focus-within:text-blue-500" />
                  <textarea
                    id={noteId}
                    placeholder="Add a short explanation for this transaction"
                    className="min-h-[120px] w-full rounded-2xl border border-slate-100 bg-slate-50/30 py-4 pl-12 pr-4 text-sm font-bold transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>
              </div>
            </fieldset>

            {enableCategories && (
              <fieldset className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
                <legend className="px-2 text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">
                  Classification
                </legend>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor={categoryId} className="pl-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Category
                    </label>
                    <div className="relative">
                      <TagIcon className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                      <Input
                        id={categoryId}
                        list={categoryListId}
                        placeholder="Category"
                        className="h-14 rounded-xl border-slate-100 bg-slate-50/30 pl-9 text-[10px] font-black uppercase tracking-tighter"
                        value={category}
                        onChange={(e) => {
                          setCategory(e.target.value);
                          setSubCategory('');
                        }}
                      />
                      <datalist id={categoryListId}>
                        {categories.map((c) => <option key={c} value={c} />)}
                      </datalist>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor={subCategoryId} className="pl-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Subcategory
                    </label>
                    <div className="relative">
                      <TagIcon className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                      <Input
                        id={subCategoryId}
                        list={subcategoryListId}
                        placeholder="Subcategory"
                        className="h-14 rounded-xl border-slate-100 bg-slate-50/30 pl-9 text-[10px] font-black uppercase tracking-tighter"
                        value={subCategory}
                        onChange={(e) => setSubCategory(e.target.value)}
                        disabled={!category}
                      />
                      <datalist id={subcategoryListId}>
                        {(customBookCats[category] || []).map((s) => <option key={s} value={s} />)}
                      </datalist>
                    </div>
                  </div>
                </div>
              </fieldset>
            )}

            <fieldset className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
              <legend className="px-2 text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">
                Payment mode
              </legend>

              <div className="flex flex-wrap gap-2" role="group" aria-label="Payment mode options">
                {paymentModes.map((mode) => (
                  <Button
                    key={mode}
                    type="button"
                    variant={paymentMode === mode ? 'default' : 'outline'}
                    onClick={() => setPaymentMode(mode)}
                    aria-pressed={paymentMode === mode}
                    className={cn(
                      'h-12 rounded-xl px-4 text-[10px] font-black uppercase tracking-widest transition-all',
                      paymentMode === mode
                        ? (type === TransactionType.IN ? 'bg-emerald-600 shadow-lg shadow-emerald-100' : 'bg-rose-600 shadow-lg shadow-rose-100')
                        : 'border-slate-100 bg-slate-50/30 text-slate-500'
                    )}
                  >
                    {mode}
                  </Button>
                ))}

                <div className="relative min-w-[150px] basis-full sm:flex-1">
                  <label htmlFor={quickAddModeId} className="sr-only">Add a new payment mode</label>
                  <Input
                    id={quickAddModeId}
                    placeholder="+ Add payment mode"
                    className="h-12 rounded-xl border-dashed border-slate-200 bg-slate-50/10 text-center text-[10px] font-bold uppercase tracking-widest transition-all hover:border-blue-400 hover:bg-white"
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
            </fieldset>

            <div className="fixed bottom-0 left-0 right-0 flex gap-3 border-t bg-white/80 p-4 backdrop-blur-md sm:relative sm:border-none sm:bg-transparent sm:p-0 sm:pt-2">
              <Button type="button" variant="ghost" onClick={onClose} disabled={loading} className="h-14 flex-1 text-[10px] font-black uppercase tracking-widest text-slate-400 sm:h-12 sm:flex-none sm:px-6">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className={cn(
                  'h-14 flex-[2.5] rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-2xl transition-all active:scale-95 sm:h-12 sm:flex-1',
                  type === TransactionType.IN ? 'bg-emerald-600 shadow-emerald-100 hover:bg-emerald-700' : 'bg-rose-600 shadow-rose-100 hover:bg-rose-700'
                )}
              >
                {loading ? 'Saving...' : (editingTx ? 'Save changes' : `Save ${type === TransactionType.IN ? 'cash in' : 'cash out'}`)}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
