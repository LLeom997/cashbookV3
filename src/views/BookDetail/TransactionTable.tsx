import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../../components/ui/table';
import { Transaction, TransactionType } from '../../types';
import { cn, formatCurrency } from '../../lib/utils';
import { ArrowUpIcon, ArrowDownIcon, SearchIcon } from 'lucide-react';

interface TransactionTableProps {
  transactions: Transaction[];
  selectedTxs: Set<string>;
  onSelectTx: (id: string, selected: boolean) => void;
  onEditTx: (tx: Transaction) => void;
  sortField: string;
  sortOrder: 'asc' | 'desc';
  onSort: (field: string) => void;
  visibleColumns?: Record<string, boolean>;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  selectedTxs,
  onSelectTx,
  onEditTx,
  sortField,
  sortOrder,
  onSort,
  visibleColumns = { date: true, party: true, remark: true, entryBy: true, cashIn: true, cashOut: true }
}) => {
  const SortIndicator = ({ field }: { field: string }) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc'
      ? <ArrowUpIcon className="ml-1 inline h-3 w-3" />
      : <ArrowDownIcon className="ml-1 inline h-3 w-3" />;
  };

  return (
    <div className="space-y-4">
      <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:block">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="border-slate-200 hover:bg-transparent">
              <TableHead className="w-[40px] px-4">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-blue-600"
                  checked={transactions.length > 0 && selectedTxs.size === transactions.length}
                  onChange={(e) => {
                    transactions.forEach((tx) => onSelectTx(tx.id, e.target.checked));
                  }}
                />
              </TableHead>
              {(visibleColumns.date ?? true) && (
                <TableHead className="h-12 cursor-pointer text-[10px] font-bold uppercase tracking-widest text-slate-500" onClick={() => onSort('date')}>
                  Date <SortIndicator field="date" />
                </TableHead>
              )}
              {(visibleColumns.party ?? true) && (
                <TableHead className="h-12 cursor-pointer text-[10px] font-bold uppercase tracking-widest text-slate-500" onClick={() => onSort('party')}>
                  Party <SortIndicator field="party" />
                </TableHead>
              )}
              {(visibleColumns.remark ?? true) && (
                <TableHead className="h-12 text-[10px] font-bold uppercase tracking-widest text-slate-500">Remark</TableHead>
              )}
              {(visibleColumns.entryBy ?? true) && (
                <TableHead className="h-12 cursor-pointer text-[10px] font-bold uppercase tracking-widest text-slate-500" onClick={() => onSort('entryBy')}>
                  By <SortIndicator field="entryBy" />
                </TableHead>
              )}
              {(visibleColumns.cashIn ?? true) && (
                <TableHead className="h-12 cursor-pointer text-right text-[10px] font-bold uppercase tracking-widest text-slate-500" onClick={() => onSort('cashIn')}>
                  In (Rs) <SortIndicator field="cashIn" />
                </TableHead>
              )}
              {(visibleColumns.cashOut ?? true) && (
                <TableHead className="h-12 cursor-pointer text-right text-[10px] font-bold uppercase tracking-widest text-slate-500" onClick={() => onSort('cashOut')}>
                  Out (Rs) <SortIndicator field="cashOut" />
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx) => (
              <TableRow
                key={tx.id}
                className={cn(
                  'group cursor-pointer border-slate-100 transition-colors hover:bg-blue-50/30',
                  selectedTxs.has(tx.id) && 'bg-blue-50/50'
                )}
                onClick={() => onEditTx(tx)}
              >
                <TableCell className="px-4" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-blue-600"
                    checked={selectedTxs.has(tx.id)}
                    onChange={(e) => onSelectTx(tx.id, e.target.checked)}
                  />
                </TableCell>
                {(visibleColumns.date ?? true) && (
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-700">{tx.date}</span>
                      <span className="text-[10px] text-slate-400">{tx.time}</span>
                    </div>
                  </TableCell>
                )}
                {(visibleColumns.party ?? true) && (
                  <TableCell>
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-600">{tx.partyName || '-'}</span>
                  </TableCell>
                )}
                {(visibleColumns.remark ?? true) && (
                  <TableCell className="max-w-[200px]">
                    <p className="truncate text-xs font-medium text-slate-600">{tx.note || '-'}</p>
                  </TableCell>
                )}
                {(visibleColumns.entryBy ?? true) && (
                  <TableCell>
                    <span className="text-[10px] font-bold uppercase text-slate-400">{tx.entryBy || '-'}</span>
                  </TableCell>
                )}
                {(visibleColumns.cashIn ?? true) && (
                  <TableCell className="text-right">
                    <span className={cn('text-xs font-black', tx.type === TransactionType.IN ? 'text-emerald-600' : 'text-slate-200')}>
                      {tx.type === TransactionType.IN ? formatCurrency(tx.amount).replace('₹', '') : '-'}
                    </span>
                  </TableCell>
                )}
                {(visibleColumns.cashOut ?? true) && (
                  <TableCell className="text-right">
                    <span className={cn('text-xs font-black', tx.type === TransactionType.OUT ? 'text-rose-600' : 'text-slate-200')}>
                      {tx.type === TransactionType.OUT ? formatCurrency(tx.amount).replace('₹', '') : '-'}
                    </span>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-2 md:hidden">
        {transactions.map((tx) => (
          <div
            key={tx.id}
            className={cn(
              'group relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all active:scale-[0.98]',
              selectedTxs.has(tx.id) && 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500'
            )}
            onClick={() => onEditTx(tx)}
          >
            <div className="flex min-h-[78px] items-stretch">
              <div className={cn('w-1.5 shrink-0', tx.type === TransactionType.IN ? 'bg-emerald-500' : 'bg-rose-500')} />

              <div className="flex flex-1 flex-col justify-between gap-2 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-0.5 flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-black tracking-tight text-slate-400">{tx.date}</span>
                      {tx.partyName && (
                        <span className="max-w-[110px] truncate rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-tighter text-blue-600">
                          {tx.partyName}
                        </span>
                      )}
                    </div>
                    <h4 className="truncate text-sm font-bold leading-tight tracking-tight text-slate-800">
                      {tx.note || 'No remark'}
                    </h4>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className={cn('text-base font-black tracking-tighter', tx.type === TransactionType.IN ? 'text-emerald-600' : 'text-rose-600')}>
                      {tx.type === TransactionType.IN ? '+' : '-'}
                      {formatCurrency(tx.amount).replace('₹', '')}
                    </p>
                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-300">{tx.paymentMode || 'CASH'}</p>
                  </div>
                </div>

                <div className="flex items-end justify-between gap-3">
                  <div className="flex flex-wrap gap-1">
                    {tx.category?.split(',').slice(0, 2).map((tag) => (
                      <span key={tag} className="rounded bg-slate-100 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-tighter text-slate-500">
                        {tag.trim()}
                      </span>
                    ))}
                  </div>

                  <span className="shrink-0 text-[8px] font-bold uppercase tracking-widest text-slate-400">
                    By {tx.entryBy || 'User'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {transactions.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white py-20">
          <SearchIcon className="mb-3 h-8 w-8 text-slate-300" />
          <p className="text-sm font-medium text-slate-500">No transactions found.</p>
        </div>
      )}
    </div>
  );
};
