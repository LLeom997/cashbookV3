import { supabase } from '../lib/supabase';
import type { Book, BookWithTotals } from '../types';
import { softDeleteById } from './common';

export const getBooks = async (businessId: string): Promise<BookWithTotals[]> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: project } = await supabase.from('projects').select('owner_id').eq('id', businessId).single();
  const isOwner = project?.owner_id === user.id;

  let query = supabase.from('ledgers').select('*').eq('project_id', businessId);

  if (!isOwner) {
    const { data: collab } = await supabase
      .from('project_collaborators')
      .select('*')
      .eq('project_id', businessId)
      .eq('user_email', user.email)
      .single();

    if (!collab) return [];
    if (collab.role !== 'admin') {
      query = query.in('id', collab.accessible_ledger_ids || []);
    }
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error || !data) return [];

  return data.map((ledger: any) => ({
    id: ledger.id,
    businessId: ledger.project_id,
    name: ledger.name,
    createdAt: new Date(ledger.created_at).getTime(),
    totalIn: Number(ledger.total_in || 0),
    totalOut: Number(ledger.total_out || 0),
    countIn: 0,
    countOut: 0,
    balance: Number(ledger.balance || 0),
  }));
};

export const getBook = async (id: string): Promise<Book | undefined> => {
  const { data } = await supabase.from('ledgers').select('*').eq('id', id).single();
  if (!data) return undefined;

  return {
    id: data.id,
    businessId: data.project_id,
    name: data.name,
    createdAt: new Date(data.created_at).getTime(),
  };
};

export const getBookTotals = async (bookId: string): Promise<BookWithTotals | null> => {
  const { data, error } = await supabase.from('ledgers').select('*').eq('id', bookId).single();
  if (error || !data) return null;

  return {
    id: data.id,
    businessId: data.project_id,
    name: data.name,
    createdAt: new Date(data.created_at).getTime(),
    totalIn: Number(data.total_in || 0),
    totalOut: Number(data.total_out || 0),
    countIn: Number(data.count_in || 0),
    countOut: Number(data.count_out || 0),
    balance: Number(data.balance || 0),
  };
};

export const refreshProjectSummary = async (projectId: string) => {
  const { data: siblingLedgers } = await supabase
    .from('ledgers')
    .select('total_in, total_out')
    .eq('project_id', projectId);

  if (!siblingLedgers) return;

  const projectTotIn = siblingLedgers.reduce((acc, ledger) => acc + Number(ledger.total_in || 0), 0);
  const projectTotOut = siblingLedgers.reduce((acc, ledger) => acc + Number(ledger.total_out || 0), 0);

  await supabase
    .from('projects')
    .update({
      total_in: projectTotIn,
      total_out: projectTotOut,
      balance: projectTotIn - projectTotOut,
    })
    .eq('id', projectId);
};

export const updateBookTotals = async (
  ledgerId: string,
  totals: { totalIn: number; totalOut: number; balance: number }
) => {
  const { data: ledger, error } = await supabase
    .from('ledgers')
    .update({
      total_in: totals.totalIn,
      total_out: totals.totalOut,
      balance: totals.balance,
    })
    .eq('id', ledgerId)
    .select('project_id')
    .single();

  if (error || !ledger) {
    console.error('Update Ledger Totals Error', error);
    return;
  }

  await refreshProjectSummary(ledger.project_id);
};

export const createBook = async (
  businessId: string,
  name: string
): Promise<{ data: Book | null; error: string | null }> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return { data: null, error: 'Session expired' };

  const { data, error } = await supabase.from('ledgers').insert([{ project_id: businessId, name }]).select().single();
  if (error) {
    console.error('Create Book Error', error);
    return { data: null, error: error.message };
  }

  return {
    data: {
      id: data.id,
      businessId: data.project_id,
      name: data.name,
      createdAt: new Date(data.created_at).getTime(),
    },
    error: null,
  };
};

