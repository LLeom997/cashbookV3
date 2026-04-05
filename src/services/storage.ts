
import { Business, Book, Transaction, TransactionType, User, BusinessWithTotals, BookWithTotals, TransactionWithBalance, CustomCategory, CustomSubcategory, CustomField, CustomPaymentMode, AppSettings } from '../types';
import { supabase } from '../lib/supabase';

const STORAGE_KEYS = {
  USER: 'cashflow_user',
};

export const signUpUser = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) throw error;

  return data.user;
};

export const signInUser = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) throw error;

  return {
    id: data.user.id,
    email: data.user.email,
  };
};

export const logoutUser = async () => {
  await supabase.auth.signOut();
  localStorage.removeItem(STORAGE_KEYS.USER);
};

// --- Utils & Helpers ---

const parseNum = (val: any) => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  return parseFloat(String(val).replace(/[^0-9.-]+/g, "")) || 0;
};

// --- Business (Projects) ---

export const getBusinesses = async (userId: string): Promise<BusinessWithTotals[]> => {
  const { data: ownedData, error: ownedError } = await supabase
    .from('projects')
    .select(`
      *,
      ledgers (
        id, name, created_at
      )
    `)
    .eq('owner_id', userId)
    .order('created_at', { ascending: false });

  if (ownedError) console.error("Owned Error", ownedError);

  const ownedBusinesses = ownedData || [];

  return ownedBusinesses.map((b: any) => {
    let totalIn = 0;
    let totalOut = 0;
    let bookCount = 0;
    let books: BookWithTotals[] = [];

    if (b.ledgers) {
      bookCount = b.ledgers.length;
      books = b.ledgers.map((book: any) => ({
        id: book.id,
        businessId: b.id,
        name: book.name,
        createdAt: new Date(book.created_at).getTime(),
        totalIn: Number(book.total_in || 0),
        totalOut: Number(book.total_out || 0),
        countIn: 0,
        countOut: 0,
        balance: Number(book.balance || 0)
      }));
      books.sort((a, b) => b.createdAt - a.createdAt);
    }

    return {
      id: b.id,
      userId: b.owner_id,
      name: b.name,
      currency: b.currency,
      createdAt: new Date(b.created_at).getTime(),
      totalIn: Number(b.total_in || 0),
      totalOut: Number(b.total_out || 0),
      balance: Number(b.balance || 0),
      bookCount,
      books,
    };
  });
};

export const getBusiness = async (id: string): Promise<BusinessWithTotals | undefined> => {
  const { data } = await supabase.from('projects').select('*').eq('id', id).single();
  if (!data) return undefined;
  return {
    id: data.id,
    userId: data.owner_id,
    name: data.name,
    currency: data.currency,
    createdAt: new Date(data.created_at).getTime(),
    totalIn: Number(data.total_in || 0),
    totalOut: Number(data.total_out || 0),
    balance: Number(data.balance || 0),
    bookCount: 0
  };
};

export const createBusiness = async (name: string): Promise<{ data: Business | null, error: string | null }> => {
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return { data: null, error: 'Session expired. Please log in again.' };
  }

  const { data, error } = await supabase
    .from('projects')
    .insert([
      {
        owner_id: user.id,
        name,
      },
    ])
    .select('id, owner_id, name, currency, created_at')
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return {
    data: {
      id: data.id,
      userId: data.owner_id,
      name: data.name,
      currency: data.currency,
      createdAt: new Date(data.created_at).getTime(),
    },
    error: null,
  };
};

export const updateBusiness = async (id: string, name: string): Promise<{ error: string | null }> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { error: "Session expired" };

  const { error } = await supabase
    .from('projects')
    .update({ name })
    .eq('id', id);

  if (error) {
    console.error("Update Business Error", error);
    return { error: error.message };
  }
  return { error: null };
};

export const deleteBusiness = async (id: string): Promise<{ error: string | null }> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { error: "Session expired" };

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id);

  if (error) {
    console.error("Delete Business Error", error);
    return { error: error.message };
  }
  return { error: null };
};

// --- Books (Ledgers) ---

