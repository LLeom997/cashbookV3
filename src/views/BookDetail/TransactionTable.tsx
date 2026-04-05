import React, { useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../../components/ui/table';
import { Card, CardContent } from '../../components/ui/card';
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
    return sortOrder === 'asc' ? <ArrowUpIcon className="w-3 h-3 ml-1 inline" /> : <ArrowDownIcon className="w-3 h-3 ml-1 inline" />;
  };

  return (
    <div className="space-y-4">
      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="hover:bg-transparent border-slate-200">
              <TableHead className="w-[40px] px-4">
                <input
                  type="checkbox"
                  className="rounded border-slate-300 text-blue-600 w-4 h-4"
                  checked={transactions.length > 0 && selectedTxs.size === transactions.length}
                  onChange={(e) => {
                    transactions.forEach(tx => onSelectTx(tx.id, e.target.checked));
                  }}
                />
              </TableHead>
              {(visibleColumns.date ?? true) && (
                <TableHead className="cursor-pointer font-bold text-[10px] text-slate-500 uppercase tracking-widest h-12" onClick={() => onSort('date')}>
                  Date <SortIndicator field="date" />
                </TableHead>
              )}
              {(visibleColumns.party ?? true) && (
                <TableHead className="cursor-pointer font-bold text-[10px] text-slate-500 uppercase tracking-widest h-12" onClick={() => onSort('party')}>
                  Party <SortIndicator field="party" />
                </TableHead>
              )}
              {(visibleColumns.remark ?? true) && (
                <TableHead className="font-bold text-[10px] text-slate-500 uppercase tracking-widest h-12">Remark</TableHead>
              )}
              {(visibleColumns.entryBy ?? true) && (
                <TableHead className="cursor-pointer font-bold text-[10px] text-slate-500 uppercase tracking-widest h-12" onClick={() => onSort('entryBy')}>
                  By <SortIndicator field="entryBy" />
                </TableHead>
              )}
              {(visibleColumns.cashIn ?? true) && (
                <TableHead className="cursor-pointer text-right font-bold text-[10px] text-slate-500 uppercase tracking-widest h-12" onClick={() => onSort('cashIn')}>
                  In (₹) <SortIndicator field="cashIn" />
                </TableHead>
              )}
              {(visibleColumns.cashOut ?? true) && (
                <TableHead className="cursor-pointer text-right font-bold text-[10px] text-slate-500 uppercase tracking-widest h-12" onClick={() => onSort('cashOut')}>
                  Out (₹) <SortIndicator field="cashOut" />
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx) => (
              <TableRow
                key={tx.id}
                className={cn(
                  "group transition-colors border-slate-100 hover:bg-blue-50/30 cursor-pointer",
                  selectedTxs.has(tx.id) && "bg-blue-50/50"
                )}
                onClick={() => onEditTx(tx)}
              >
                <TableCell className="px-4" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-blue-600 w-4 h-4"
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
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{tx.partyName || '-'}</span>
                  </TableCell>
                )}
                {(visibleColumns.remark ?? true) && (
                  <TableCell className="max-w-[200px]">
                    <p className="text-xs text-slate-600 truncate font-medium">{tx.note || '-'}</p>
                  </TableCell>
                )}
                {(visibleColumns.entryBy ?? true) && (
                  <TableCell>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{tx.entryBy || '-'}</span>
                  </TableCell>
                )}
                {(visibleColumns.cashIn ?? true) && (
                  <TableCell className="text-right">
                    <span className={cn("text-xs font-black", tx.type === TransactionType.IN ? "text-emerald-600" : "text-slate-200")}>
                      {tx.type === TransactionType.IN ? formatCurrency(tx.amount).replace('₹', '') : '-'}
                    </span>
                  </TableCell>
                )}
                {(visibleColumns.cashOut ?? true) && (
                  <TableCell className="text-right">
                    <span className={cn("text-xs font-black", tx.type === TransactionType.OUT ? "text-rose-600" : "text-slate-200")}>
                      {tx.type === TransactionType.OUT ? formatCurrency(tx.amount).replace('₹', '') : '-'}
                    </span>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards / High-Density Tabular View */}
      <div className="md:hidden space-y-2">
        {transactions.map((tx) => (
          <div
            key={tx.id}
            className={cn(
              "group transition-all bg-white border border-slate-200 overflow-hidden shadow-sm relative rounded-xl active:scale-[0.98]",
              selectedTxs.has(tx.id) && "border-blue-500 bg-blue-50/50 ring-1 ring-blue-500"
            )}
            onClick={() => onEditTx(tx)}
          >
            <div className="flex items-stretch min-h-[70px]">
              {/* Type Indicator Bar */}
              <div className={cn(
                "w-1.5 shrink-0",
                tx.type === TransactionType.IN ? 'bg-emerald-500' : 'bg-rose-500'
              )} />

              <div className="flex-1 p-3 flex flex-col justify-between gap-1">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-black text-slate-400 font-sans tracking-tight">
                        {tx.date}
                      </span>
                      {tx.partyName && (
                        <span className="text-[10px] text-blue-600 font-black bg-blue-50 px-1.5 py-0.5 rounded uppercase tracking-tighter truncate max-w-[100px] font-sans">
                          {tx.partyName}
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-slate-800 truncate leading-tight font-sans tracking-tight">
                      {tx.note || 'No Remark'}
                    </h4>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={cn(
                      "text-base font-black tracking-tighter font-sans",
                      tx.type === TransactionType.IN ? 'text-emerald-600' : 'text-rose-600'
                    )}>
                      {tx.type === TransactionType.IN ? '+' : '-'}{formatCurrency(tx.amount).replace('₹', '')}
                    </p>
                    <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{tx.paymentMode || 'CASH'}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex gap-1.5 items-center">
                    {/* Checkbox removed as requested for cleaner mobile UI */}
                    {tx.category && (
                      <div className="flex flex-wrap gap-1">
                        {tx.category.split(',').slice(0, 2).map((tag: string) => (
                          <span key={tag} className="text-[8px] font-black bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-sans uppercase tracking-tighter">
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">By {tx.entryBy || 'User'}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {transactions.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-slate-200">
          <SearchIcon className="w-8 h-8 text-slate-300 mb-3" />
          <p className="text-slate-500 text-sm font-medium">No transactions found.</p>
        </div>
      )}
    </div>
  );
};
