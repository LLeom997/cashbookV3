import { supabase } from '../lib/supabase';
import type { Transaction, TransactionWithBalance } from '../types';
import { TransactionType } from '../types';
import { mapTransaction, mapTransactionsWithBalance, softDeleteById } from './common';

export interface TransactionFilters {
  party?: string;
  category?: string;
  paymentMode?: string;
  search?: string;
}

export interface TransactionDraft extends Omit<Transaction, 'id' | 'createdAt'> {
  createdAt?: number;
}

export const validateTransactionDraft = (tx: TransactionDraft) => {
  const errors: string[] = [];

  if (!tx.bookId) errors.push('Ledger is required');
  if (!Number.isFinite(Number(tx.amount)) || Number(tx.amount) <= 0) errors.push('Amount must be greater than 0');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tx.date)) errors.push('Date must be in YYYY-MM-DD format');
  if (!/^\d{2}:\d{2}$/.test(tx.time)) errors.push('Time must be in HH:mm format');
  if (tx.type !== TransactionType.IN && tx.type !== TransactionType.OUT) errors.push('Transaction type is invalid');

  return {
    valid: errors.length === 0,
    errors,
  };
};

export const buildTransactionInsert = (tx: TransactionDraft) => ({
  ledger_id: tx.bookId,
  cash_in: tx.type === TransactionType.IN ? Number(tx.amount) : 0,
  cash_out: tx.type === TransactionType.OUT ? Number(tx.amount) : 0,
  date: tx.date,
  time: tx.time,
  note: tx.note,
  party_name: tx.partyName,
  category: tx.category,
  payment_mode: tx.paymentMode,
  entry_by: tx.entryBy,
  metadata: tx.metadata || {},
});

export const getTransactionsWithBalance = async (
  bookId: string,
  limit = 1000,
  offset = 0,
  filters?: TransactionFilters
): Promise<TransactionWithBalance[]> => {
  try {
    const pageSize = Math.min(limit, 1000);
    let query = supabase.from('entries').select('*').eq('ledger_id', bookId);

    if (filters?.party && filters.party !== 'ALL') query = query.eq('party_name', filters.party);
    if (filters?.category && filters.category !== 'ALL') query = query.ilike('category', `%${filters.category}%`);
    if (filters?.paymentMode && filters.paymentMode !== 'ALL') query = query.eq('payment_mode', filters.paymentMode);
    if (filters?.search) {
      query = query.or(`note.ilike.%${filters.search}%,party_name.ilike.%${filters.search}%`);
    }

    const { data, error } = await query
      .range(offset, offset + pageSize - 1)
      .order('date', { ascending: false })
      .order('time', { ascending: false })
      .order('id', { ascending: false });

    if (error) {
      console.error('Fetch error:', error);
      return [];
    }

    return mapTransactionsWithBalance(data || []);
  } catch (error) {
    console.error('Fetch failed:', error);
    return [];
  }
};

export const getAllTransactions = async (
  bookId: string,
  filters?: TransactionFilters
): Promise<TransactionWithBalance[]> => {
  const all: TransactionWithBalance[] = [];
  const chunkSize = 1000;
  let offset = 0;

  while (true) {
    const chunk = await getTransactionsWithBalance(bookId, chunkSize, offset, filters);
    if (chunk.length === 0) break;
    all.push(...chunk);
    if (chunk.length < chunkSize) break;
    offset += chunkSize;
  }

  return all;
};

export const getFilteredTotalsChunked = async (
  bookId: string,
  filters: TransactionFilters,
  onChunk: (txs: Transaction[]) => void,
  signal?: AbortSignal
) => {
  const chunkSize = 1000;
  let offset = 0;

  while (true) {
    if (signal?.aborted) break;

    const txs = await getTransactionsWithBalance(bookId, chunkSize, offset, filters);
    if (txs.length === 0) break;

    onChunk(txs);

    if (txs.length < chunkSize) break;
    offset += chunkSize;

    await new Promise((resolve) => setTimeout(resolve, 50));
  }
};

export const getBusinessPartyNames = async (businessId: string): Promise<string[]> => {
  const { data, error } = await supabase
    .from('entries')
    .select(
      `
      party_name,
      ledgers!inner ( project_id )
    `
    )
    .eq('ledgers.project_id', businessId)
    .not('party_name', 'is', null)
    .neq('party_name', '');

  if (error || !data) return [];

  const names = new Set<string>();
  data.forEach((entry: any) => {
    if (entry.party_name) names.add(entry.party_name.trim());
  });

  return Array.from(names).sort();
};

export const addTransaction = async (
  tx: TransactionDraft
): Promise<{ data: Transaction | null; error: string | null }> => {
  const validation = validateTransactionDraft(tx);
  if (!validation.valid) return { data: null, error: validation.errors[0] };

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return { data: null, error: 'Session expired' };

  const { data, error } = await supabase.from('entries').insert([buildTransactionInsert(tx)]).select().single();
  if (error) {
    console.error('Add Transaction Error', error);
    return { data: null, error: error.message };
  }

  return { data: mapTransaction(data), error: null };
};

export const addBulkTransactions = async (transactions: TransactionDraft[]) => {
  for (const tx of transactions) {
    const validation = validateTransactionDraft(tx);
    if (!validation.valid) {
      return { data: null, error: validation.errors[0] };
    }
  }

  const rows = transactions.map(buildTransactionInsert);
  const { data, error } = await supabase.from('entries').insert(rows).select();
  return { data, error: error?.message };
};

export const updateTransaction = async (
  tx: Transaction
): Promise<{ data: Transaction | null; error: string | null }> => {
  const validation = validateTransactionDraft(tx);
  if (!validation.valid) return { data: null, error: validation.errors[0] };

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return { data: null, error: 'Session expired' };

  const { data, error } = await supabase
    .from('entries')
    .update(buildTransactionInsert(tx))
    .eq('id', tx.id)
    .select()
    .single();

  if (error) {
    console.error('Update Transaction Error', error);
    return { data: null, error: error.message };
  }

  return { data: mapTransaction(data), error: null };
};

export const deleteTransaction = async (id: string): Promise<{ error: string | null }> => {
  return softDeleteById(
    async () =>
      supabase
        .from('entries')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', id),
    async () => supabase.from('entries').delete().eq('id', id)
  );
};
