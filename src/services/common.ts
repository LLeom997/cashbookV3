import { TransactionType, type Transaction, type TransactionWithBalance } from '../types';

export const parseNum = (value: unknown) => {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  return parseFloat(String(value).replace(/[^0-9.-]+/g, '')) || 0;
};

export const mapTransaction = (row: any): Transaction | null => {
  if (!row) return null;

  const cashIn = parseNum(row.cash_in);
  const cashOut = parseNum(row.cash_out ?? 0);

  let type: TransactionType;
  let amount: number;

  if (cashIn > 0 && cashOut === 0) {
    type = TransactionType.IN;
    amount = cashIn;
  } else if (cashOut > 0 && cashIn === 0) {
    type = TransactionType.OUT;
    amount = cashOut;
  } else {
    const rawType = String(row.type || '').toUpperCase().trim();
    const isLegacyIn =
      rawType.includes('IN') || rawType === 'C' || rawType === 'CREDIT' || rawType === '+';
    type = isLegacyIn ? TransactionType.IN : TransactionType.OUT;
    amount = parseNum(row.amount);
    if (amount === 0) return null;
  }

  return {
    id: row.id,
    bookId: row.ledger_id,
    amount,
    type,
    date: row.date,
    time: row.time,
    note: row.note || '',
    partyName: row.party_name,
    category: row.category,
    attachmentUrl: row.attachment_url,
    createdAt: new Date(row.created_at || Date.now()).getTime(),
    paymentMode: row.payment_mode,
    mainCategory: row.main_category,
    subCategory: row.sub_category,
    entryBy: row.entry_by,
    metadata: row.metadata || {},
  };
};

export const mapTransactionsWithBalance = (rows: any[]): TransactionWithBalance[] => {
  const txs = rows.map(mapTransaction).filter((tx): tx is Transaction => tx !== null);
  const sortedAsc = [...txs].sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time}`).getTime();
    const dateB = new Date(`${b.date}T${b.time}`).getTime();
    return dateA - dateB;
  });

  let runningBalance = 0;
  const balanced = sortedAsc.map((tx) => {
    runningBalance += tx.type === TransactionType.IN ? tx.amount : -tx.amount;
    return { ...tx, runningBalance };
  });

  return balanced.reverse();
};

export const softDeleteById = async (
  updateFactory: () => Promise<{ error: { message?: string; code?: string } | null }>,
  hardDeleteFactory: () => Promise<{ error: { message?: string } | null }>
) => {
  const softDeleteResult = await updateFactory();
  if (!softDeleteResult.error) return { error: null };

  const message = softDeleteResult.error.message || '';
  const code = softDeleteResult.error.code || '';
  const missingArchiveColumn =
    code === 'PGRST204' ||
    message.includes('archived_at') ||
    message.includes('Could not find the') ||
    message.includes('column');

  if (!missingArchiveColumn) return { error: message || 'Unable to archive row' };

  const hardDeleteResult = await hardDeleteFactory();
  return { error: hardDeleteResult.error?.message || null };
};