export const getBooks = async (businessId: string): Promise<BookWithTotals[]> => {
  const { data, error } = await supabase
    .from('ledgers')
    .select(`
      *
    `)
    .eq('project_id', businessId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return data.map((b: any) => ({
    id: b.id,
    businessId: b.project_id,
    name: b.name,
    createdAt: new Date(b.created_at).getTime(),
    totalIn: Number(b.total_in || 0),
    totalOut: Number(b.total_out || 0),
    countIn: 0,
    countOut: 0,
    balance: Number(b.balance || 0)
  }));
};

export const getBook = async (id: string): Promise<Book | undefined> => {
  const { data } = await supabase.from('ledgers').select('*').eq('id', id).single();
  if (!data) return undefined;
  return {
    id: data.id,
    businessId: data.project_id,
    name: data.name,
    createdAt: new Date(data.created_at).getTime()
  };
};

export const getBookTotals = async (bookId: string): Promise<BookWithTotals | null> => {
  const { data, error } = await supabase
    .from('ledgers')
    .select(`*`)
    .eq('id', bookId)
    .single();

  if (error || !data) return null;

  let totalIn = 0;
  let totalOut = 0;
  let countIn = 0;
  let countOut = 0;

  return {
    id: data.id,
    businessId: data.project_id,
    name: data.name,
    createdAt: new Date(data.created_at).getTime(),
    totalIn,
    totalOut,
    countIn,
    countOut,
    balance: totalIn - totalOut
  };
};

/**
 * Direct summary update: Replaces incremental sync with a "push all" total update.
 * Updates both the ledger row and aggregates the parent project total.
 */
export const updateBookTotals = async (ledgerId: string, totals: { totalIn: number, totalOut: number, balance: number }) => {
  // 1. Update the ledger row directly
  const { data: ledger, error: lError } = await supabase
    .from('ledgers')
    .update({
      total_in: totals.totalIn,
      total_out: totals.totalOut,
      balance: totals.balance
    })
    .eq('id', ledgerId)
    .select('project_id')
    .single();

  if (lError || !ledger) {
    console.error("Update Ledger Totals Error", lError);
    return;
  }

  // 2. Refresh parent project summary
  await refreshProjectSummary(ledger.project_id);
};

export const refreshProjectSummary = async (projectId: string) => {
  // Fetch all ledgers for this project to update parent business summary
  const { data: siblingLedgers } = await supabase
    .from('ledgers')
    .select('total_in, total_out')
    .eq('project_id', projectId);

  if (siblingLedgers) {
    const projectTotIn = siblingLedgers.reduce((acc, l) => acc + Number(l.total_in || 0), 0);
    const projectTotOut = siblingLedgers.reduce((acc, l) => acc + Number(l.total_out || 0), 0);

    await supabase
      .from('projects')
      .update({
        total_in: projectTotIn,
        total_out: projectTotOut,
        balance: projectTotIn - projectTotOut
      })
      .eq('id', projectId);
  }
};

export const createBook = async (businessId: string, name: string): Promise<{ data: Book | null, error: string | null }> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { data: null, error: "Session expired" };

  const { data, error } = await supabase
    .from('ledgers')
    .insert([{ project_id: businessId, name }])
    .select()
    .single();

  if (error) {
    console.error("Create Book Error", error);
    return { data: null, error: error.message };
  }

  return {
    data: {
      id: data.id,
      businessId: data.project_id,
      name: data.name,
      createdAt: new Date(data.created_at).getTime()
    },
    error: null
  };
};

export const updateBook = async (id: string, name: string): Promise<{ error: string | null }> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { error: "Session expired" };

  const { error } = await supabase
    .from('ledgers')
    .update({ name })
    .eq('id', id);

  if (error) {
    console.error("Update Book Error", error);
    return { error: error.message };
  }
  return { error: null };
};

export const deleteBook = async (id: string): Promise<{ error: string | null }> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { error: "Session expired" };

  // Fetch book to get project_id before deletion
  const { data: book } = await supabase.from('ledgers').select('project_id').eq('id', id).single();

  const { error } = await supabase
    .from('ledgers')
    .delete()
    .eq('id', id);

  if (error) {
    console.error("Delete Book Error", error);
    return { error: error.message };
  }

  // Update business totals after deletion
  if (book?.project_id) {
    await refreshProjectSummary(book.project_id);
  }

  return { error: null };
};

// --- Transactions (Entries) ---

// --- Transactions (Entries) ---

