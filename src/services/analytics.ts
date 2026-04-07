import { supabase } from '../lib/supabase';
import type { Transaction } from '../types';
import { mapTransaction } from './common';

export const getGlobalTransactions = async (
  userId: string,
  limit = 2000,
  offset = 0
): Promise<Transaction[]> => {
  try {
    const { data, error } = await supabase
      .from('entries')
      .select(
        `
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
      `
      )
      .eq('ledgers.projects.owner_id', userId)
      .range(offset, offset + limit - 1)
      .order('date', { ascending: false })
      .order('time', { ascending: false });

    if (error) {
      console.error('Global Fetch error:', error);
      return [];
    }

    return (data || []).map(mapTransaction).filter((tx): tx is Transaction => tx !== null);
  } catch (error) {
    console.error('Global Fetch failed:', error);
    return [];
  }
};

export const getPortfolioSummary = async (userId: string) => {
  const { data, error } = await supabase
    .from('projects')
    .select('total_in, total_out, balance')
    .eq('owner_id', userId);

  if (error || !data) return { totalIn: 0, totalOut: 0, balance: 0, projectCount: 0 };

  return data.reduce(
    (acc, project) => ({
      totalIn: acc.totalIn + Number(project.total_in || 0),
      totalOut: acc.totalOut + Number(project.total_out || 0),
      balance: acc.balance + Number(project.balance || 0),
      projectCount: acc.projectCount + 1,
    }),
    { totalIn: 0, totalOut: 0, balance: 0, projectCount: 0 }
  );
};

