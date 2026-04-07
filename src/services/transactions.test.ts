import { describe, expect, it } from 'vitest';
import { TransactionType } from '../types';
import {
  buildTransactionInsert,
  validateTransactionDraft,
} from './transactions';
import { mapTransaction, mapTransactionsWithBalance } from './common';

describe('transaction mapping and validation', () => {
  it('maps cash_in rows to IN transactions', () => {
    const tx = mapTransaction({
      id: '1',
      ledger_id: 'book-1',
      cash_in: 150,
      cash_out: 0,
      date: '2026-04-07',
      time: '09:00',
      note: 'Sale',
      created_at: '2026-04-07T09:00:00Z',
    });

    expect(tx).toMatchObject({
      id: '1',
      bookId: 'book-1',
      amount: 150,
      type: TransactionType.IN,
    });
  });

  it('computes running balances in descending output order', () => {
    const txs = mapTransactionsWithBalance([
      {
        id: 'a',
        ledger_id: 'book-1',
        cash_in: 100,
        cash_out: 0,
        date: '2026-04-05',
        time: '09:00',
        created_at: '2026-04-05T09:00:00Z',
      },
      {
        id: 'b',
        ledger_id: 'book-1',
        cash_in: 0,
        cash_out: 30,
        date: '2026-04-06',
        time: '10:00',
        created_at: '2026-04-06T10:00:00Z',
      },
    ]);

    expect(txs.map((tx) => ({ id: tx.id, runningBalance: tx.runningBalance }))).toEqual([
      { id: 'b', runningBalance: 70 },
      { id: 'a', runningBalance: 100 },
    ]);
  });

  it('rejects invalid transaction drafts', () => {
    const result = validateTransactionDraft({
      bookId: '',
      amount: 0,
      type: TransactionType.OUT,
      date: '07-04-2026',
      time: '9:00',
      note: '',
      entryBy: 'Tester',
    } as any);

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('builds db insert payloads from transaction drafts', () => {
    const payload = buildTransactionInsert({
      bookId: 'book-1',
      amount: 220,
      type: TransactionType.OUT,
      date: '2026-04-07',
      time: '10:45',
      note: 'Office supplies',
      partyName: 'Stationer',
      category: 'Office',
      paymentMode: 'Cash',
      entryBy: 'Admin',
      metadata: { source: 'manual' },
    });

    expect(payload).toEqual({
      ledger_id: 'book-1',
      cash_in: 0,
      cash_out: 220,
      date: '2026-04-07',
      time: '10:45',
      note: 'Office supplies',
      party_name: 'Stationer',
      category: 'Office',
      payment_mode: 'Cash',
      entry_by: 'Admin',
      metadata: { source: 'manual' },
    });
  });
});