export const getTransactionsWithBalance = async (
  bookId: string,
  limit: number = 1000,
  offset: number = 0,
  filters?: any
): Promise<TransactionWithBalance[]> => {
  try {
    const pageSize = Math.min(limit, 1000);

    let query = supabase
      .from('entries')
      .select('*')
      .eq('ledger_id', bookId);

    if (filters) {
      if (filters.party && filters.party !== 'ALL')
        query = query.eq('party_name', filters.party);

      if (filters.category && filters.category !== 'ALL')
        query = query.ilike('category', `%${filters.category}%`);

      if (filters.paymentMode && filters.paymentMode !== 'ALL')
        query = query.eq('payment_mode', filters.paymentMode);

      if (filters.search)
        query = query.or(
          `note.ilike.%${filters.search}%,party_name.ilike.%${filters.search}%`
        );
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

    return mapTransactions(data || []);
  } catch (err) {
    console.error("Fetch failed:", err);
    return [];
  }
};

// ✅ Full fetch helper (for exports / totals)
export const getAllTransactions = async (
  bookId: string,
  filters?: any
): Promise<TransactionWithBalance[]> => {
  const all: TransactionWithBalance[] = [];
  const chunkSize = 1000;
  let offset = 0;

  while (true) {
    const chunk = await getTransactionsWithBalance(
      bookId,
      chunkSize,
      offset,
      filters
    );

    if (chunk.length === 0) break;

    all.push(...chunk);

    if (chunk.length < chunkSize) break;

    offset += chunkSize;
  }

  return all;
};

// ✅ Hydrator (streaming aggregation)
export const getFilteredTotalsChunked = async (
  bookId: string,
  filters: any,
  onChunk: (txs: Transaction[]) => void,
  signal?: AbortSignal
): Promise<void> => {
  const chunkSize = 1000;
  let offset = 0;
  let totalFetched = 0;

  while (true) {
    if (signal?.aborted) break;

    const txs = await getTransactionsWithBalance(
      bookId,
      chunkSize,
      offset,
      filters
    );

    if (txs.length === 0) break;

    totalFetched += txs.length;
    onChunk(txs);

    if (txs.length < chunkSize) break;

    offset += chunkSize;

    await new Promise(r => setTimeout(r, 50));
  }
};


const mapTransactions = (data: any[]): TransactionWithBalance[] => {
  const txs: Transaction[] = data.map(mapTransaction).filter((t): t is Transaction => t !== null);

  const sortedAsc = [...txs].sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time}`).getTime();
    const dateB = new Date(`${b.date}T${b.time}`).getTime();
    return dateA - dateB;
  });

  let running = 0;
  const withBalance = sortedAsc.map(tx => {
    if (tx.type === TransactionType.IN) {
      running += tx.amount;
    } else {
      running -= tx.amount;
    }
    return { ...tx, runningBalance: running };
  });

  return withBalance.reverse();
};

const mapTransaction = (t: any): Transaction | null => {
  if (!t) return null;

  const cashIn = parseNum(t.cash_in);
  const cashOut = parseNum(t.cash_out ?? 0);

  let type: TransactionType;
  let amount: number;

  if (cashIn > 0 && cashOut === 0) {
    type = TransactionType.IN;
    amount = cashIn;
  } else if (cashOut > 0 && cashIn === 0) {
    type = TransactionType.OUT;
    amount = cashOut;
  } else {
    // Fallback for legacy rows or ambiguous data
    const rawType = String(t.type || '').toUpperCase().trim();
    const isLegacyIn = (rawType.includes('IN') || rawType === 'C' || rawType === 'CREDIT' || rawType === '+');
    type = isLegacyIn ? TransactionType.IN : TransactionType.OUT;
    amount = parseNum(t.amount);

    // If no amount can be recovered, skip
    if (amount === 0) return null;
  }

  return {
    id: t.id,
    bookId: t.ledger_id,
    amount,
    type,
    date: t.date,
    time: t.time,
    note: t.note || '',
    partyName: t.party_name,
    category: t.category,
    attachmentUrl: t.attachment_url,
    createdAt: new Date(t.created_at || Date.now()).getTime(),
    paymentMode: t.payment_mode,
    mainCategory: t.main_category,
    subCategory: t.sub_category,
    entryBy: t.entry_by,
    metadata: t.metadata || {}
  };
};

export const getBusinessPartyNames = async (businessId: string): Promise<string[]> => {
  // Fetch distinct party names from ALL ledgers in this project
  const { data, error } = await supabase
    .from('entries')
    .select(`
      party_name,
      ledgers!inner ( project_id )
    `)
    .eq('ledgers.project_id', businessId)
    .not('party_name', 'is', null)
    .neq('party_name', '');

  if (error || !data) return [];

  // Dedup in JS
  const names = new Set<string>();
  data.forEach((d: any) => {
    if (d.party_name) names.add(d.party_name.trim());
  });

  return Array.from(names).sort();
};

export const addTransaction = async (tx: Omit<Transaction, 'id' | 'createdAt'>): Promise<{ data: Transaction | null, error: string | null }> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { data: null, error: "Session expired" };

  const { data, error } = await supabase
    .from('entries')
    .insert([{
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
      metadata: tx.metadata || {}
    }])
    .select()
    .single();

  if (error) {
    console.error("Add Transaction Error", error);
    return { data: null, error: error.message };
  }

  return {
    data: mapTransaction(data),
    error: null
  };
};

export const addBulkTransactions = async (transactions: Omit<Transaction, 'id' | 'createdAt'>[]) => {
  const rows = transactions.map(tx => ({
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
    metadata: tx.metadata || {}
  }));

  const { data, error } = await supabase
    .from('entries')
    .insert(rows)
    .select();

  return { data, error: error?.message };
};

export const updateTransaction = async (tx: Transaction): Promise<{ data: Transaction | null, error: string | null }> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { data: null, error: "Session expired" };

  const { data, error } = await supabase
    .from('entries')
    .update({
      cash_in: tx.type === TransactionType.IN ? Number(tx.amount) : 0,
      cash_out: tx.type === TransactionType.OUT ? Number(tx.amount) : 0,
      date: tx.date,
      time: tx.time,
      note: tx.note,
      party_name: tx.partyName,
      category: tx.category,
      payment_mode: tx.paymentMode,
      entry_by: tx.entryBy,
      metadata: tx.metadata || {}
    })
    .eq('id', tx.id)
    .select()
    .single();

  if (error) {
    console.error("Update Transaction Error", error);
    return { data: null, error: error.message };
  }

  return {
    data: mapTransaction(data),
    error: null
  };
};

export const deleteTransaction = async (id: string): Promise<{ error: string | null }> => {
  const { error } = await supabase
    .from('entries')
    .delete()
    .eq('id', id);

  if (error) {
    console.error("Delete Transaction Error", error);
    return { error: error.message };
  }
  return { error: null };
};

// --- Settings (Custom Categories & Fields) ---

export const getAppSettings = async (userId: string): Promise<AppSettings> => {
  const { data: categoriesData } = await supabase
    .from('custom_categories')
    .select('*')
    .eq('user_id', userId);

  const { data: subcategoriesData } = await supabase
    .from('custom_subcategories')
    .select('*')
    .eq('user_id', userId);

  const { data: fieldsData } = await supabase
    .from('custom_fields')
    .select('*')
    .eq('user_id', userId);

  const { data: paymentModesData } = await supabase
    .from('custom_payment_modes')
    .select('*')
    .eq('user_id', userId);

  const categories: CustomCategory[] = (categoriesData || []).map((c: any) => ({
    id: c.id,
    userId: c.user_id,
    name: c.name,
    type: c.type as any
  }));

  const subcategories: CustomSubcategory[] = (subcategoriesData || []).map((s: any) => ({
    id: s.id,
    userId: s.user_id,
    categoryId: s.category_id,
    name: s.name
  }));

  const fields: CustomField[] = (fieldsData || []).map((f: any) => ({
    id: f.id,
    userId: f.user_id,
    name: f.name,
    type: f.field_type as any,
    required: f.is_required
  }));

  const paymentModes: CustomPaymentMode[] = (paymentModesData || []).map((p: any) => ({
    id: p.id,
    userId: p.user_id,
    name: p.name
  }));

  return { categories, subcategories, fields, paymentModes };
};

export const createCustomCategory = async (userId: string, name: string, type: TransactionType | 'BOTH'): Promise<CustomCategory | null> => {
  const { data, error } = await supabase
    .from('custom_categories')
    .insert([{ user_id: userId, name, type }])
    .select()
    .single();

  if (error) return null;
  return {
    id: data.id,
    userId: data.user_id,
    name: data.name,
    type: data.type as any
  };
};

export const deleteCustomCategory = async (id: string) => {
  await supabase.from('custom_categories').delete().eq('id', id);
};

export const updateCustomCategory = async (id: string, name: string): Promise<{ error: string | null }> => {
  const { error } = await supabase
    .from('custom_categories')
    .update({ name })
    .eq('id', id);

  if (error) {
    console.error("Update Category Error", error);
    return { error: error.message };
  }
  return { error: null };
};

export const createCustomSubcategory = async (userId: string, categoryId: string, name: string): Promise<CustomSubcategory | null> => {
  const { data, error } = await supabase
    .from('custom_subcategories')
    .insert([{ user_id: userId, category_id: categoryId, name }])
    .select()
    .single();

  if (error) return null;
  return {
    id: data.id,
    userId: data.user_id,
    categoryId: data.category_id,
    name: data.name
  };
};

export const updateCustomSubcategory = async (id: string, name: string): Promise<{ error: string | null }> => {
  const { error } = await supabase
    .from('custom_subcategories')
    .update({ name })
    .eq('id', id);

  if (error) {
    console.error("Update Subcategory Error", error);
    return { error: error.message };
  }
  return { error: null };
};

export const deleteCustomSubcategory = async (id: string) => {
  await supabase.from('custom_subcategories').delete().eq('id', id);
};

export const createCustomField = async (userId: string, name: string, type: 'text' | 'number' | 'date', required: boolean): Promise<CustomField | null> => {
  const { data, error } = await supabase
    .from('custom_fields')
    .insert([{ user_id: userId, name, field_type: type, is_required: required }])
    .select()
    .single();

  if (error) return null;
  return {
    id: data.id,
    userId: data.user_id,
    name: data.name,
    type: data.field_type as any,
    required: data.is_required
  };
};

export const deleteCustomField = async (id: string) => {
  await supabase.from('custom_fields').delete().eq('id', id);
};

export const createCustomPaymentMode = async (userId: string, name: string): Promise<CustomPaymentMode | null> => {
  const { data, error } = await supabase
    .from('custom_payment_modes')
    .insert([{ user_id: userId, name }])
    .select()
    .single();

  if (error) return null;
  return {
    id: data.id,
    userId: data.user_id,
    name: data.name
  };
};

export const updateCustomPaymentMode = async (id: string, name: string): Promise<{ error: string | null }> => {
  const { error } = await supabase
    .from('custom_payment_modes')
    .update({ name })
    .eq('id', id);

  if (error) {
    console.error("Update Payment Mode Error", error);
    return { error: error.message };
  }
  return { error: null };
};

export const deleteCustomPaymentMode = async (id: string) => {
  await supabase.from('custom_payment_modes').delete().eq('id', id);
};

// --- Global Portfolio Analytics (Cross-Project Aggregation) ---

/**
 * Fetches all transactions across ALL projects and ledgers owned by the user.
 * Joins mapping: entries -> ledgers -> projects (owner_id)
 */
export const getGlobalTransactions = async (
  userId: string,
  limit: number = 2000,
  offset: number = 0
): Promise<Transaction[]> => {
  try {
    const { data, error } = await supabase
      .from('entries')
      .select(`
        *,
        ledgers!inner (
          id,
          name,
          projects!inner (
            id,
            name,
            owner_id
          )
        )
      `)
      .eq('ledgers.projects.owner_id', userId)
      .range(offset, offset + limit - 1)
      .order('date', { ascending: false })
      .order('time', { ascending: false });

    if (error) {
      console.error('Global Fetch error:', error);
      return [];
    }

    return (data || []).map(mapTransaction).filter((t): t is Transaction => t !== null);
  } catch (err) {
    console.error("Global Fetch failed:", err);
    return [];
  }
};

/**
 * Aggregates high-level totals across all projects for the user.
 */
export const getPortfolioSummary = async (userId: string): Promise<{ totalIn: number, totalOut: number, balance: number, projectCount: number }> => {
  const { data, error } = await supabase
    .from('projects')
    .select('total_in, total_out, balance')
    .eq('owner_id', userId);

  if (error || !data) return { totalIn: 0, totalOut: 0, balance: 0, projectCount: 0 };

  const summary = data.reduce((acc, p) => ({
    totalIn: acc.totalIn + Number(p.total_in || 0),
    totalOut: acc.totalOut + Number(p.total_out || 0),
    balance: acc.balance + Number(p.balance || 0),
    projectCount: acc.projectCount + 1
  }), { totalIn: 0, totalOut: 0, balance: 0, projectCount: 0 });

  return summary;
};
// --- Custom Settings Persistence ---

export const fetchLedgerCustomSettings = async (ledgerId: string) => {
  const { data: categories } = await supabase
    .from('ledger_categories')
    .select('id, name')
    .eq('ledger_id', ledgerId);

  const { data: modes } = await supabase
    .from('ledger_payment_modes')
    .select('name')
    .eq('ledger_id', ledgerId);

  const catMap: Record<string, string[]> = {};
  if (categories) {
    for (const cat of categories) {
      const { data: subs } = await supabase
        .from('ledger_subcategories')
        .select('name')
        .eq('category_id', cat.id);
      catMap[cat.name] = (subs || []).map(s => s.name);
    }
  }

  return {
    categories: catMap,
    paymentModes: (modes || []).map(m => m.name)
  };
};

export const addLedgerCategory = async (ledgerId: string, name: string) => {
  return await supabase.from('ledger_categories').insert([{ ledger_id: ledgerId, name }]);
};

export const deleteLedgerCategory = async (ledgerId: string, name: string) => {
  return await supabase.from('ledger_categories').delete().eq('ledger_id', ledgerId).eq('name', name);
};

export const addLedgerSubcategory = async (ledgerId: string, categoryName: string, subName: string) => {
  const { data: cat } = await supabase.from('ledger_categories').select('id').eq('ledger_id', ledgerId).eq('name', categoryName).single();
  if (!cat) return { error: "Category not found" };
  return await supabase.from('ledger_subcategories').insert([{ category_id: cat.id, name: subName }]);
};

export const deleteLedgerSubcategory = async (ledgerId: string, categoryName: string, subName: string) => {
  const { data: cat } = await supabase.from('ledger_categories').select('id').eq('ledger_id', ledgerId).eq('name', categoryName).single();
  if (!cat) return { error: "Category not found" };
  return await supabase.from('ledger_subcategories').delete().eq('category_id', cat.id).eq('name', subName);
};

export const addLedgerPaymentMode = async (ledgerId: string, name: string) => {
  return await supabase.from('ledger_payment_modes').insert([{ ledger_id: ledgerId, name }]);
};

export const deleteLedgerPaymentMode = async (ledgerId: string, name: string) => {
  return await supabase.from('ledger_payment_modes').delete().eq('ledger_id', ledgerId).eq('name', name);
};

export const updateUserProfile = async (userId: string, updates: { name?: string }) => {
  const { data, error } = await supabase.auth.updateUser({
    data: { name: updates.name }
  });
  return { data, error };
};
export const updateLedgerSettings = async (ledgerId: string, settings: any) => {
  return await supabase
    .from('ledgers')
    .update({ settings })
    .eq('id', ledgerId);
};

export const syncLedgerSettings = async (
  ledgerId: string, 
  data: { 
    categories: Record<string, string[]>, 
    paymentModes: string[] 
  }
) => {
  // 1. Clear existing modes
  await deleteLedgerPaymentMode(ledgerId, 'ALL_MODES_WILDCARD'); // Custom logic for cleanup
  await supabase.from('ledger_payment_modes').delete().eq('ledger_id', ledgerId);
  
  // 2. Clear existing cats (subcats will cascade delete)
  await supabase.from('ledger_categories').delete().eq('ledger_id', ledgerId);

  // 3. Batch insert modes
  if (data.paymentModes.length > 0) {
    await supabase.from('ledger_payment_modes').insert(
      data.paymentModes.map(m => ({ ledger_id: ledgerId, name: m }))
    );
  }

  // 4. Insert categories and subcategories
  for (const [catName, subs] of Object.entries(data.categories)) {
    const { data: cat, error } = await supabase
      .from('ledger_categories')
      .insert([{ ledger_id: ledgerId, name: catName }])
      .select('id')
      .single();
    
    if (cat && subs.length > 0) {
      await supabase.from('ledger_subcategories').insert(
        subs.map(s => ({ category_id: cat.id, name: s }))
      );
    }
  }

  return { success: true };
};
