import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, BusinessWithTotals, BookWithTotals, TransactionWithBalance } from './types';
import { Todo } from './views/TodoView';

interface AppState {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;

  // UI Preferences & Filters
  filters: {
    searchTerm: string;
    filterType: 'ALL' | 'IN' | 'OUT';
    filterParty: string;
    filterPaymentMode: string;
    filterCategory: string;
    filterSubCategory: string;
    filterDuration: string;
    dateStart: string;
    dateEnd: string;
  };
  setFilters: (filters: Partial<AppState['filters']>) => void;
  resetFilters: () => void;

  // Persistent Cached Data
  dataBusinesses: BusinessWithTotals[];
  dataBooks: Record<string, BookWithTotals[]>;
  dataTransactions: Record<string, TransactionWithBalance[]>;
  dataTodos: Todo[];
  dataTotals: Record<string, { totalIn: number, totalOut: number, balance: number, lastUpdated: number }>;
  customBookCategories: Record<string, Record<string, string[]>>;
  customBookPaymentModes: Record<string, string[]>;
  bookSettings: Record<string, { enableCategories: boolean, visibleColumns?: Record<string, boolean> }>;
  setDataBusinesses: (businesses: BusinessWithTotals[]) => void;
  setDataBooks: (businessId: string, books: BookWithTotals[]) => void;
  setDataTransactions: (bookId: string, txs: TransactionWithBalance[]) => void;
  setDataTodos: (todos: Todo[]) => void;
  setDataTotals: (bookId: string, totals: { totalIn: number, totalOut: number, balance: number }) => void;
  setCustomBookCategories: (bookId: string, categories: Record<string, string[]>) => void;
  setCustomBookPaymentModes: (bookId: string, modes: string[]) => void;
  setBookSettings: (bookId: string, settings: { enableCategories: boolean }) => void;
  updateUser: (updates: Partial<User>) => void;
}

const initialFilters = {
  searchTerm: '',
  filterType: 'ALL' as const,
  filterParty: 'All',
  filterPaymentMode: 'All',
  filterCategory: 'All',
  filterSubCategory: 'All',
  filterDuration: 'All Time',
  dateStart: '',
  dateEnd: '',
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      logout: () => set({ user: null, filters: initialFilters }),

      filters: initialFilters,
      setFilters: (newFilters) => set((state) => ({
        filters: { ...state.filters, ...newFilters }
      })),
      resetFilters: () => set({ filters: initialFilters }),

      dataBusinesses: [],
      dataBooks: {},
      dataTransactions: {},
      dataTodos: [],
      dataTotals: {},
      customBookCategories: {},
      customBookPaymentModes: {},
      bookSettings: {},
      setDataBusinesses: (businesses) => set({ dataBusinesses: businesses }),
      setDataBooks: (businessId, books) => set((state) => ({
        dataBooks: { ...state.dataBooks, [businessId]: books }
      })),
      setDataTransactions: (bookId, txs) => set((state) => ({
        dataTransactions: { ...state.dataTransactions, [bookId]: txs }
      })),
      setDataTodos: (todos) => set({ dataTodos: todos }),
      setDataTotals: (bookId, totals) => set((state) => ({
        dataTotals: { ...state.dataTotals, [bookId]: { ...totals, lastUpdated: Date.now() } }
      })),
      setCustomBookCategories: (bookId, categories) => set((state) => ({
        customBookCategories: { ...state.customBookCategories, [bookId]: categories }
      })),
      setCustomBookPaymentModes: (bookId, modes) => set((state) => ({
        customBookPaymentModes: { ...state.customBookPaymentModes, [bookId]: modes }
      })),
      setBookSettings: (bookId, settings) => set((state) => ({
        bookSettings: {
          ...state.bookSettings,
          [bookId]: {
            ...(state.bookSettings[bookId] || { enableCategories: true, visibleColumns: { date: true, party: true, remark: true, entryBy: true, cashIn: true, cashOut: true } }),
            ...settings
          }
        }
      })),
      updateUser: (updates) => set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null
      })),
    }),
    {
      name: 'cashflow-app-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        dataBusinesses: state.dataBusinesses,
        dataBooks: state.dataBooks,
        dataTotals: state.dataTotals,
        dataTodos: state.dataTodos,
        customBookCategories: state.customBookCategories,
        customBookPaymentModes: state.customBookPaymentModes,
        bookSettings: state.bookSettings,
        // Exclude dataTransactions to stay within localStorage limits
      }),
    }
  )
);
