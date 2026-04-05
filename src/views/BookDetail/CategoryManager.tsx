import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { cn } from '../../lib/utils';
import { SettingsIcon, TagIcon, ArrowDownCircleIcon, ArrowLeftIcon, PencilIcon, TrashIcon } from 'lucide-react';

interface CategoryManagerProps {
  isOpen: boolean;
  onClose: () => void;
  bookId: string;
  categories: string[];
  customBookCats: Record<string, string[]>;
  enableCategories: boolean;
  onToggleCategories: (v: boolean) => void;
  onRenameCategory: (oldName: string, newName: string) => Promise<void>;
  onDeleteCategory: (name: string) => Promise<void>;
  onAddCategory: (name: string) => void;
  onRenameSubcategory: (parent: string, oldName: string, newName: string) => Promise<void>;
  onDeleteSubcategory: (parent: string, name: string) => Promise<void>;
  onAddSubcategory: (parent: string, name: string) => void;
  paymentModes: string[];
  onAddPaymentMode: (name: string) => void;
  onDeletePaymentMode: (name: string) => void;
  onRenamePaymentMode: (oldName: string, newName: string) => Promise<void>;
  visibleColumns: Record<string, boolean>;
  onUpdateSettings: (settings: any) => void;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({
  isOpen,
  onClose,
  bookId,
  categories,
  customBookCats,
  enableCategories,
  onToggleCategories,
  onRenameCategory,
  onDeleteCategory,
  onAddCategory,
  onRenameSubcategory,
  onDeleteSubcategory,
  onAddSubcategory,
  paymentModes,
  onAddPaymentMode,
  onDeletePaymentMode,
  onRenamePaymentMode,
  visibleColumns,
  onUpdateSettings,
}) => {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryOldName, setEditingCategoryOldName] = useState<string | null>(null);
  const [editingCategoryNewName, setEditingCategoryNewName] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [editingSubcategoryOldName, setEditingSubcategoryOldName] = useState<string | null>(null);
  const [editingSubcategoryNewName, setEditingSubcategoryNewName] = useState('');
  const [newPaymentMode, setNewPaymentMode] = useState('');
  const [editingPaymentModeOldName, setEditingPaymentModeOldName] = useState<string | null>(null);
  const [editingPaymentModeNewName, setEditingPaymentModeNewName] = useState('');
  const [activeTab, setActiveTab] = useState<'categories' | 'payment-modes' | 'display'>('categories');

