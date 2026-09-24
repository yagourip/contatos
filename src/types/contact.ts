export type ContactCategory = 'Trabalho' | 'Pessoal' | 'Cliente' | 'Fornecedor' | 'Parceiro' | 'Outro';

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  role?: string;
  category: ContactCategory;
  notes?: string;
  favorite: boolean;
  avatar_url?: string;
  address?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  tableName: string;
  isConnected: boolean;
  lastTested: string | null;
  errorMessage?: string;
}

export type SortField = 'name' | 'company' | 'created_at' | 'category';
export type SortDirection = 'asc' | 'desc';
export type ViewMode = 'grid' | 'table';
