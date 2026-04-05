
import React, { useEffect, useState } from 'react';
import { BookWithTotals, Business, BusinessWithTotals } from '../types';
import { getBooks, getBusiness, createBook, updateBook, deleteBook } from '../services/storage';
import { ArrowLeftIcon, PlusCircleIcon, PencilIcon, TrashIcon, UserPlusIcon, ChevronRightIcon, WalletIcon, LayoutGridIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '../components/ui/alert';
import { CheckCircle2Icon, AlertCircleIcon, InfoIcon, XIcon } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { useAppStore } from '../store';

import { useNavigate, useParams } from 'react-router-dom';

interface Props {
  // Navigation is now handled by react-router-dom
}

export const BusinessDetailView = ({ }: Props) => {
  const { businessId } = useParams<{ businessId: string }>();
  const navigate = useNavigate();

  if (!businessId) {
    return <div className="p-10 text-center">Business ID missing</div>;
  }

  const { dataBooks, setDataBooks } = useAppStore();
  const books = dataBooks[businessId] || [];
  const setBooks = (newBooks: BookWithTotals[]) => setDataBooks(businessId, newBooks);

  const [business, setBusiness] = useState<BusinessWithTotals | null>(null);
  const [loading, setLoading] = useState(books.length === 0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBookName, setNewBookName] = useState('');
  const [editingBookId, setEditingBookId] = useState<string | null>(null);

  const [alert, setAlert] = useState<{ message: string; type: 'success' | 'destructive' | 'info' } | null>(null);

  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  const loadData = async () => {
    if (books.length === 0 || !business) setLoading(true);
    try {
      const biz = await getBusiness(businessId);
      if (biz) {
        setBusiness(biz);
      }
      const booksData = await getBooks(businessId);
      setBooks(booksData);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load business data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [businessId]);

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBookName) return;

    if (editingBookId) {
      const { error: updateError } = await updateBook(editingBookId, newBookName);
      if (updateError) {
        toast.error(updateError);
        return;
      }
      toast.success('Book updated');
      setAlert({ message: `Ledger "${newBookName}" has been updated.`, type: 'success' });
      setBooks(books.map(b => b.id === editingBookId ? { ...b, name: newBookName } : b));
      setNewBookName('');
      setEditingBookId(null);
      setShowAddModal(false);
    } else {
      const { error: createError, data: newBook } = await createBook(businessId, newBookName);
      if (createError || !newBook) {
        toast.error(createError || 'Error creating book');
        return;
      }
      toast.success('Book created');
      setAlert({ message: `New ledger book "${newBookName}" created successfully!`, type: 'success' });
      const newBookWithTotals: BookWithTotals = {
        ...newBook,
        totalIn: 0,
        totalOut: 0,
        countIn: 0,
        countOut: 0,
        balance: 0
      };
      setBooks([newBookWithTotals, ...books]);
      setNewBookName('');
      setShowAddModal(false);
    }
  };

  const handleEditBook = (book: BookWithTotals, e: React.MouseEvent) => {
    e.stopPropagation();
    setNewBookName(book.name);
    setEditingBookId(book.id);
    setShowAddModal(true);
  };

  const handleDeleteBook = async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const { error } = await deleteBook(id);
    if (error) {
      toast.error(String(error));
    } else {
      toast.success('Book deleted');
      setAlert({ message: `Ledger "${name}" was permanently deleted.`, type: 'destructive' });
      setBooks(books.filter(b => b.id !== id));
      // Refresh business totals (Master Card)
      loadData();
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
  };

  if (loading && !business) {
    return <div className="p-10 text-center animate-pulse text-slate-400">Loading business...</div>;
  }

  if (!business) {
    return <div className="p-10 text-center text-slate-500">Business not found.</div>;
  }

  // Cumulative totals are now fetched directly from the persistent database columns mapped in storage.ts
  const totalBalance = business.balance;
  const totalIn = business.totalIn;
  const totalOut = business.totalOut;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <header className="bg-white border-b sticky top-0 z-20 backdrop-blur-md bg-white/80">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="rounded-full w-10 h-10">
              <ArrowLeftIcon className="w-6 h-6 sm:w-5 sm:h-5 text-slate-600" />
            </Button>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">{business.name}</h1>
              <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider">Business Overview</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => navigate('/settings')} className="rounded-full w-10 h-10">
            <UserPlusIcon className="w-6 h-6 sm:w-5 sm:h-5 text-slate-600" />
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {alert && (
          <Alert variant={alert.type} className="animate-in fade-in slide-in-from-top-4 duration-300 relative">
            {alert.type === 'success' && <CheckCircle2Icon className="size-4" />}
            {alert.type === 'destructive' && <AlertCircleIcon className="size-4" />}
            {alert.type === 'info' && <InfoIcon className="size-4" />}
            <AlertTitle>
              {alert.type === 'success' ? 'Success' : alert.type === 'destructive' ? 'Permanently Deleted' : 'Notification'}
            </AlertTitle>
            <AlertDescription>{alert.message}</AlertDescription>
            <button
              onClick={() => setAlert(null)}
              className="absolute top-3 right-3 p-1 rounded-full opacity-50 hover:opacity-100 transition-opacity"
            >
              <XIcon className="size-3" />
            </button>
          </Alert>
        )}

        {/* Business Summary */}
        <Card className="border-none shadow-md bg-blue-600 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
          <CardContent className="p-5 sm:p-8">
            <div className="flex items-center gap-3 mb-2 sm:mb-3">
              <div className="p-1.5 sm:p-2 bg-white/10 rounded-lg">
                <WalletIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <p className="text-[9px] sm:text-xs font-bold text-white/70 uppercase tracking-widest">Total Business Balance</p>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4 sm:mb-6">
              {formatCurrency(totalBalance)}
            </h2>

            <div className="grid grid-cols-2 gap-4 sm:gap-8 pt-4 sm:pt-6 border-t border-white/10">
              <div className="space-y-0.5 sm:space-y-1">
                <p className="text-blue-200 text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Total Cash In</p>
                <p className="text-lg sm:text-xl font-bold text-emerald-300">+{formatCurrency(totalIn).replace('₹', '')}</p>
              </div>
              <div className="space-y-0.5 sm:space-y-1">
                <p className="text-blue-200 text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Total Cash Out</p>
                <p className="text-lg sm:text-xl font-bold text-blue-100">-{formatCurrency(totalOut).replace('₹', '')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Books List Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <LayoutGridIcon className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Ledger Books ({books.length})</h3>
            </div>
            <Button
              onClick={() => { setEditingBookId(null); setNewBookName(''); setShowAddModal(true); }}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 h-10 shadow-lg shadow-blue-100 font-black uppercase tracking-widest text-[10px]"
            >
              <PlusCircleIcon className="w-4 h-4 mr-2" />
              New Book
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {books.map(book => (
              <Card
                key={book.id}
                onClick={() => navigate(`/ledger/${book.id}`)}
                className="group cursor-pointer hover:shadow-xl hover:border-blue-200 transition-all border-slate-200 overflow-hidden"
              >
                <CardContent className="p-4 sm:p-6">
                  <div className="flex justify-between items-start mb-4 sm:mb-6">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-lg sm:text-xl font-black text-slate-900 truncate group-hover:text-blue-600 transition-colors">{book.name}</h4>
                      <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider">Created {new Date(book.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                        onClick={(e) => handleEditBook(book, e)}
                      >
                        <PencilIcon className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        onClick={(e) => handleDeleteBook(book.id, book.name, e)}
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-between items-end">
                    <div className="flex gap-4">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Cash In</p>
                        <p className="text-sm font-black text-emerald-600">+{formatCurrency(book.totalIn).replace('₹', '')}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Cash Out</p>
                        <p className="text-sm font-black text-rose-600">-{formatCurrency(book.totalOut).replace('₹', '')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5 text-right">Net Balance</p>
                      <p className={cn(
                        "text-lg font-black tracking-tight leading-none",
                        book.balance >= 0 ? 'text-blue-600' : 'text-rose-600'
                      )}>
                        {formatCurrency(book.balance)}
                      </p>
                      <div className="flex justify-end mt-2">
                        <div className="p-1 px-2 bg-slate-50 rounded-full group-hover:bg-blue-50 transition-colors flex items-center gap-1">
                          <span className="text-[8px] font-bold text-slate-400 group-hover:text-blue-600 transition-colors uppercase">Details</span>
                          <ChevronRightIcon className="w-3 h-3 text-slate-300 group-hover:text-blue-600" />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {books.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                <div className="bg-slate-50 p-4 rounded-full mb-4">
                  <LayoutGridIcon className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-slate-500 font-medium">No ledger books in this business yet.</p>
                <Button
                  variant="link"
                  onClick={() => setShowAddModal(true)}
                  className="mt-2 text-blue-600 font-bold"
                >
                  Create your first book
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Add/Edit Book Dialog */}
      <Dialog open={showAddModal} onOpenChange={(open) => { if (!open) { setShowAddModal(false); setNewBookName(''); setEditingBookId(null); } }}>
        <DialogContent className="sm:max-w-[400px] p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-tight">
              {editingBookId ? 'Edit Book Name' : 'New Ledger Book'}
            </DialogTitle>
            <DialogDescription className="text-slate-500 font-medium">
              Give your ledger book a name to start tracking transactions.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddBook} className="space-y-6 mt-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Book Name</label>
              <Input
                autoFocus
                placeholder="e.g. Daily Sales, Personal Expenses"
                className="h-12 border-slate-200 font-medium"
                value={newBookName}
                onChange={e => setNewBookName(e.target.value)}
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="ghost" onClick={() => setShowAddModal(false)} className="flex-1 font-bold">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!newBookName}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest shadow-lg shadow-blue-100"
              >
                {editingBookId ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