export const updateBook = async (id: string, name: string): Promise<{ error: string | null }> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return { error: 'Session expired' };

  const { error } = await supabase.from('ledgers').update({ name }).eq('id', id);
  if (error) {
    console.error('Update Book Error', error);
    return { error: error.message };
  }

  return { error: null };
};

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
    for (const category of categories) {
      const { data: subs } = await supabase
        .from('ledger_subcategories')
        .select('name')
        .eq('category_id', category.id);
      catMap[category.name] = (subs || []).map((sub) => sub.name);
    }
  }

  return {
    categories: catMap,
    paymentModes: (modes || []).map((mode) => mode.name),
  };
};

export const addLedgerCategory = async (ledgerId: string, name: string) => {
  return supabase.from('ledger_categories').insert([{ ledger_id: ledgerId, name }]);
};

export const deleteLedgerCategory = async (ledgerId: string, name: string) => {
  return supabase.from('ledger_categories').delete().eq('ledger_id', ledgerId).eq('name', name);
};

export const addLedgerSubcategory = async (ledgerId: string, categoryName: string, subName: string) => {
  const { data: category } = await supabase
    .from('ledger_categories')
    .select('id')
    .eq('ledger_id', ledgerId)
    .eq('name', categoryName)
    .single();

  if (!category) return { error: 'Category not found' };
  return supabase.from('ledger_subcategories').insert([{ category_id: category.id, name: subName }]);
};

export const deleteLedgerSubcategory = async (
  ledgerId: string,
  categoryName: string,
  subName: string
) => {
  const { data: category } = await supabase
    .from('ledger_categories')
    .select('id')
    .eq('ledger_id', ledgerId)
    .eq('name', categoryName)
    .single();

  if (!category) return { error: 'Category not found' };
  return supabase.from('ledger_subcategories').delete().eq('category_id', category.id).eq('name', subName);
};

export const addLedgerPaymentMode = async (ledgerId: string, name: string) => {
  return supabase.from('ledger_payment_modes').insert([{ ledger_id: ledgerId, name }]);
};

export const deleteLedgerPaymentMode = async (ledgerId: string, name: string) => {
  return supabase.from('ledger_payment_modes').delete().eq('ledger_id', ledgerId).eq('name', name);
};

export const updateLedgerSettings = async (ledgerId: string, settings: any) => {
  return supabase.from('ledgers').update({ settings }).eq('id', ledgerId);
};

export const syncLedgerSettings = async (
  ledgerId: string,
  data: { categories: Record<string, string[]>; paymentModes: string[] }
) => {
  await supabase.from('ledger_payment_modes').delete().eq('ledger_id', ledgerId);
  await supabase.from('ledger_categories').delete().eq('ledger_id', ledgerId);

  if (data.paymentModes.length > 0) {
    await supabase.from('ledger_payment_modes').insert(
      data.paymentModes.map((paymentMode) => ({ ledger_id: ledgerId, name: paymentMode }))
    );
  }

  for (const [categoryName, subs] of Object.entries(data.categories)) {
    const { data: category } = await supabase
      .from('ledger_categories')
      .insert([{ ledger_id: ledgerId, name: categoryName }])
      .select('id')
      .single();

    if (category && subs.length > 0) {
      await supabase.from('ledger_subcategories').insert(
        subs.map((sub) => ({ category_id: category.id, name: sub }))
      );
    }
  }

  return { success: true };
};

export const deleteBook = async (id: string): Promise<{ error: string | null }> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return { error: 'Session expired' };

  const { data: book } = await supabase.from('ledgers').select('project_id').eq('id', id).single();

  const result = await softDeleteById(
    async () =>
      supabase
        .from('ledgers')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', id),
    async () => supabase.from('ledgers').delete().eq('id', id)
  );

  if (!result.error && book?.project_id) {
    await refreshProjectSummary(book.project_id);
  }

  return result;
};
