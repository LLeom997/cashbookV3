import React from 'react';
import { cn } from '../lib/utils';

interface LoadingScreenProps {
  title?: string;
  subtitle?: string;
  compact?: boolean;
  className?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  title = 'Loading workspace',
  subtitle = 'Syncing ledgers, balances, and collaborators.',
  compact = false,
  className,
}) => {
  return (
    <div
      className={cn(
        compact
          ? 'flex items-center justify-center p-8'
          : 'min-h-screen flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.10),_transparent_38%),linear-gradient(180deg,_#f8fbff_0%,_#f6f9ff_52%,_#f8fafc_100%)]',
        className
      )}
    >
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-white/92 shadow-[0_18px_50px_rgba(37,99,235,0.12)] ring-1 ring-slate-200/80 backdrop-blur">
          <div className="relative h-12 w-12">
            <div className="absolute inset-0 rounded-full border-[3px] border-slate-200" />
            <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-blue-600 border-r-cyan-400 animate-spin" />
          </div>
        </div>

        <p className="mt-6 text-[11px] font-black uppercase tracking-[0.28em] text-blue-600/80">
          CashFlow Pro
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
          {title}
        </h1>
        <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
          {subtitle}
        </p>
      </div>
    </div>
  );
};
