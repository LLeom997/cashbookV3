import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Book, Transaction, TransactionType, User, TransactionWithBalance } from '../types';
import {
  updateTransaction,
  deleteTransaction,
  addBulkTransactions,
  addTransaction,
  getBusiness,
  getBook,
  getTransactionsWithBalance,
  updateBookTotals,
  fetchLedgerCustomSettings,
  addLedgerCategory,
  deleteLedgerCategory,
  addLedgerSubcategory,
  deleteLedgerSubcategory,
  addLedgerPaymentMode,
  deleteLedgerPaymentMode,
  syncLedgerSettings,
  updateLedgerSettings
} from '../services/storage';
import { fetchLedgerData } from '../services/ledgerService';
import {
  ArrowLeftIcon,
  PlusCircleIcon,
  DownloadIcon,
  BarChart3Icon,
  TagIcon,
  SettingsIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  InfoIcon,
  XIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '../components/ui/alert';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { useAppStore } from '../store';

// Modular Components
import { SummaryCards } from './BookDetail/SummaryCards';
import { FilterBar } from './BookDetail/FilterBar';
import { TransactionTable } from './BookDetail/TransactionTable';
import { TransactionDialog } from './BookDetail/TransactionDialog';
import { CategoryManager } from './BookDetail/CategoryManager';

// Utilities
import {
  parseDateString,
  parseTimeString,
  parseCSVRow,
  formatCurrency
} from '../lib/utils';

interface Props {
  // Navigation handled by react-router-dom
}

export const BookDetailView = ({ }: Props) => {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();

  if (!bookId) return <div className="p-10 text-center">Ledger ID missing</div>;

  const {
    dataTransactions,
    setDataTransactions,
    customBookCategories,
    setCustomBookCategories,
    customBookPaymentModes,
    setCustomBookPaymentModes,
    bookSettings,
    setBookSettings,
    dataTotals,
    setDataTotals,
    user
  } = useAppStore();

  const transactions = dataTransactions[bookId] || [];
  const setTransactions = (newTxs: TransactionWithBalance[]) => setDataTransactions(bookId, newTxs);

  const [book, setBook] = useState<Book | null>(null);
  const [role, setRole] = useState<'owner' | 'admin' | 'editor' | 'viewer'>('viewer');
  const [loading, setLoading] = useState(transactions.length === 0);
  const [rowsLimit, setRowsLimit] = useState(100);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showManageCategories, setShowManageCategories] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [addType, setAddType] = useState<TransactionType>(TransactionType.OUT);
  const [selectedTxs, setSelectedTxs] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [filterParty, setFilterParty] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterPaymentMode, setFilterPaymentMode] = useState('ALL');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [sortField, setSortField] = useState<string>('date');

  const [filteredTotals, setFilteredTotals] = useState({ totalIn: 0, totalOut: 0, balance: 0 });
  const [isCalculatingTotals, setIsCalculatingTotals] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const totalsAbortController = useRef<AbortController | null>(null);

  const isFiltered = filterParty !== 'ALL' || filterCategory !== 'ALL' || filterPaymentMode !== 'ALL' || searchTerm !== '';

  const [alert, setAlert] = useState<{ message: string; type: 'success' | 'destructive' | 'info' } | null>(null);

  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  // Reset to Page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterParty, filterCategory, filterPaymentMode]);

  const displayTotals = useMemo(() => {
    if (isFiltered) return filteredTotals;
    return dataTotals[bookId] || { totalIn: 0, totalOut: 0, balance: 0 };
  }, [isFiltered, filteredTotals, dataTotals, bookId]);

  const loadData = useCallback(async (isAppend: boolean = false) => {
    if (!isAppend && (transactions.length === 0 || !book)) setLoading(true);

    try {
      // 1. Fetch Ledger Info
      const ledger = await getBook(bookId);
      if (ledger) {
        setBook(ledger);
        // 2. Fetch Business Role
        const biz = await getBusiness(ledger.businessId);
        if (biz) {
          setRole(biz.role as any);
        }
      }

      let currentOffset = 0;
      const chunkSize = 1000;
      let allTxs: Transaction[] = [];

      // Chunked Streaming Load
      while (true) {
        const txs = await getTransactionsWithBalance(bookId, chunkSize, currentOffset);
        if (txs.length === 0) break;

        allTxs = [...allTxs, ...txs];
        const processed = sortTransactions(allTxs);
        setTransactions(processed);

        // Update Summary Cards from the loaded dataset
        updateLocalTotals(processed);

        if (txs.length < chunkSize) break;
        currentOffset += chunkSize;
        // Small delay to allow main thread breathing room
        await new Promise(r => setTimeout(r, 20));
      }

      // --- Cloud Sync for Custom Settings ---
      const { categories: cloudCats, paymentModes: cloudModes } = await fetchLedgerCustomSettings(bookId);

      // Simple merge/migration: if local has data and cloud doesn't, we'll eventually push on next change.
      // However, we prioritize cloud data if it exists.
      if (Object.keys(cloudCats).length > 0) {
        setCustomBookCategories(bookId, cloudCats);
      } else if (Object.keys(customBookCategories[bookId] || {}).length > 0) {
        // One-time auto-migration: push local defaults to cloud
        for (const [catName, subs] of Object.entries(customBookCategories[bookId])) {
          await addLedgerCategory(bookId, catName);
          for (const sub of subs) await addLedgerSubcategory(bookId, catName, sub);
        }
      }

      if (cloudModes.length > 0) {
        setCustomBookPaymentModes(bookId, cloudModes);
      } else if ((customBookPaymentModes[bookId] || []).length > 0) {
        for (const m of customBookPaymentModes[bookId]) await addLedgerPaymentMode(bookId, m);
      }

    } catch (e) {
      console.error(e);
      toast.error("Failed to load ledger data");
    } finally {
      setLoading(false);
    }
  }, [bookId, book, transactions.length]);

  useEffect(() => {
    loadData();
  }, [bookId]);

  const sortTransactions = (txs: any[]) => {
    const sortedAsc = [...txs].sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`).getTime();
      const dateB = new Date(`${b.date}T${b.time}`).getTime();
      return dateA - dateB;
    });
    return sortedAsc.reverse();
  };

  const updateLocalTotals = (txs: any[]) => {
    const t = txs.reduce(
      (acc, tx) => {
        if (tx.type === TransactionType.IN) return { ...acc, totalIn: acc.totalIn + tx.amount, balance: acc.balance + tx.amount };
        else return { ...acc, totalOut: acc.totalOut + tx.amount, balance: acc.balance - tx.amount };
      },
      { totalIn: 0, totalOut: 0, balance: 0 }
    );

    if (isFiltered) {
      setFilteredTotals(t);
    } else {
      setDataTotals(bookId, t);
      // "Clear Action": Post the UI's summary card values to the backend tables
      updateBookTotals(bookId, t);
    }
  };

  const handleSaveTransaction = async (txData: any) => {
    try {
      if (editingTx) {
        const { data, error } = await updateTransaction({ ...editingTx, ...txData });
        if (error) throw new Error(error);
        if (data) {
          const updatedTxs = transactions.map(t => t.id === data.id ? { ...t, ...data } : t);
          setTransactions(sortTransactions(updatedTxs));
          // updateLocalTotals handles the DB push
          updateLocalTotals(updatedTxs);
          toast.success('Transaction updated');
        }
      } else {
        const { data, error } = await addTransaction({ ...txData, bookId });
        if (error) throw new Error(error);
        if (data) {
          const newTxs = [data, ...transactions];
          setTransactions(sortTransactions(newTxs));
          // updateLocalTotals handles the DB push
          updateLocalTotals(newTxs);
          toast.success('Transaction added');
        }
      }
      setShowAddModal(false);
      setEditingTx(null);
    } catch (e: any) {
      toast.error(e.message || "Failed to save transaction");
    }
  };

  const handleDelete = async (id: string | Set<string>) => {
    try {
      const idsToDelete = typeof id === 'string' ? [id] : Array.from(id);
      for (const targetId of idsToDelete) {
        const { error } = await deleteTransaction(targetId);
        if (error) throw new Error(error);
      }

      const remainingTxs = transactions.filter(t =>
        typeof id === 'string' ? t.id !== id : !id.has(t.id)
      );

      setTransactions(sortTransactions(remainingTxs));
      updateLocalTotals(remainingTxs);
      setSelectedTxs(new Set());
      toast.success(idsToDelete.length > 1 ? `Deleted ${idsToDelete.length} transactions` : 'Transaction deleted');
    } catch (e: any) {
      toast.error(e.message || "Failed to delete");
    }
  };

  const handleExportCSV = () => {
    if (transactions.length === 0) {
      toast.error("No transactions to export");
      return;
    }

    const headers = [
      "ID",
      "Date",
      "Time",
      "Party Name",
      "Cash In",
      "Cash Out",
      "Payment Mode",
      "Category",
      "Subcategory",
      "Remark",
      "Entry By",
      "Created At",
      "Metadata"
    ];

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return "";
      const str = String(val);
      if (str.includes(",") || str.includes("\"") || str.includes("\n")) {
        return `"${str.replace(/"/g, "\"\"")}"`;
      }
      return str;
    };

    const rows = transactions.map(tx => {
      const cashIn = tx.type === TransactionType.IN ? tx.amount : 0;
      const cashOut = tx.type === TransactionType.OUT ? tx.amount : 0;

      return [
        tx.id,
        tx.date,
        tx.time,
        escapeCsv(tx.partyName || ""),
        cashIn,
        cashOut,
        escapeCsv(tx.paymentMode || "Cash"),
        escapeCsv(tx.category || "General"),
        escapeCsv(tx.subCategory || ""),
        escapeCsv(tx.note || ""),
        escapeCsv(tx.entryBy || ""),
        new Date(tx.createdAt).toISOString(),
        escapeCsv(tx.metadata ? JSON.stringify(tx.metadata) : "")
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    const fileName = `ledger_export_${book?.name ? book.name.replace(/\s+/g, '_') : 'list'}_${new Date().toISOString().split('T')[0]}.csv`;

    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Exported ${transactions.length} transactions`);
  };

  const syncNewPaymentMode = (mode: string) => {
    if (!mode || mode === 'ALL') return;
    const current = customBookPaymentModes[bookId] || ['Cash', 'Online', 'Bank'];
    if (!current.includes(mode)) {
      setCustomBookPaymentModes(bookId, [...current, mode]);
    }
  };

  const syncNewCategory = (cat: string) => {
    if (!cat) return;
    const current = customBookCategories[bookId] || {};
    if (!current[cat]) {
      setCustomBookCategories(bookId, { ...current, [cat]: [] });
    }
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim().length > 0);
      if (lines.length < 2) return;

      let delimiter = ',';
      if (lines[0].indexOf('\t') !== -1 && lines[0].indexOf(',') === -1) delimiter = '\t';
      else if (lines[0].indexOf(';') !== -1 && lines[0].indexOf(',') === -1) delimiter = ';';

      const headers = parseCSVRow(lines[0], delimiter).map(h => h.trim().toLowerCase());
      const getIdx = (name: string) => headers.find(h => h.includes(name)) ? headers.findIndex(h => h.includes(name)) : -1;

      const dateIdx = getIdx('date');
      const timeIdx = getIdx('time');
      const noteIdx = getIdx('remark');
      const entryByIdx = getIdx('entry by');
      const partyIdx = getIdx('party');
      const paymentModeIdx = getIdx('mode');
      const cashInIdx = getIdx('cash in');
      const cashOutIdx = getIdx('cash out');

      const allNewTxs: Partial<Transaction>[] = [];

      for (let i = 1; i < lines.length; i++) {
        const row = parseCSVRow(lines[i], delimiter);
        if (row.length === 0 || (row.length === 1 && row[0] === '')) continue;

        const cashIn = parseFloat(row[cashInIdx]?.trim().replace(/[^0-9.-]+/g, "") || "0");
        const cashOut = parseFloat(row[cashOutIdx]?.trim().replace(/[^0-9.-]+/g, "") || "0");

        let amount = 0;
        let type: TransactionType;

        if (cashIn > 0 && cashOut === 0) {
          amount = cashIn;
          type = TransactionType.IN;
        } else if (cashOut > 0 && cashIn === 0) {
          amount = cashOut;
          type = TransactionType.OUT;
        } else continue;

        allNewTxs.push({
          bookId,
          amount,
          type,
          date: dateIdx >= 0 ? parseDateString(row[dateIdx]?.trim()) : new Date().toISOString().split('T')[0],
          time: timeIdx >= 0 ? parseTimeString(row[timeIdx]?.trim()) : new Date().toTimeString().slice(0, 5),
          partyName: partyIdx >= 0 ? row[partyIdx]?.trim() || '' : '',
          note: noteIdx >= 0 ? row[noteIdx]?.trim() || '' : '',
          paymentMode: paymentModeIdx >= 0 ? row[paymentModeIdx]?.trim() || 'Cash' : 'Cash',
          entryBy: entryByIdx >= 0 ? row[entryByIdx]?.trim() : user.name,
          createdAt: Date.now() + i
        });

        // Auto-sync discovered types
        if (paymentModeIdx >= 0 && row[paymentModeIdx]) syncNewPaymentMode(row[paymentModeIdx].trim());
      }

      if (allNewTxs.length > 0) {
        setImporting(true);
        setImportProgress({ current: 0, total: allNewTxs.length });
        try {
          const chunkSize = 1000;
          for (let i = 0; i < allNewTxs.length; i += chunkSize) {
            setImportProgress(prev => ({ ...prev, current: i }));
            const chunk = allNewTxs.slice(i, i + chunkSize);
            const res = await addBulkTransactions(chunk as any);
            if (res.error) throw new Error(res.error);
          }
          setImportProgress({ current: allNewTxs.length, total: allNewTxs.length });

          setAlert({
            message: `Successfully imported ${allNewTxs.length} transactions in chunks.`,
            type: 'success'
          });

          await loadData(false);
          toast.success(`Imported ${allNewTxs.length} records`);
        } catch (e) {
          toast.error("Import failed");
        } finally {
          setImporting(false);
          setImportProgress({ current: 0, total: 0 });
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      }
    };
    reader.readAsText(file);
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const matchesSearch = tx.note.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tx.partyName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tx.category || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesParty = filterParty === 'ALL' || tx.partyName === filterParty;
      const matchesCategory = filterCategory === 'ALL' || (tx.category && tx.category.split(',').map(c => c.trim()).includes(filterCategory));
      const matchesPaymentMode = filterPaymentMode === 'ALL' || tx.paymentMode === filterPaymentMode;
      return matchesSearch && matchesParty && matchesCategory && matchesPaymentMode;
    });
  }, [transactions, searchTerm, filterParty, filterCategory, filterPaymentMode]);

  // Real-time Summary Aggregator for Filters
  useEffect(() => {
    if (isFiltered) {
      updateLocalTotals(filteredTransactions);
    }
  }, [isFiltered, filteredTransactions]);

  const sortedTransactions = useMemo(() => {
    const list = [...filteredTransactions].sort((a, b) => {
      let comp = 0;
      if (sortField === 'date') {
        comp = new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime();
      } else if (sortField === 'party') {
        comp = (a.partyName || '').localeCompare(b.partyName || '');
      } else if (sortField === 'entryBy') {
        comp = (a.entryBy || '').localeCompare(b.entryBy || '');
      } else if (sortField === 'cashIn') {
        comp = (a.type === 'IN' ? a.amount : 0) - (b.type === 'IN' ? b.amount : 0);
      } else if (sortField === 'cashOut') {
        comp = (a.type === 'OUT' ? a.amount : 0) - (b.type === 'OUT' ? b.amount : 0);
      } else if (sortField === 'balance') {
        comp = a.runningBalance - b.runningBalance;
      }
      return sortOrder === 'desc' ? -comp : comp;
    });
    return list;
  }, [filteredTransactions, sortField, sortOrder]);

  const totalPages = Math.ceil(sortedTransactions.length / rowsLimit);
  const paginatedTransactions = useMemo(() => {
    return sortedTransactions.slice((currentPage - 1) * rowsLimit, currentPage * rowsLimit);
  }, [sortedTransactions, currentPage, rowsLimit]);

  const parties = useMemo(() => Array.from(new Set(transactions.map(t => t.partyName).filter(Boolean))), [transactions]) as string[];
  const categoriesFromData = useMemo(() => {
    const cats = new Set<string>();
    transactions.forEach(t => t.category?.split(',').forEach(c => cats.add(c.trim())));
    return Array.from(cats).sort();
  }, [transactions]);

  const bookSpecificCats = customBookCategories[bookId] || {};
  const allCategories = useMemo(() => {
    const combined = new Set([...categoriesFromData, ...Object.keys(bookSpecificCats)]);
    return Array.from(combined).sort();
  }, [categoriesFromData, bookSpecificCats]);

  const payModesFromData = useMemo(() => Array.from(new Set(transactions.map(t => t.paymentMode).filter(Boolean))), [transactions]) as string[];
  const bookSpecificModes = customBookPaymentModes[bookId] || ['Cash', 'Online', 'Bank'];

  const allPaymentModes = useMemo(() => {
    const combined = new Set([...payModesFromData, ...bookSpecificModes]);
    return Array.from(combined).sort();
  }, [payModesFromData, bookSpecificModes]);

  const settings = bookSettings[bookId] || { enableCategories: true };
  const customBookCats = useMemo(() => {
    const map: Record<string, string[]> = {};
    const rawCustom = customBookCategories[bookId];
    if (Array.isArray(rawCustom)) rawCustom.forEach(c => map[c] = []);
    else if (rawCustom) Object.assign(map, rawCustom);

    transactions.forEach(t => {
      const c = t.category?.trim();
      if (c && !map[c]) map[c] = [];
      const sub = t.subCategory?.trim();
      if (c && sub && !map[c].includes(sub)) map[c].push(sub);
    });
    return map;
  }, [customBookCategories, bookId, transactions]);

  const handleSort = (field: string) => {
    if (sortField === field) setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortOrder('desc'); }
  };

  if (loading && transactions.length === 0) return <div className="p-10 text-center animate-pulse text-slate-400">Loading ledger...</div>;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-32 relative">
      {importing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 p-8 bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-sm w-full">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <div className="text-center space-y-1">
              <p className="text-sm font-black text-slate-800 uppercase tracking-widest">Importing Records</p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                {importProgress.current} / {importProgress.total} Rows
              </p>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-full transition-all duration-300"
                style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      <header className="bg-white border-b sticky top-0 z-20 backdrop-blur-md bg-white/80">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
              <ArrowLeftIcon className="w-5 h-5 text-slate-600" />
            </Button>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">{book?.name || 'Loading...'}</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ledger Details</p>
            </div>
          </div>
          <div className="flex gap-2">
            <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleImportCSV} />
            {role !== 'viewer' && (
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="flex items-center">
                <PlusCircleIcon className="w-4 h-4 mr-1.5 sm:mr-2" /> 
                <span className="text-[10px] sm:text-sm">Import</span>
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleExportCSV} className="flex items-center">
              <DownloadIcon className="w-4 h-4 mr-1.5 sm:mr-2" /> 
              <span className="text-[10px] sm:text-sm">Export</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {alert && (
          <Alert variant={alert.type} className="animate-in fade-in slide-in-from-top-4 duration-300 relative">
            {alert.type === 'success' && <CheckCircle2Icon className="size-4" />}
            {alert.type === 'destructive' && <AlertCircleIcon className="size-4" />}
            {alert.type === 'info' && <InfoIcon className="size-4" />}
            <AlertTitle>
              {alert.type === 'success' ? 'Import Success' : alert.type === 'destructive' ? 'Permanently Deleted' : 'Notification'}
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

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 py-2">
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest hidden md:block">Transactions</h3>
          <div className="flex gap-2 w-full md:w-auto items-center">
            {selectedTxs.size > 0 && role !== 'viewer' && (
              <Button onClick={() => handleDelete(selectedTxs)} variant="destructive" className="flex-1 md:flex-none font-bold uppercase tracking-widest text-[10px] h-10 shadow-sm animate-in fade-in zoom-in">
                <PlusCircleIcon className="w-4 h-4 md:mr-2 rotate-45" />
                <span className="hidden md:inline">Delete {selectedTxs.size}</span>
              </Button>
            )}
            {role !== 'viewer' && (
              <Button onClick={() => setShowManageCategories(true)} variant="outline" className="flex-1 md:flex-none bg-white border-slate-200 text-slate-600 font-bold uppercase tracking-widest text-[10px] h-10 shadow-sm hover:border-blue-400 hover:text-blue-600 transition-all">
                <SettingsIcon className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">Settings</span>
              </Button>
            )}
          </div>
        </div>

        <SummaryCards
          totalIn={displayTotals.totalIn}
          totalOut={displayTotals.totalOut}
          balance={displayTotals.balance}
          isLoading={isCalculatingTotals}
        />

        <FilterBar
          searchTerm={searchTerm} setSearchTerm={setSearchTerm}
          showMobileFilters={showMobileFilters} setShowMobileFilters={setShowMobileFilters}
          filterParty={filterParty} setFilterParty={setFilterParty} parties={parties}
          filterCategory={filterCategory} setFilterCategory={setFilterCategory} categories={allCategories}
          filterPaymentMode={filterPaymentMode} setFilterPaymentMode={setFilterPaymentMode} payModes={allPaymentModes}
        />

        <TransactionTable
          transactions={paginatedTransactions}
          selectedTxs={selectedTxs}
          onSelectTx={(id, sel) => {
            const next = new Set(selectedTxs);
            if (sel) next.add(id); else next.delete(id);
            setSelectedTxs(next);
          }}
          onEditTx={(tx) => { 
            if (role === 'viewer') return;
            setEditingTx(tx); 
            setAddType(tx.type); 
            setShowAddModal(true); 
          }}
          sortField={sortField} sortOrder={sortOrder} onSort={handleSort}
          visibleColumns={settings.visibleColumns}
        />

        {sortedTransactions.length > 0 && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm gap-4">
              <div className="flex flex-col gap-1">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Showing {(currentPage - 1) * rowsLimit + 1} to {Math.min(currentPage * rowsLimit, sortedTransactions.length)} of {sortedTransactions.length} results
                </p>
                {isCalculatingTotals && <span className="text-[10px] animate-pulse text-blue-600 font-bold uppercase tracking-widest leading-none">(Syncing more records...)</span>}
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline" size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => prev - 1)}
                    className="h-8 w-8 p-0 rounded-lg border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600 disabled:opacity-30"
                  >
                    &lt;
                  </Button>
                  <div className="flex items-center gap-1.5 px-3">
                    <span className="text-xs font-black text-slate-800 tracking-tight">Page {currentPage}</span>
                    <span className="text-xs font-bold text-slate-300">/</span>
                    <span className="text-xs font-bold text-slate-400 tracking-tight">{totalPages}</span>
                  </div>
                  <Button
                    variant="outline" size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    className="h-8 w-8 p-0 rounded-lg border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600 disabled:opacity-30"
                  >
                    &gt;
                  </Button>
                </div>

                <div className="flex items-center gap-2 border-l pl-4 border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Limit:</p>
                  <select
                    value={rowsLimit}
                    onChange={e => { setRowsLimit(Number(e.target.value)); setCurrentPage(1); }}
                    className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:ring-1 focus:ring-blue-400"
                  >
                    <option value={100}>100</option><option value={200}>200</option><option value={500}>500</option><option value={1000}>1000</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {role !== 'viewer' && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex gap-4 z-30">
          <Button size="lg" onClick={() => { setEditingTx(null); setAddType(TransactionType.IN); setShowAddModal(true); }} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-8 h-14 shadow-xl font-black uppercase tracking-widest text-xs">
            <PlusCircleIcon className="w-5 h-5 mr-2" /> Cash In
          </Button>
          <Button size="lg" onClick={() => { setEditingTx(null); setAddType(TransactionType.OUT); setShowAddModal(true); }} className="bg-rose-600 hover:bg-rose-700 text-white rounded-full px-8 h-14 shadow-xl font-black uppercase tracking-widest text-xs">
            <PlusCircleIcon className="w-5 h-5 mr-2" /> Cash Out
          </Button>
        </div>
      )}

      <TransactionDialog
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); setEditingTx(null); }}
        onSave={async (tx) => {
          if (editingTx) {
            await updateTransaction({ ...editingTx, ...tx });
            toast.success("Transaction updated");
          } else {
            await addTransaction({ ...tx, bookId });
            toast.success("Transaction added");
          }
          // Quick Sync Check
          syncNewPaymentMode(tx.paymentMode || '');
          if (tx.category) syncNewCategory(tx.category);

          setShowAddModal(false);
          setEditingTx(null);
          loadData(false);
        }}
        initialType={addType}
        editingTx={editingTx}
        user={user}
        bookId={bookId}
        categories={allCategories}
        customBookCats={bookSpecificCats}
        enableCategories={settings.enableCategories}
        paymentModes={allPaymentModes}
      />

      <CategoryManager
        isOpen={showManageCategories}
        onClose={async () => {
          setShowManageCategories(false);
          // Persist EVERYTHING to Supabase on close
          await syncLedgerSettings(bookId, {
            categories: bookSpecificCats,
            paymentModes: bookSpecificModes
          });
          await updateLedgerSettings(bookId, settings);
          toast.success("Settings synced to cloud");
        }}
        bookId={bookId}
        categories={allCategories}
        customBookCats={bookSpecificCats}
        enableCategories={settings.enableCategories}
        onToggleCategories={(v) => setBookSettings(bookId, { enableCategories: v })}
        onRenameCategory={async (old, n) => {
          const updated = { ...bookSpecificCats };
          updated[n] = updated[old] || [];
          delete updated[old];
          setCustomBookCategories(bookId, updated);
          toast.success("Category renamed (Local)");
        }}
        onDeleteCategory={async (name) => {
          const updated = { ...bookSpecificCats };
          delete updated[name];
          setCustomBookCategories(bookId, updated);
          toast.success("Category deleted (Local)");
        }}
        onAddCategory={async (name) => {
          setCustomBookCategories(bookId, { ...bookSpecificCats, [name]: [] });
          toast.success("Category added (Local)");
        }}
        onRenameSubcategory={async (p, old, n) => {
          const updated = { ...bookSpecificCats };
          updated[p] = (updated[p] || []).map(s => s === old ? n : s);
          setCustomBookCategories(bookId, updated);
        }}
        onDeleteSubcategory={async (p, s) => {
          const updated = { ...bookSpecificCats };
          updated[p] = (updated[p] || []).filter(sub => sub !== s);
          setCustomBookCategories(bookId, updated);
        }}
        onAddSubcategory={async (p, s) => {
          const updated = { ...bookSpecificCats };
          updated[p] = [...(updated[p] || []), s];
          setCustomBookCategories(bookId, updated);
        }}
        paymentModes={allPaymentModes}
        onAddPaymentMode={async (name) => {
          setCustomBookPaymentModes(bookId, [...bookSpecificModes, name]);
          toast.success("Payment mode added (Local)");
        }}
        onDeletePaymentMode={async (name) => {
          setCustomBookPaymentModes(bookId, bookSpecificModes.filter(m => m !== name));
          toast.success("Payment mode deleted (Local)");
        }}
        onRenamePaymentMode={async (old, n) => {
          setCustomBookPaymentModes(bookId, bookSpecificModes.map(m => m === old ? n : m));
          toast.success("Payment mode renamed (Local)");
        }}
        visibleColumns={settings.visibleColumns || { date: true, party: true, remark: true, entryBy: true, cashIn: true, cashOut: true }}
        onUpdateSettings={(s) => setBookSettings(bookId, s)}
      />
    </div>
  );
};
