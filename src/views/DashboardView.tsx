
import React, { useEffect, useState } from 'react';
import { BusinessWithTotals, User } from '../types';
import { getBusinesses, createBusiness, updateBusiness, deleteBusiness, useJoinCode } from '../services/storage';
import { PlusCircleIcon, PencilIcon, TrashIcon, SettingsIcon, SearchIcon, LogOutIcon, LayoutDashboardIcon, ListTodoIcon, WalletIcon, TrendingUpIcon, ShieldCheckIcon, UsersIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '../components/ui/alert';
import { CheckCircle2Icon, AlertCircleIcon, InfoIcon, XIcon } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { useAppStore } from '../store';

import { useNavigate } from 'react-router-dom';

interface Props {
  user: User;
  onLogout: () => void;
}

export const DashboardView = ({ user, onLogout }: Props) => {
  const { dataBusinesses: businesses, setDataBusinesses: setBusinesses } = useAppStore();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(businesses.length === 0);

  const [newBizName, setNewBizName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [businessToDelete, setBusinessToDelete] = useState<{ id: string, name: string } | null>(null);
  const [deleteConfirmationName, setDeleteConfirmationName] = useState('');

  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const [alert, setAlert] = useState<{ message: string; type: 'success' | 'destructive' | 'info' } | null>(null);

  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  const loadData = async () => {
    if (businesses.length === 0) setLoading(true);
    try {
      const data = await getBusinesses(user.id);
      setBusinesses(data);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load businesses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user.id]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBizName) return;

    if (editingId) {
      const { error: updateError } = await updateBusiness(editingId, newBizName);
      if (updateError) {
        toast.error(updateError);
        return;
      }
      toast.success('Business updated successfully');
      setAlert({ message: `${newBizName} has been updated.`, type: 'success' });
      setBusinesses(businesses.map(b => b.id === editingId ? { ...b, name: newBizName } : b));
      setNewBizName('');
      setEditingId(null);
      setShowAddModal(false);
    } else {
      const { data, error: createError } = await createBusiness(newBizName);
      if (createError || !data) {
        toast.error(createError || 'Error creating business');
        return;
      }
      toast.success('Business created successfully');
      setAlert({ message: `New business "${newBizName}" created!`, type: 'success' });
      const newBizWithTotals: BusinessWithTotals = {
        ...data,
        totalIn: 0,
        totalOut: 0,
        balance: 0,
        bookCount: 0,
        books: []
      };
      setBusinesses([newBizWithTotals, ...businesses]);
      setNewBizName('');
      setShowAddModal(false);
    }
  };

  const handleEditClick = (b: BusinessWithTotals, e: React.MouseEvent) => {
    e.stopPropagation();
    setNewBizName(b.name);
    setEditingId(b.id);
    setShowAddModal(true);
  };

  const handleDeleteClick = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBusinessToDelete({ id, name });
    setDeleteConfirmationName('');
    setShowDeleteModal(true);
  };

  const handleJoinCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode) return;

    setIsJoining(true);
    const { error } = await useJoinCode(joinCode);
    setIsJoining(false);

    if (error) {
      toast.error(error);
    } else {
      toast.success('Successfully joined business!');
      setJoinCode('');
      setShowJoinModal(false);
      loadData();
    }
  };

  const confirmDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessToDelete) return;

    if (deleteConfirmationName !== businessToDelete.name) {
      toast.error('Name does not match.');
      return;
    }

    const { error } = await deleteBusiness(businessToDelete.id);
    if (error) {
      toast.error(error);
    } else {
      toast.success('Business deleted successfully');
      setAlert({ message: `${businessToDelete.name} has been permanently deleted.`, type: 'destructive' });
      setBusinesses(businesses.filter(b => b.id !== businessToDelete.id));
      setShowDeleteModal(false);
      setBusinessToDelete(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
  };

  const totalBalance = businesses.reduce((acc, b) => acc + b.balance, 0);
  const totalIn = businesses.reduce((acc, b) => acc + b.totalIn, 0);
  const totalOut = businesses.reduce((acc, b) => acc + b.totalOut, 0);

  const filteredBusinesses = businesses.filter(b =>
    b.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <header className="bg-white border-b sticky top-0 z-20 backdrop-blur-md bg-white/80">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <LayoutDashboardIcon className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 hidden sm:block">Cashflow Pro</h1>
          </div>

          <div className="flex items-center gap-1 sm:gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/settings')} className="text-slate-600 px-2 sm:px-3">
              <SettingsIcon className="w-6 h-6 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">Settings</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={onLogout} className="text-red-600 hover:text-red-700 hover:bg-red-50 px-2 sm:px-3">
              <LogOutIcon className="w-6 h-6 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-4 space-y-4">
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

        {/* Lucrative Overview Card */}
        <Card className="bg-gradient-to-br from-indigo-700 via-blue-600 to-blue-700 text-white border-none shadow-2xl overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-48 -mt-48 blur-3xl group-hover:bg-white/20 transition-all duration-700" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/20 rounded-full -ml-32 -mb-32 blur-3xl group-hover:bg-indigo-500/30 transition-all duration-700" />

          <CardContent className="p-5 sm:p-6 relative z-10">
            <div className="flex justify-between items-start mb-4 sm:mb-6">
              <div className="space-y-1 sm:space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <p className="text-blue-100 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] opacity-80">Global Portfolio Balance</p>
                </div>
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight drop-shadow-sm">{formatCurrency(totalBalance)}</h2>
              </div>
              <div className="flex flex-col items-end gap-3">
                <div className="hidden sm:block p-3 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10">
                  <WalletIcon className="w-6 h-6 text-white/80" />
                </div>
                <Button
                  onClick={(e) => { e.stopPropagation(); navigate('/analytics'); }}
                  variant="ghost"
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl px-4 py-2 h-auto group/btn transition-all backdrop-blur-md shadow-lg"
                >
                  <div className="flex flex-col items-start mr-3">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Insights</span>
                    <span className="text-xs font-bold">Analytics</span>
                  </div>
                  <div className="p-1 bg-blue-500 rounded-lg group-hover/btn:translate-x-1 transition-transform">
                    <TrendingUpIcon className="w-4 h-4" />
                  </div>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:gap-6 pt-4 sm:pt-6 border-t border-white/20">
              <div className="space-y-0.5 sm:space-y-1">
                <p className="text-blue-200 text-[9px] sm:text-[10px] font-black uppercase tracking-widest opacity-70">Total Cash In</p>
                <div className="flex items-center gap-2">
                  <p className="text-xl sm:text-2xl font-black text-emerald-300">+{formatCurrency(totalIn).replace('₹', '')}</p>
                </div>
              </div>
              <div className="space-y-0.5 sm:space-y-1">
                <p className="text-blue-200 text-[9px] sm:text-[10px] font-black uppercase tracking-widest opacity-70">Total Cash Out</p>
                <div className="flex items-center gap-2">
                  <p className="text-xl sm:text-2xl font-black text-rose-300">-{formatCurrency(totalOut).replace('₹', '')}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search and Action Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search businesses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 bg-white border-slate-200 focus:ring-blue-500 rounded-xl"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => setShowJoinModal(true)}
              className="flex-1 sm:flex-none h-10 border-blue-200 text-blue-600 hover:bg-blue-50 rounded-xl font-bold"
            >
              <UsersIcon className="w-4 h-4 mr-2" />
              Join Business
            </Button>
            <Button
              onClick={() => { setEditingId(null); setNewBizName(''); setShowAddModal(true); }}
              className="flex-1 sm:flex-none h-10 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 rounded-xl font-bold"
            >
              <PlusCircleIcon className="w-4 h-4 mr-2" />
              New Business
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800">My Businesses ({filteredBusinesses.length})</h3>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <Card key={i} className="animate-pulse bg-slate-100 h-48 border-none" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredBusinesses.map(b => (
                <Card
                  key={b.id}
                  onClick={() => navigate(`/business/${b.id}`)}
                  className="group cursor-pointer hover:shadow-xl hover:border-blue-200 transition-all duration-300 border-slate-200 relative overflow-hidden"
                >


                  <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <CardTitle className="text-lg sm:text-xl font-bold group-hover:text-blue-600 transition-colors truncate max-w-[150px] sm:max-w-[200px] flex items-center gap-2">
                          {b.name}
                          {b.isShared && (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[8px] uppercase tracking-tighter">
                              <UsersIcon className="w-2 h-2" />
                              Shared
                            </span>
                          )}
                        </CardTitle>
                        <CardDescription className="text-[10px] sm:text-xs flex items-center gap-1">
                          {b.bookCount} Ledgers 
                          {b.isShared && (
                            <span className="text-slate-300">• {b.role}</span>
                          )}
                        </CardDescription>
                      </div>
                      <div className={cn(
                        "px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-bold",
                        b.balance >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                      )}>
                        {formatCurrency(b.balance).replace('₹', '')}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 pt-0 space-y-3">
                    {/* Quick Access Books */}
                    {b.books && b.books.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {b.books.slice(0, 2).map(book => (
                          <Button
                            key={book.id}
                            variant="secondary"
                            size="sm"
                            className="h-7 text-[10px] font-bold bg-slate-100 hover:bg-blue-100 hover:text-blue-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/ledger/${book.id}`);
                            }}
                          >
                            {book.name}
                          </Button>
                        ))}
                        {b.books.length > 2 && (
                          <span className="text-[10px] text-slate-400 self-center">+{b.books.length - 2} more</span>
                        )}
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                      <div className="flex gap-4 text-xs">
                        <div className="space-y-0.5">
                          <p className="text-slate-400 font-medium uppercase text-[9px]">Cash In</p>
                          <p className="text-emerald-600 font-bold">{formatCurrency(b.totalIn).replace('₹', '')}</p>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-slate-400 font-medium uppercase text-[9px]">Cash Out</p>
                          <p className="text-rose-600 font-bold">{formatCurrency(b.totalOut).replace('-', '').replace('₹', '')}</p>
                        </div>
                      </div>

                      {!b.isShared || b.role === 'admin' ? (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                            onClick={(e) => handleEditClick(b, e)}
                          >
                            <PencilIcon className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            onClick={(e) => handleDeleteClick(b.id, b.name, e)}
                          >
                            <TrashIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-[8px] font-black text-slate-300 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                          <ShieldCheckIcon className="w-3 h-3" />
                          {b.role} Access
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredBusinesses.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                  <div className="bg-slate-50 p-4 rounded-full mb-4">
                    <SearchIcon className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-slate-500 font-medium">
                    {searchTerm ? `No businesses matching "${searchTerm}"` : "No businesses yet. Add one to get started."}
                  </p>
                  {searchTerm && (
                    <Button variant="link" onClick={() => setSearchTerm('')} className="text-blue-600">
                      Clear search
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Add/Edit Business Dialog */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Business' : 'Create New Business'}</DialogTitle>
            <DialogDescription>
              Enter a name for your business to organize your ledgers.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Business Name</label>
              <Input
                autoFocus
                placeholder="e.g. Cafe Downtown"
                value={newBizName}
                onChange={e => setNewBizName(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setShowAddModal(false)}>Cancel</Button>
              <Button type="submit" disabled={!newBizName} className="bg-blue-600 hover:bg-blue-700">
                {editingId ? 'Update Business' : 'Create Business'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-rose-600">Delete Business?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. All books and transactions inside <strong>{businessToDelete?.name}</strong> will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={confirmDelete} className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">
                Type <span className="text-slate-900 select-all">{businessToDelete?.name}</span> to confirm
              </label>
              <Input
                autoFocus
                placeholder={businessToDelete?.name}
                value={deleteConfirmationName}
                onChange={e => setDeleteConfirmationName(e.target.value)}
                className="border-rose-200 focus:ring-rose-500"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={deleteConfirmationName !== businessToDelete?.name}
              >
                Delete Forever
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* Join Business Dialog */}
      <Dialog open={showJoinModal} onOpenChange={setShowJoinModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Join Business</DialogTitle>
            <DialogDescription>
              Enter the join code shared with you to access another user's business.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleJoinCode} className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Join Code</label>
              <Input
                autoFocus
                placeholder="e.g. AB12CD"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                className="h-12 text-center text-2xl font-black tracking-[0.2em] border-slate-200"
                maxLength={6}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setShowJoinModal(false)}>Cancel</Button>
              <Button 
                type="submit" 
                disabled={!joinCode || isJoining} 
                className="bg-blue-600 hover:bg-blue-700 min-w-[100px]"
              >
                {isJoining ? 'Joining...' : 'Join Now'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
