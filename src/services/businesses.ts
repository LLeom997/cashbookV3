import { supabase } from '../lib/supabase';
import type { Business, BusinessWithTotals, BookWithTotals } from '../types';
import { softDeleteById } from './common';

export const filterLedgersByAccess = <T extends { id: string }>(
  ledgers: T[],
  role: 'owner' | 'admin' | 'editor' | 'viewer',
  accessibleLedgerIds: string[]
) => {
  if (role === 'owner' || role === 'admin') return ledgers;
  return ledgers.filter((ledger) => accessibleLedgerIds.includes(ledger.id));
};

export const mapBusiness = (business: any, role: any, isShared: boolean): BusinessWithTotals => {
  let totalIn = 0;
  let totalOut = 0;
  let bookCount = 0;
  let books: BookWithTotals[] = [];

  if (business.ledgers) {
    bookCount = business.ledgers.length;
    books = business.ledgers.map((book: any) => {
      const bookIn = Number(book.total_in || 0);
      const bookOut = Number(book.total_out || 0);
      const balance = Number(book.balance || 0);

      totalIn += bookIn;
      totalOut += bookOut;

      return {
        id: book.id,
        businessId: business.id,
        name: book.name,
        createdAt: new Date(book.created_at).getTime(),
        totalIn: bookIn,
        totalOut: bookOut,
        countIn: 0,
        countOut: 0,
        balance,
      };
    });
    books.sort((a, b) => b.createdAt - a.createdAt);
  }

  return {
    id: business.id,
    userId: business.owner_id,
    name: business.name,
    currency: business.currency,
    createdAt: new Date(business.created_at).getTime(),
    totalIn,
    totalOut,
    balance: totalIn - totalOut,
    bookCount,
    books,
    role,
    isShared,
  };
};

export const getBusinesses = async (userId: string): Promise<BusinessWithTotals[]> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: ownedData, error: ownedError } = await supabase
    .from('projects')
    .select(
      `
      *,
      ledgers (
        id, name, created_at, total_in, total_out, balance
      )
    `
    )
    .eq('owner_id', userId)
    .order('created_at', { ascending: false });

  if (ownedError) console.error('Owned Error', ownedError);

  const { data: sharedCollabs, error: sharedError } = await supabase
    .from('project_collaborators')
    .select(
      `
      *,
      projects (
        *,
        ledgers (
          id, name, created_at, total_in, total_out, balance
        )
      )
    `
    )
    .eq('user_email', user.email)
    .order('created_at', { ascending: false });

  if (sharedError) console.error('Shared Fetch Error', sharedError);

  const ownedBusinesses = (ownedData || []).map((business: any) => mapBusiness(business, 'owner', false));
  const sharedBusinesses = (sharedCollabs || []).map((collaborator: any) => {
    const business = collaborator.projects;
    const accessibleLedgers = filterLedgersByAccess(
      business.ledgers || [],
      collaborator.role,
      collaborator.accessible_ledger_ids || []
    );
    return mapBusiness({ ...business, ledgers: accessibleLedgers }, collaborator.role, true);
  });

  return [...ownedBusinesses, ...sharedBusinesses].sort((a, b) => b.createdAt - a.createdAt);
};

export const getBusiness = async (id: string): Promise<BusinessWithTotals | undefined> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return undefined;

  const { data: project } = await supabase.from('projects').select('*').eq('id', id).single();
  if (!project) return undefined;

  if (project.owner_id === user.id) {
    return {
      id: project.id,
      userId: project.owner_id,
      name: project.name,
      currency: project.currency,
      createdAt: new Date(project.created_at).getTime(),
      totalIn: Number(project.total_in || 0),
      totalOut: Number(project.total_out || 0),
      balance: Number(project.balance || 0),
      bookCount: 0,
      role: 'owner',
      isShared: false,
    };
  }

  const { data: collab } = await supabase
    .from('project_collaborators')
    .select('*')
    .eq('project_id', id)
    .eq('user_email', user.email)
    .single();

  if (!collab) return undefined;

  let allowedLedgersQuery = supabase
    .from('ledgers')
    .select('total_in, total_out, balance')
    .eq('project_id', id);

  if (collab.role !== 'admin') {
    allowedLedgersQuery = allowedLedgersQuery.in('id', collab.accessible_ledger_ids || []);
  }

  const { data: allowedLedgers } = await allowedLedgersQuery;
  const totals = (allowedLedgers || []).reduce(
    (acc, ledger) => ({
      totalIn: acc.totalIn + Number(ledger.total_in || 0),
      totalOut: acc.totalOut + Number(ledger.total_out || 0),
      balance: acc.balance + Number(ledger.balance || 0),
    }),
    { totalIn: 0, totalOut: 0, balance: 0 }
  );

  return {
    id: project.id,
    userId: project.owner_id,
    name: project.name,
    currency: project.currency,
    createdAt: new Date(project.created_at).getTime(),
    totalIn: totals.totalIn,
    totalOut: totals.totalOut,
    balance: totals.balance,
    bookCount: (allowedLedgers || []).length,
    role: collab.role,
    isShared: true,
  };
};

export const createBusiness = async (
  name: string
): Promise<{ data: Business | null; error: string | null }> => {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { data: null, error: 'Session expired. Please log in again.' };
  }

  const { data, error } = await supabase
    .from('projects')
    .insert([{ owner_id: user.id, name }])
    .select('id, owner_id, name, currency, created_at')
    .single();

  if (error) return { data: null, error: error.message };

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
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return { error: 'Session expired' };

  const { error } = await supabase.from('projects').update({ name }).eq('id', id);
  if (error) {
    console.error('Update Business Error', error);
    return { error: error.message };
  }

  return { error: null };
};

export const deleteBusiness = async (id: string): Promise<{ error: string | null }> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return { error: 'Session expired' };

  return softDeleteById(
    async () =>
      supabase
        .from('projects')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', id),
    async () => supabase.from('projects').delete().eq('id', id)
  );
};
