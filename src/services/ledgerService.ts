import { getBook, getTransactionsWithBalance, getBookTotals } from './storage';
import { Book, TransactionWithBalance, BookWithTotals } from '../types';

export interface LedgerData {
  book: Book | undefined;
  transactions: TransactionWithBalance[];
  totals: BookWithTotals | null;
}

export const fetchLedgerData = async (bookId: string, limit: number = 1000, offset: number = 0, filters?: any): Promise<LedgerData> => {
  try {
    const [book, transactions, totals] = await Promise.all([
      getBook(bookId),
      getTransactionsWithBalance(bookId, limit, offset, filters),
      getBookTotals(bookId)
    ]);
    
    return {
      book,
      transactions,
      totals
    };
  } catch (error) {
    console.error('Error fetching ledger data:', error);
    throw error;
  }
};
