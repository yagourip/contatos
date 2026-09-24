import React from 'react';
import { UserPlus, Sparkles, Search } from 'lucide-react';

interface EmptyStateProps {
  isSearch: boolean;
  onClearSearch?: () => void;
  onNewContact: () => void;
  onLoadDemo: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  isSearch,
  onClearSearch,
  onNewContact,
  onLoadDemo,
}) => {
  if (isSearch) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center max-w-lg mx-auto my-8">
        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
          <Search className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-slate-900">Nenhum contato encontrado</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          Não encontramos nenhum contato com os termos ou filtros aplicados.
        </p>
        {onClearSearch && (
          <button
            onClick={onClearSearch}
            className="px-4 py-2 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
          >
            Limpar Filtros e Busca
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-12 text-center max-w-lg mx-auto my-8">
      <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
        <UserPlus className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-slate-900">Sua agenda está vazia</h3>
      <p className="text-xs text-slate-500 mt-1 mb-6 leading-relaxed">
        Adicione seu primeiro contato ou carregue os dados de exemplo para explorar todos os recursos do sistema com o Supabase.
      </p>
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={onNewContact}
          className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
        >
          <UserPlus className="w-4 h-4" />
          <span>Cadastrar Contato</span>
        </button>
        <button
          onClick={onLoadDemo}
          className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Carregar Exemplos</span>
        </button>
      </div>
    </div>
  );
};
