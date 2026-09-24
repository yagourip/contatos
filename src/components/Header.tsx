import React from 'react';
import { Plus, Database, Upload, Download, CheckCircle2, AlertCircle } from 'lucide-react';
import { SupabaseConfig } from '../types/contact.ts';

interface HeaderProps {
  onOpenNewContact: () => void;
  onOpenSupabaseModal: () => void;
  onOpenImportModal: () => void;
  onExportCSV: () => void;
  onExportVCard: () => void;
  supabaseConfig: SupabaseConfig;
  totalContacts: number;
  favoriteCount: number;
  filter: 'all' | 'favorites';
  onFilterChange: (filter: 'all' | 'favorites') => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNewContact,
  onOpenSupabaseModal,
  onOpenImportModal,
  onExportCSV,
  onExportVCard,
  supabaseConfig,
  totalContacts,
  favoriteCount,
  filter,
  onFilterChange,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element Brand */}
        <div className="flex items-center gap-6">
          <a href="#" className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              S
            </span>
            <span>Contatos Base</span>
          </a>

          {/* Quick interactive filter tabs */}
          <div className="hidden md:flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => onFilterChange('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                filter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos ({totalContacts})
            </button>
            <button
              onClick={() => onFilterChange('favorites')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                filter === 'favorites'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Favoritos ({favoriteCount})
            </button>
          </div>
        </div>

        {/* Zone 2: Utility tools and discreet Supabase status in the corner */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Export / Import Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={onOpenImportModal}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Importar contatos (CSV)"
            >
              <Upload className="w-4 h-4" />
            </button>
            <button
              onClick={onExportCSV}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Exportar contatos (CSV)"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>

          {/* Discreet Supabase Icon Button in Corner */}
          <button
            onClick={onOpenSupabaseModal}
            className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title={
              supabaseConfig.isConnected
                ? 'Supabase Conectado (clique para gerenciar)'
                : 'Configurar Supabase (armazenamento em nuvem)'
            }
          >
            <Database className="w-4 h-4" />
            <span
              className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ${
                supabaseConfig.isConnected
                  ? 'bg-emerald-500 ring-2 ring-white'
                  : 'bg-slate-300'
              }`}
            />
          </button>
        </div>

        {/* Zone 3: Primary Action */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenNewContact}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg transition-colors shadow-xs whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Contato</span>
          </button>
        </div>
      </div>
    </header>
  );
};