  const handleAddCat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    onAddCategory(newCategoryName.trim());
    setNewCategoryName('');
  };

  const handleAddSub = (e: React.FormEvent, parent: string) => {
    e.preventDefault();
    if (!newSubcategoryName.trim()) return;
    onAddSubcategory(parent, newSubcategoryName.trim());
    setNewSubcategoryName('');
  };

  const handleAddMode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPaymentMode.trim()) return;
    onAddPaymentMode(newPaymentMode.trim());
    setNewPaymentMode('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] p-6 max-h-[85vh] flex flex-col">
        <DialogHeader className="shrink-0 flex flex-row items-start justify-between">
          <div className="space-y-1">
            <DialogTitle className="text-xl font-black uppercase tracking-tight text-slate-800">
              Manage Ledger Settings
            </DialogTitle>
            <DialogDescription className="text-slate-500 font-medium text-xs leading-relaxed max-w-[90%]">
              Configure per-ledger categories, payment modes, and table preferences.
            </DialogDescription>
          </div>
          <button
            type="button"
            onClick={() => onToggleCategories(!enableCategories)}
            className={cn("relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors outline-none", enableCategories ? "bg-blue-600" : "bg-slate-200")}
          >
            <span className={cn("inline-block h-4 w-4 transform rounded-full bg-white transition-transform", enableCategories ? "translate-x-6" : "translate-x-1")} />
          </button>
        </DialogHeader>

        <div className="flex gap-4 shrink-0 px-1 border-b border-slate-100">
          <button
            onClick={() => setActiveTab('categories')}
            className={cn("pb-2 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 px-1", activeTab === 'categories' ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400")}
          >
            Categories
          </button>
          <button
            onClick={() => setActiveTab('payment-modes')}
            className={cn("pb-2 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 px-1", activeTab === 'payment-modes' ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400")}
          >
            Payment Modes
          </button>
          <button
            onClick={() => setActiveTab('display')}
            className={cn("pb-2 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 px-1", activeTab === 'display' ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400")}
          >
            Display
          </button>
        </div>

        {activeTab === 'categories' ? (
          <>
            {enableCategories ? (
              <>
                <form onSubmit={handleAddCat} className="flex gap-2 shrink-0 py-4 border-b border-slate-100">
                  <Input
                    value={newCategoryName}
                    onChange={e => setNewCategoryName(e.target.value)}
                    placeholder="New Parent Category..."
                    className="font-medium bg-slate-50 border-slate-200"
                  />
                  <Button type="submit" disabled={!newCategoryName.trim()} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-widest text-[10px]">Add</Button>
                </form>

                <div className="flex-1 overflow-y-auto min-h-[300px] space-y-4 py-4 pr-1 scrollbar-hide">
                  {categories.map((catName) => (
                    <div key={catName} className="space-y-2">
                      <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                        {editingCategoryOldName === catName ? (
                          <div className="flex-1 flex gap-2">
                            <Input autoFocus value={editingCategoryNewName} onChange={e => setEditingCategoryNewName(e.target.value)} className="h-8" />
                            <Button size="sm" onClick={() => { onRenameCategory(catName, editingCategoryNewName); setEditingCategoryOldName(null); }} disabled={!editingCategoryNewName.trim() || editingCategoryNewName === catName} className="h-8 shrink-0 bg-blue-600 text-white px-3 font-bold">Save</Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingCategoryOldName(null)} className="h-8 shrink-0 px-3 font-bold">Cancel</Button>
                          </div>
                        ) : (
                          <>
                            <div className="flex-1 min-w-0 flex items-center gap-2" onClick={() => setExpandedCategory(expandedCategory === catName ? null : catName)}>
                              <button className="text-slate-400 hover:text-blue-600 p-1 bg-white rounded shadow-sm border border-slate-100">
                                {expandedCategory === catName ? <ArrowDownCircleIcon className="w-4 h-4" /> : <ArrowLeftIcon className="w-4 h-4 -rotate-90" />}
                              </button>
                              <p className="font-bold text-slate-800 uppercase tracking-wider text-xs truncate cursor-pointer">{catName}</p>
                            </div>
                            <div className="flex gap-1 shrink-0">
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-100" onClick={() => { setEditingCategoryOldName(catName); setEditingCategoryNewName(catName); }}><PencilIcon className="w-3.5 h-3.5" /></Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-600 hover:bg-rose-100" onClick={() => onDeleteCategory(catName)}><TrashIcon className="w-3.5 h-3.5" /></Button>
                            </div>
                          </>
                        )}
                      </div>

                      {expandedCategory === catName && (
                        <div className="pl-6 space-y-2 border-l-2 border-slate-100 ml-4 pb-2">
                          {(customBookCats[catName] || []).map(sub => (
                            <div key={sub} className="flex items-center justify-between group">
                              {editingSubcategoryOldName === sub ? (
                                <div className="flex-1 flex items-center gap-2 w-full pr-2">
                                  <Input autoFocus value={editingSubcategoryNewName} onChange={e => setEditingSubcategoryNewName(e.target.value)} className="h-7 text-xs font-bold" />
                                  <Button size="sm" onClick={() => { onRenameSubcategory(catName, sub, editingSubcategoryNewName); setEditingSubcategoryOldName(null); }} disabled={!editingSubcategoryNewName.trim() || editingSubcategoryNewName === sub} className="h-7 text-[9px] px-3 bg-blue-600 text-white font-bold uppercase tracking-wider">Save</Button>
                                  <Button size="sm" variant="ghost" onClick={() => setEditingSubcategoryOldName(null)} className="h-7 text-[9px] px-3 font-bold uppercase tracking-wider">Cancel</Button>
                                </div>
                              ) : (
                                <>
                                  <p className="text-xs font-bold text-slate-500 ml-2 py-1 truncate flex-1">{sub}</p>
                                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-50 rounded pl-2">
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-blue-600" onClick={() => { setEditingSubcategoryOldName(sub); setEditingSubcategoryNewName(sub); }}><PencilIcon className="w-3 h-3" /></Button>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-rose-600" onClick={() => onDeleteSubcategory(catName, sub)}><TrashIcon className="w-3 h-3" /></Button>
                                  </div>
                                </>
                              )}
                            </div>
                          ))}
                          <form className="flex gap-2 pr-2 mt-2" onSubmit={(e) => handleAddSub(e, catName)}>
                            <Input value={newSubcategoryName} onChange={e => setNewSubcategoryName(e.target.value)} placeholder="New subcategory..." className="h-7 text-xs bg-slate-50/50" />
                            <Button type="submit" disabled={!newSubcategoryName.trim()} className="h-7 text-[9px] px-3 bg-slate-100 text-slate-600 hover:bg-slate-200 font-bold uppercase tracking-wider shadow-sm">Add</Button>
                          </form>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 flex-1">
                <TagIcon className="w-12 h-12 text-slate-200 mb-4" />
                <p className="text-slate-600 font-bold text-sm">Categorization is disabled</p>
                <p className="text-slate-400 font-medium text-xs text-center mt-2 px-10">Enable it using the toggle above to manage categories.</p>
              </div>
            )}
          </>
        ) : activeTab === 'payment-modes' ? (
          <div className="flex-1 flex flex-col pt-4 overflow-hidden">
            <form onSubmit={handleAddMode} className="flex gap-2 shrink-0 py-4 border-b border-slate-100">
              <Input
                value={newPaymentMode}
                onChange={e => setNewPaymentMode(e.target.value)}
                placeholder="New Payment Mode..."
                className="font-medium bg-slate-50"
              />
              <Button type="submit" disabled={!newPaymentMode.trim()} className="bg-emerald-600 text-white font-bold uppercase tracking-widest text-[10px]">Add</Button>
            </form>
            <div className="flex-1 overflow-y-auto pt-4 space-y-2 scrollbar-hide">
              {paymentModes.map((mode) => (
                <div key={mode} className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  {editingPaymentModeOldName === mode ? (
                    <div className="flex-1 flex gap-2">
                      <Input autoFocus value={editingPaymentModeNewName} onChange={e => setEditingPaymentModeNewName(e.target.value)} className="h-8" />
                      <Button size="sm" onClick={() => { onRenamePaymentMode(mode, editingPaymentModeNewName); setEditingPaymentModeOldName(null); }}>Save</Button>
                    </div>
                  ) : (
                    <>
                      <p className="flex-1 font-bold text-slate-800 uppercase tracking-widest text-xs ml-2">{mode}</p>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => { setEditingPaymentModeOldName(mode); setEditingPaymentModeNewName(mode); }}><PencilIcon className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => onDeletePaymentMode(mode)}><TrashIcon className="w-3.5 h-3.5 text-rose-600" /></Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col pt-6 space-y-6">
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaction Table Columns</h4>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { id: 'date', label: 'Date & Time' },
                  { id: 'party', label: 'Party Name' },
                  { id: 'remark', label: 'Remark / Note' },
                  { id: 'entryBy', label: 'Entry By' },
                  { id: 'cashIn', label: 'Cash In' },
                  { id: 'cashOut', label: 'Cash Out' },
                ].map(col => (
                  <label key={col.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-blue-50/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={visibleColumns?.[col.id] ?? true}
                      onChange={(e) => onUpdateSettings({ visibleColumns: { ...visibleColumns, [col.id]: e.target.checked } })}
                      className="rounded border-slate-300 text-blue-600 w-4 h-4"
                    />
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-tight">{col.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-[10px] font-black text-blue-700 uppercase tracking-widest leading-relaxed">
                Note: Settings are ledger-specific.
              </p>
            </div>
          </div>
        )}

        <div className="shrink-0 pt-4 border-t border-slate-100">
          <Button variant="outline" className="w-full font-bold uppercase tracking-widest text-[10px]" onClick={onClose}>Close Window</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
