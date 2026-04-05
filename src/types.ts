
export enum TransactionType {
  IN = 'IN',
  OUT = 'OUT'
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

export interface Business {
  id: string;
  userId: string;
  name: string;
  currency: string;
  createdAt: number;
}

export interface Book {
  id: string;
  businessId: string;
  name: string;
  createdAt: number;
}

export interface Transaction {
  id: string;
  bookId: string;
  amount: number;
  type: TransactionType;
  date: string; // ISO Date string YYYY-MM-DD
  time: string; // HH:mm
  note: string;
  partyName?: string; // Customer or Client Name
  category?: string; // Tag
  attachmentUrl?: string; // Base64 or URL
  createdAt: number;
  paymentMode?: string;
  mainCategory?: string;
  subCategory?: string;
  entryBy?: string;
  metadata?: Record<string, any>;
}

// Helper types for UI
export interface BookWithTotals extends Book {
  totalIn: number;
  totalOut: number;
  countIn: number;
  countOut: number;
  balance: number;
}

export interface BusinessWithTotals extends Business {
  totalIn: number;
  totalOut: number;
  balance: number;
  bookCount: number;
  books?: BookWithTotals[]; // Quick links
  role?: 'owner' | 'admin' | 'editor' | 'viewer'; // User's role in this business
  isShared?: boolean; // True if user is a collaborator, not the owner
}

export interface ProjectCollaborator {
  id: string;
  projectId: string;
  userEmail: string;
  role: 'admin' | 'editor' | 'viewer';
  accessibleLedgerIds: string[]; // IDs of specific books shared
  createdAt: number;
}

export interface JoinCode {
  id: string;
  code: string;
  projectId: string;
  role: 'admin' | 'editor' | 'viewer';
  accessibleLedgerIds: string[];
  createdAt: number;
  expiresAt: number;
}

export interface TransactionWithBalance extends Transaction {
  runningBalance: number;
}

export interface CustomField {
  id: string;
  userId: string;
  name: string;
  type: 'text' | 'number' | 'date';
  required: boolean;
}

export interface CustomCategory {
  id: string;
  userId: string;
  name: string;
  type: TransactionType | 'BOTH';
}

export interface CustomSubcategory {
  id: string;
  userId: string;
  categoryId: string;
  name: string;
}

export interface CustomPaymentMode {
  id: string;
  userId: string;
  name: string;
}

export interface AppSettings {
  categories: CustomCategory[];
  subcategories: CustomSubcategory[];
  fields: CustomField[];
  paymentModes: CustomPaymentMode[];
}

export type ViewState = 
  | { name: 'AUTH' }
  | { name: 'DASHBOARD' }
  | { name: 'BUSINESS_DETAIL'; businessId: string }
  | { name: 'BOOK_DETAIL'; businessId: string; bookId: string }
  | { name: 'BOOK_ANALYTICS'; businessId: string; bookId: string }
  | { name: 'SETTINGS' }
  | { name: 'TODOS' };
