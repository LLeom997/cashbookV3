
import React, { useEffect, useState } from 'react';
import { BookWithTotals, Business, BusinessWithTotals, ProjectCollaborator, JoinCode } from '../types';
import { getBusiness } from '../services/businesses';
import { getBooks, createBook, updateBook, deleteBook } from '../services/ledgers';
import { getCollaborators, removeCollaborator, updateCollaborator, getJoinCodes, generateJoinCode, deleteJoinCode } from '../services/collaborators';
import { ArrowLeftIcon, PlusCircleIcon, PencilIcon, TrashIcon, UserPlusIcon, ChevronRightIcon, WalletIcon, LayoutGridIcon, MailIcon, ShieldCheckIcon, ShieldAlertIcon, ShieldIcon, CheckIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '../components/ui/alert';
import { CheckCircle2Icon, AlertCircleIcon, InfoIcon, XIcon } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { useAppStore } from '../store';
import { LoadingScreen } from '../components/LoadingScreen';

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

  const { dataBooks, setDataBooks, hasHydrated } = useAppStore();
  const books = dataBooks[businessId] || [];
  const setBooks = (newBooks: BookWithTotals[]) => setDataBooks(businessId, newBooks);

  const [business, setBusiness] = useState<BusinessWithTotals | null>(null);
  const [loading, setLoading] = useState(books.length === 0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBookName, setNewBookName] = useState('');
  const [editingBookId, setEditingBookId] = useState<string | null>(null);

  const [alert, setAlert] = useState<{ message: string; type: 'success' | 'destructive' | 'info' } | null>(null);

  // Collaborator State
  const [collaborators, setCollaborators] = useState<ProjectCollaborator[]>([]);
  const [joinCodes, setJoinCodes] = useState<JoinCode[]>([]);
  const [showCollabModal, setShowCollabModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingCollab, setEditingCollab] = useState<ProjectCollaborator | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'editor' | 'viewer'>('viewer');
  const [selectedLedgerIds, setSelectedLedgerIds] = useState<string[]>([]);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  const loadData = async () => {
    if (books.length === 0 || !business) setLoading(true);
    setLoadError(null);
    try {
      const biz = await getBusiness(businessId);
      if (biz) {
        setBusiness(biz);
      }
      const booksData = await getBooks(businessId);
      setBooks(booksData);

      const collabs = await getCollaborators(businessId);
      setCollaborators(collabs);

      const codes = await getJoinCodes(businessId);
      setJoinCodes(codes);
    } catch (e) {
      console.error(e);
      setLoadError("Couldn't load this business.");
      toast.error('Failed to load business data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hasHydrated) return;
    loadData();
  }, [businessId, hasHydrated]);

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

  const handleGenerateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const { code, error } = await generateJoinCode(businessId, inviteRole, selectedLedgerIds);
    if (error) {
      toast.error(error);
    } else {
      toast.success('Join code generated');
      setGeneratedCode(code);
      // Refresh codes
      const codes = await getJoinCodes(businessId);
      setJoinCodes(codes);
    }
  };

  const handleUpdateCollaborator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCollab) return;

    const { error } = await updateCollaborator(editingCollab.id, inviteRole, selectedLedgerIds);
    if (error) {
      toast.error(error);
    } else {
      toast.success('Collaborator updated');
      setShowInviteModal(false);
      setEditingCollab(null);
      // Refresh list
      const collabs = await getCollaborators(businessId);
      setCollaborators(collabs);
    }
  };

  const handleEditCollaborator = (collab: ProjectCollaborator) => {
    setEditingCollab(collab);
    setInviteEmail(collab.userEmail);
    setInviteRole(collab.role);
    setSelectedLedgerIds(collab.accessibleLedgerIds);
    setShowInviteModal(true);
    setShowCollabModal(false);
  };

  const handleRemoveCollaborator = async (id: string) => {
    const { error } = await removeCollaborator(id);
    if (error) {
      toast.error(error);
    } else {
      toast.success('Collaborator removed');
      setCollaborators(collaborators.filter(c => c.id !== id));
    }
  };

  const handleDeleteCode = async (id: string) => {
    const { error } = await deleteJoinCode(id);
    if (error) {
      toast.error(error);
    } else {
      toast.success('Join code deleted');
      setJoinCodes(joinCodes.filter(c => c.id !== id));
      // Also refresh collaborators as they might have been removed by cascade
      const collabs = await getCollaborators(businessId);
      setCollaborators(collabs);
    }
  };

  const toggleLedgerSelection = (id: string) => {
    setSelectedLedgerIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  if (loading && !business) {
    return (
      <LoadingScreen
        compact
        title="Loading business"
        subtitle="Pulling ledgers, permissions, and collaboration details."
      />
    );
  }

  if (!business) {
    return (
      <div className="p-10 text-center text-slate-500">
        {loadError || 'Business not found.'}
      </div>
    );
  }

  // Cumulative totals are now fetched directly from the persistent database columns mapped in storage.ts
  const totalBalance = business.balance;
  const totalIn = business.totalIn;
  const totalOut = business.totalOut;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <header className="bg-white/80 border-b sticky top-0 z-20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 min-h-16 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="rounded-full w-10 h-10">
              <ArrowLeftIcon className="w-6 h-6 sm:w-5 sm:h-5 text-slate-600" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight truncate">{business.name}</h1>
              <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider">Business Overview</p>
            </div>
          </div>
          {business.role === 'owner' && (
            <Button variant="ghost" size="icon" onClick={() => setShowCollabModal(true)} className="rounded-full w-10 h-10">
              <UserPlusIcon className="w-6 h-6 sm:w-5 sm:h-5 text-slate-600" />
            </Button>
          )}
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
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
            <div className="flex items-center gap-2">
              <LayoutGridIcon className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Ledger Books ({books.length})</h3>
            </div>
            {(business.role === 'owner' || business.role === 'admin' || business.role === 'editor') && (
              <Button
                onClick={() => { setEditingBookId(null); setNewBookName(''); setShowAddModal(true); }}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 h-10 shadow-lg shadow-blue-100 font-black uppercase tracking-widest text-[10px]"
              >
                <PlusCircleIcon className="w-4 h-4 mr-2" />
                New Book
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {books.map(book => (
              <Card
                key={book.id}
                onClick={() => navigate(`/ledger/${book.id}`)}
                className="group cursor-pointer hover:shadow-xl hover:border-blue-200 transition-all border-slate-200 overflow-hidden"
              >
                <CardContent className="p-4 sm:p-6">
                  <div className="flex justify-between items-start gap-3 mb-4 sm:mb-6">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-lg sm:text-xl font-black text-slate-900 truncate group-hover:text-blue-600 transition-colors">{book.name}</h4>
                      <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider">Created {new Date(book.createdAt).toLocaleDateString()}</p>
                    </div>
                    {(business.role === 'owner' || business.role === 'admin' || business.role === 'editor') && (
                      <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
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
                    )}
                  </div>

                  <div className="pt-2 flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-end">
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
      {/* Manage Collaborators Dialog */}
      <Dialog open={showCollabModal} onOpenChange={setShowCollabModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-tight">Collaborators</DialogTitle>
            <DialogDescription>
              Manage people who have access to this business.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Button 
              onClick={() => { setShowInviteModal(true); setShowCollabModal(false); setGeneratedCode(null); setEditingCollab(null); }}
              className="w-full bg-blue-600 hover:bg-blue-700 h-12 rounded-xl font-black uppercase tracking-widest text-xs"
            >
              <UserPlusIcon className="w-4 h-4 mr-2" />
              Generate Join Code
            </Button>

            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Active Join Codes ({joinCodes.length})</h4>
              {joinCodes.length === 0 ? (
                <div className="text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <p className="text-[9px] text-slate-400 font-bold uppercase">No active codes.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {joinCodes.map(code => (
                    <div key={code.id} className="flex items-start justify-between gap-3 p-3 bg-blue-50 border border-blue-100 rounded-xl shadow-sm">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="px-2 py-1 bg-blue-600 text-white rounded text-xs font-black tracking-widest">
                          {code.code}
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">{code.role}</p>
                          <p className="text-[8px] text-slate-400 font-bold uppercase">{code.role === 'admin' ? 'Full Access' : `${code.accessibleLedgerIds.length} Books`}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteCode(code.id)} className="text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-full w-8 h-8">
                        <TrashIcon className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Collaborators ({collaborators.length})</h4>
              {collaborators.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <p className="text-xs text-slate-400 font-bold uppercase">No collaborators yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {collaborators.map(collab => (
                    <div key={collab.id} className="flex items-start justify-between gap-3 p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
                          {collab.userEmail[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-800 break-all">{collab.userEmail}</p>
                          <div className="flex items-center gap-1.5">
                            {collab.role === 'admin' && <ShieldCheckIcon className="w-3 h-3 text-blue-600" />}
                            {collab.role === 'editor' && <ShieldIcon className="w-3 h-3 text-emerald-600" />}
                            {collab.role === 'viewer' && <ShieldAlertIcon className="w-3 h-3 text-slate-400" />}
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                              {collab.role} • {collab.role === 'admin' ? 'Full Access' : `${collab.accessibleLedgerIds.length} Books`}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <Button variant="ghost" size="icon" onClick={() => handleEditCollaborator(collab)} className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full w-8 h-8">
                          <PencilIcon className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveCollaborator(collab.id)} className="text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-full w-8 h-8">
                          <TrashIcon className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invite/Edit Collaborator Dialog */}
      <Dialog open={showInviteModal} onOpenChange={(open) => { if (!open) { setShowInviteModal(false); setEditingCollab(null); setInviteEmail(''); setSelectedLedgerIds([]); } }}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-tight">
              {editingCollab ? 'Edit Permissions' : 'Invite Collaborator'}
            </DialogTitle>
            <DialogDescription>
              {editingCollab ? `Update access for ${editingCollab.userEmail}` : 'Share this business with someone via email.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={editingCollab ? handleUpdateCollaborator : handleGenerateCode} className="space-y-6 py-4">
            {editingCollab ? (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Collaborator Email</label>
                <div className="relative">
                  <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    type="email" 
                    value={inviteEmail}
                    disabled
                    className="pl-10 h-12 border-slate-200"
                  />
                </div>
              </div>
            ) : generatedCode ? (
              <div className="p-6 bg-emerald-50 border-2 border-dashed border-emerald-200 rounded-2xl flex flex-col items-center gap-4 animate-in zoom-in duration-300">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <CheckIcon className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Code Generated Successfully</p>
                  <p className="text-xs font-bold text-slate-500">Share this code with your collaborator</p>
                </div>
                <div className="text-4xl font-black tracking-[0.2em] text-slate-900 border-b-4 border-emerald-400 pb-1">
                  {generatedCode}
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => { setShowInviteModal(false); setShowCollabModal(true); }}
                  className="w-full rounded-xl font-black uppercase tracking-widest text-[10px]"
                >
                  Done
                </Button>
              </div>
            ) : null}

            {!generatedCode && (
              <>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Permission Role</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'admin', label: 'Admin', desc: 'Full Control', icon: ShieldCheckIcon, color: 'text-blue-600', bg: 'bg-blue-50' },
                  { id: 'editor', label: 'Editor', desc: 'Can Edit', icon: ShieldIcon, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                  { id: 'viewer', label: 'Viewer', desc: 'Read Only', icon: ShieldAlertIcon, color: 'text-slate-400', bg: 'bg-slate-50' }
                ].map(role => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setInviteRole(role.id as any)}
                    className={cn(
                      "flex flex-col items-center p-3 rounded-xl border-2 transition-all gap-1",
                      inviteRole === role.id ? "border-blue-600 bg-blue-50/50" : "border-slate-100 hover:border-slate-200"
                    )}
                  >
                    <role.icon className={cn("w-5 h-5", role.color)} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{role.label}</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase">{role.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {inviteRole !== 'admin' && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Books to Share</label>
                <div className="max-h-40 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                  {books.map(book => (
                    <button
                      key={book.id}
                      type="button"
                      onClick={() => toggleLedgerSelection(book.id)}
                      className={cn(
                        "w-full flex items-center justify-between p-3 rounded-lg border transition-all",
                        selectedLedgerIds.includes(book.id) ? "border-emerald-200 bg-emerald-50" : "border-slate-100 hover:border-slate-200"
                      )}
                    >
                      <span className="text-xs font-bold text-slate-700">{book.name}</span>
                      {selectedLedgerIds.includes(book.id) && <CheckIcon className="w-4 h-4 text-emerald-600" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

                <DialogFooter className="gap-2 sm:gap-0 mt-6">
                  <Button type="button" variant="ghost" onClick={() => setShowInviteModal(false)} className="flex-1 font-bold">Cancel</Button>
                  <Button 
                    type="submit" 
                    disabled={inviteRole !== 'admin' && selectedLedgerIds.length === 0}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest"
                  >
                    {editingCollab ? 'Save Changes' : 'Generate Code'}
                  </Button>
                </DialogFooter>
              </>
            )}
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
};
