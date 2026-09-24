/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  LayoutGrid,
  List,
  Filter,
  ArrowUpDown,
  Download,
  Trash2,
  Database,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { Contact, ContactCategory, SortDirection, SortField, ViewMode } from './types/contact.ts';
import { supabaseService } from './services/supabase.ts';
import { exportToCSV, exportToVCard } from './utils/contactExportImport.ts';
import { INITIAL_DEMO_CONTACTS } from './utils/mockContacts.ts';

import { Header } from './components/Header.tsx';
import { ContactCard } from './components/ContactCard.tsx';
import { ContactTable } from './components/ContactTable.tsx';
import { ContactFormModal } from './components/ContactFormModal.tsx';
import { ContactDetailModal } from './components/ContactDetailModal.tsx';
import { SupabaseModal } from './components/SupabaseModal.tsx';
import { ImportModal } from './components/ImportModal.tsx';
import { DeleteConfirmModal } from './components/DeleteConfirmModal.tsx';
import { EmptyState } from './components/EmptyState.tsx';

const CATEGORIES: ('Todos' | ContactCategory)[] = [
  'Todos',
  'Trabalho',
  'Cliente',
  'Parceiro',
  'Fornecedor',
  'Pessoal',
  'Outro',
];

export default function App() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLiveDatabase, setIsLiveDatabase] = useState(false);
  const [supabaseConfig, setSupabaseConfig] = useState(supabaseService.getConfig());

  // Filters & Controls
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'Todos' | ContactCategory>('Todos');
  const [quickFilter, setQuickFilter] = useState<'all' | 'favorites'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [detailContact, setDetailContact] = useState<Contact | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    id?: string;
    isBatch?: boolean;
    title: string;
    description: string;
  }>({
    isOpen: false,
    title: '',
    description: '',
  });

  // Notification Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Initial load
  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    setLoading(true);
    try {
      const { data, isLive, error } = await supabaseService.fetchContacts();
      setContacts(data);
      setIsLiveDatabase(isLive);
      setSupabaseConfig(supabaseService.getConfig());

      if (error && !isLive && supabaseService.getConfig().isConnected) {
        showToast(`Aviso: Usando cache local (${error})`, 'info');
      }
    } catch (err: any) {
      console.error('Erro ao carregar contatos:', err);
      showToast('Erro ao carregar contatos.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // CRUD Handlers
  const handleSaveContact = async (
    contactData: Omit<Contact, 'id' | 'created_at' | 'updated_at'>,
    id?: string
  ) => {
    if (id) {
      // Update
      const existing = contacts.find((c) => c.id === id);
      if (!existing) return;

      const updatedObj: Contact = {
        ...existing,
        ...contactData,
      };

      const res = await supabaseService.updateContact(updatedObj);
      if (res.data) {
        setContacts((prev) => prev.map((c) => (c.id === id ? res.data! : c)));
        if (detailContact && detailContact.id === id) {
          setDetailContact(res.data);
        }
        showToast('Contato atualizado com sucesso!');
      }
    } else {
      // Create
      const res = await supabaseService.createContact(contactData);
      if (res.data) {
        setContacts((prev) => [res.data!, ...prev]);
        showToast('Contato cadastrado com sucesso!');
      }
    }
  };

  const handleToggleFavorite = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const contact = contacts.find((c) => c.id === id);
    if (!contact) return;

    const updated = { ...contact, favorite: !contact.favorite };
    // Optimistic UI update
    setContacts((prev) => prev.map((c) => (c.id === id ? updated : c)));
    if (detailContact && detailContact.id === id) {
      setDetailContact(updated);
    }

    await supabaseService.updateContact(updated);
  };

  const handleDeleteClick = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const contact = contacts.find((c) => c.id === id);
    setDeleteConfirm({
      isOpen: true,
      id,
      isBatch: false,
      title: 'Excluir Contato',
      description: `Tem certeza que deseja remover o contato "${contact?.name || 'selecionado'}"? Esta ação não pode ser desfeita.`,
    });
  };

  const handleBatchDeleteClick = () => {
    if (selectedIds.length === 0) return;
    setDeleteConfirm({
      isOpen: true,
      isBatch: true,
      title: `Excluir ${selectedIds.length} Contatos`,
      description: `Tem certeza que deseja excluir permanentemente os ${selectedIds.length} contatos selecionados?`,
    });
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirm.isBatch) {
      await supabaseService.deleteMultipleContacts(selectedIds);
      setContacts((prev) => prev.filter((c) => !selectedIds.includes(c.id)));
      setSelectedIds([]);
      showToast(`${selectedIds.length} contatos excluídos.`);
    } else if (deleteConfirm.id) {
      await supabaseService.deleteContact(deleteConfirm.id);
      setContacts((prev) => prev.filter((c) => c.id !== deleteConfirm.id));
      if (detailContact && detailContact.id === deleteConfirm.id) {
        setDetailContact(null);
      }
      showToast('Contato excluído com sucesso.');
    }
    setDeleteConfirm((prev) => ({ ...prev, isOpen: false }));
  };

  const handleImportContacts = async (imported: Partial<Contact>[]) => {
    let count = 0;
    for (const item of imported) {
      if (!item.name) continue;
      await supabaseService.createContact({
        name: item.name,
        email: item.email || '',
        phone: item.phone || '',
        company: item.company || '',
        role: item.role || '',
        category: (item.category as any) || 'Trabalho',
        notes: item.notes || '',
        favorite: !!item.favorite,
        avatar_url: item.avatar_url || '',
        address: item.address || '',
        tags: item.tags || [],
      });
      count++;
    }
    await loadContacts();
    showToast(`${count} contatos importados com sucesso!`);
  };

  const handleSyncLocalToSupabase = async () => {
    const res = await supabaseService.syncLocalToSupabase();
    if (res.error) {
      showToast(`Erro na sincronização: ${res.error}`, 'error');
    } else {
      showToast(`${res.synced} contatos sincronizados no Supabase!`, 'success');
      await loadContacts();
    }
  };

  const handleLoadDemoContacts = async () => {
    for (const demo of INITIAL_DEMO_CONTACTS) {
      await supabaseService.createContact(demo);
    }
    await loadContacts();
    showToast('Contatos de exemplo adicionados com sucesso!');
  };

  // Sorting Handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filtering & Sorting pipeline
  const filteredAndSortedContacts = useMemo(() => {
    return contacts
      .filter((contact) => {
        // Quick filter
        if (quickFilter === 'favorites' && !contact.favorite) {
          return false;
        }

        // Category filter
        if (selectedCategory !== 'Todos' && contact.category !== selectedCategory) {
          return false;
        }

        // Search Query
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase().trim();
          const matchName = contact.name.toLowerCase().includes(query);
          const matchEmail = contact.email.toLowerCase().includes(query);
          const matchPhone = contact.phone.toLowerCase().includes(query);
          const matchCompany = (contact.company || '').toLowerCase().includes(query);
          const matchRole = (contact.role || '').toLowerCase().includes(query);
          const matchTag = (contact.tags || []).some((t) => t.toLowerCase().includes(query));
          return matchName || matchEmail || matchPhone || matchCompany || matchRole || matchTag;
        }

        return true;
      })
      .sort((a, b) => {
        let valA = '';
        let valB = '';

        if (sortField === 'name') {
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
        } else if (sortField === 'company') {
          valA = (a.company || '').toLowerCase();
          valB = (b.company || '').toLowerCase();
        } else if (sortField === 'category') {
          valA = a.category.toLowerCase();
          valB = b.category.toLowerCase();
        } else if (sortField === 'created_at') {
          valA = a.created_at;
          valB = b.created_at;
        }

        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
  }, [contacts, quickFilter, selectedCategory, searchQuery, sortField, sortDirection]);

  // Selection handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredAndSortedContacts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredAndSortedContacts.map((c) => c.id));
    }
  };

  const handleExportSelectedCSV = () => {
    const toExport = contacts.filter((c) => selectedIds.includes(c.id));
    exportToCSV(toExport.length > 0 ? toExport : contacts);
    showToast('Arquivo CSV baixado com sucesso!');
  };

  const favoriteCount = useMemo(() => contacts.filter((c) => c.favorite).length, [contacts]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-fade-in shadow-lg">
          <div
            className={`px-4 py-3 rounded-lg text-xs font-medium border flex items-center gap-2.5 ${
              toast.type === 'error'
                ? 'bg-rose-900 text-white border-rose-800'
                : toast.type === 'info'
                ? 'bg-slate-900 text-white border-slate-800'
                : 'bg-emerald-900 text-white border-emerald-800'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Top Bar Header */}
      <Header
        onOpenNewContact={() => {
          setEditingContact(null);
          setIsFormModalOpen(true);
        }}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onExportCSV={() => {
          exportToCSV(contacts);
          showToast('Exportação CSV iniciada.');
        }}
        onExportVCard={() => {
          exportToVCard(contacts);
          showToast('Exportação vCard (.vcf) iniciada.');
        }}
        supabaseConfig={supabaseConfig}
        totalContacts={contacts.length}
        favoriteCount={favoriteCount}
        filter={quickFilter}
        onFilterChange={setQuickFilter}
      />

      {/* Main Workspace Viewport */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {/* Controls Bar: Search, Category Tabs, View Switcher */}
        <div className="space-y-4 mb-6">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nome, e-mail, telefone, empresa ou tag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all shadow-2xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Right action group: View mode, Sort, Refresh */}
            <div className="flex items-center gap-2 self-end md:self-auto">
              {/* Sort selector */}
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-600 shadow-2xs">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline text-slate-400">Ordenar:</span>
                <select
                  value={`${sortField}-${sortDirection}`}
                  onChange={(e) => {
                    const [f, d] = e.target.value.split('-');
                    setSortField(f as SortField);
                    setSortDirection(d as SortDirection);
                  }}
                  className="bg-transparent border-none text-xs font-medium text-slate-800 focus:outline-none cursor-pointer pr-2"
                >
                  <option value="name-asc">Nome (A - Z)</option>
                  <option value="name-desc">Nome (Z - A)</option>
                  <option value="company-asc">Empresa (A - Z)</option>
                  <option value="created_at-desc">Mais Recentes</option>
                  <option value="category-asc">Categoria</option>
                </select>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-slate-100 text-slate-900'
                      : 'text-slate-400 hover:text-slate-700'
                  }`}
                  title="Visualização em Cards"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-md transition-colors ${
                    viewMode === 'table'
                      ? 'bg-slate-100 text-slate-900'
                      : 'text-slate-400 hover:text-slate-700'
                  }`}
                  title="Visualização em Tabela"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              {/* Reload Button */}
              <button
                onClick={loadContacts}
                disabled={loading}
                className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors shadow-2xs disabled:opacity-50"
                title="Recarregar dados"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Category Filter Tabs (Interactive button filter tabs) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {cat}
                {cat !== 'Todos' && (
                  <span className="ml-1.5 opacity-60 text-[11px] tabular-nums">
                    {contacts.filter((c) => c.category === cat).length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Batch Actions Bar (when contacts are selected in table view) */}
          {selectedIds.length > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center justify-between animate-fade-in text-xs">
              <span className="font-semibold text-emerald-900">
                {selectedIds.length} {selectedIds.length === 1 ? 'contato selecionado' : 'contatos selecionados'}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportSelectedCSV}
                  className="px-3 py-1.5 bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100/50 rounded-md font-medium transition-colors flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Exportar CSV</span>
                </button>
                <button
                  onClick={handleBatchDeleteClick}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-md font-medium transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir Selecionados</span>
                </button>
                <button
                  onClick={() => setSelectedIds([])}
                  className="text-slate-500 hover:text-slate-800 text-xs px-2"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Content Display */}
        {loading ? (
          <div className="py-20 text-center">
            <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-500 font-medium">Carregando contatos...</p>
          </div>
        ) : filteredAndSortedContacts.length === 0 ? (
          <EmptyState
            isSearch={!!searchQuery || selectedCategory !== 'Todos' || quickFilter !== 'all'}
            onClearSearch={() => {
              setSearchQuery('');
              setSelectedCategory('Todos');
              setQuickFilter('all');
            }}
            onNewContact={() => {
              setEditingContact(null);
              setIsFormModalOpen(true);
            }}
            onLoadDemo={handleLoadDemoContacts}
          />
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAndSortedContacts.map((contact) => (
              <ContactCard
                key={contact.id}
                contact={contact}
                onSelect={(c) => setDetailContact(c)}
                onToggleFavorite={handleToggleFavorite}
                onEdit={(c, e) => {
                  e.stopPropagation();
                  setEditingContact(c);
                  setIsFormModalOpen(true);
                }}
                onDelete={handleDeleteClick}
              />
            ))}
          </div>
        ) : (
          <ContactTable
            contacts={filteredAndSortedContacts}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onToggleSelectAll={handleToggleSelectAll}
            onSelect={(c) => setDetailContact(c)}
            onToggleFavorite={handleToggleFavorite}
            onEdit={(c, e) => {
              e.stopPropagation();
              setEditingContact(c);
              setIsFormModalOpen(true);
            }}
            onDelete={handleDeleteClick}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
          />
        )}
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Contatos Base</span>
            <span aria-hidden="true">·</span>
            <span>Armazenamento relacional de contatos</span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <button
              onClick={() => setIsSupabaseModalOpen(true)}
              className="text-slate-400 hover:text-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
              title="Configurações do Supabase"
            >
              <Database className="w-3.5 h-3.5" />
              <span>{supabaseConfig.isConnected ? 'Supabase Ativo' : 'Supabase'}</span>
            </button>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span className="font-mono tabular-nums text-slate-400">
              {contacts.length} {contacts.length === 1 ? 'registro' : 'registros'}
            </span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <SupabaseModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        config={supabaseConfig}
        onConfigUpdated={(cfg) => {
          setSupabaseConfig(cfg);
          loadContacts();
        }}
        onSyncLocal={handleSyncLocalToSupabase}
        localCount={contacts.length}
      />

      <ContactFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingContact(null);
        }}
        onSave={handleSaveContact}
        initialData={editingContact}
      />

      <ContactDetailModal
        contact={detailContact}
        onClose={() => setDetailContact(null)}
        onEdit={(c) => {
          setDetailContact(null);
          setEditingContact(c);
          setIsFormModalOpen(true);
        }}
        onDelete={(id) => {
          setDetailContact(null);
          handleDeleteClick(id);
        }}
        onToggleFavorite={handleToggleFavorite}
      />

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportContacts}
      />

      <DeleteConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={handleConfirmDelete}
        title={deleteConfirm.title}
        description={deleteConfirm.description}
      />
    </div>
  );
}
