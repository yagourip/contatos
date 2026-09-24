import React from 'react';
import { Star, Mail, Phone, MessageSquare, Edit3, Trash2, ArrowUpDown, Building2 } from 'lucide-react';
import { Contact, SortField, SortDirection } from '../types/contact.ts';
import { getAvatarColor, getInitials, formatWhatsAppUrl } from '../utils/contactExportImport.ts';

interface ContactTableProps {
  contacts: Contact[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onSelect: (contact: Contact) => void;
  onEdit: (contact: Contact, e: React.MouseEvent) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
}

export const ContactTable: React.FC<ContactTableProps> = ({
  contacts,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onToggleFavorite,
  onSelect,
  onEdit,
  onDelete,
  sortField,
  sortDirection,
  onSort,
}) => {
  const allSelected = contacts.length > 0 && selectedIds.length === contacts.length;
  const someSelected = selectedIds.length > 0 && !allSelected;

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-medium select-none">
              <th className="py-3 px-4 w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected;
                  }}
                  onChange={onToggleSelectAll}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
              </th>
              <th className="py-3 px-2 w-8 text-center">★</th>
              <th
                onClick={() => onSort('name')}
                className="py-3 px-4 font-semibold text-slate-700 cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Contato</span>
                  <ArrowUpDown className={`w-3 h-3 ${sortField === 'name' ? 'text-emerald-600' : 'text-slate-400'}`} />
                </div>
              </th>
              <th
                onClick={() => onSort('company')}
                className="py-3 px-4 font-semibold text-slate-700 cursor-pointer hover:bg-slate-100 transition-colors hidden sm:table-cell"
              >
                <div className="flex items-center gap-1.5">
                  <span>Empresa / Cargo</span>
                  <ArrowUpDown className={`w-3 h-3 ${sortField === 'company' ? 'text-emerald-600' : 'text-slate-400'}`} />
                </div>
              </th>
              <th
                onClick={() => onSort('category')}
                className="py-3 px-4 font-semibold text-slate-700 cursor-pointer hover:bg-slate-100 transition-colors hidden md:table-cell"
              >
                <div className="flex items-center gap-1.5">
                  <span>Categoria</span>
                  <ArrowUpDown className={`w-3 h-3 ${sortField === 'category' ? 'text-emerald-600' : 'text-slate-400'}`} />
                </div>
              </th>
              <th className="py-3 px-4 font-semibold text-slate-700">Telefone / WhatsApp</th>
              <th className="py-3 px-4 font-semibold text-slate-700 hidden lg:table-cell">E-mail</th>
              <th className="py-3 px-4 text-right font-semibold text-slate-700 w-24">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700 font-sans">
            {contacts.map((contact) => {
              const isSelected = selectedIds.includes(contact.id);
              const whatsAppUrl = formatWhatsAppUrl(contact.phone);
              const avatarBg = getAvatarColor(contact.name);
              const initials = getInitials(contact.name);

              return (
                <tr
                  key={contact.id}
                  onClick={() => onSelect(contact)}
                  className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${
                    isSelected ? 'bg-emerald-50/40' : ''
                  }`}
                >
                  <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(contact.id)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                    />
                  </td>
                  <td className="py-3 px-2 text-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => onToggleFavorite(contact.id, e)}
                      className={`p-1 rounded transition-colors ${
                        contact.favorite
                          ? 'text-amber-500 hover:text-amber-600'
                          : 'text-slate-300 hover:text-slate-400'
                      }`}
                      title={contact.favorite ? 'Favorito' : 'Marcar favorito'}
                    >
                      <Star className={`w-3.5 h-3.5 ${contact.favorite ? 'fill-amber-400' : ''}`} />
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      {contact.avatar_url ? (
                        <img
                          src={contact.avatar_url}
                          alt={contact.name}
                          className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${avatarBg}`}
                        >
                          {initials}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 truncate">{contact.name}</div>
                        <div className="text-[11px] text-slate-500 sm:hidden truncate">
                          {contact.company || contact.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 hidden sm:table-cell">
                    <div className="truncate font-medium text-slate-800">{contact.company || '—'}</div>
                    {contact.role && (
                      <div className="text-[11px] text-slate-500 truncate">{contact.role}</div>
                    )}
                  </td>
                  <td className="py-3 px-4 hidden md:table-cell">
                    <span className="text-slate-600 font-medium">{contact.category}</span>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] tabular-nums whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span>{contact.phone || '—'}</span>
                      {whatsAppUrl && (
                        <a
                          href={whatsAppUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-emerald-600 hover:text-emerald-700 p-0.5"
                          title="Abrir no WhatsApp"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] hidden lg:table-cell">
                    {contact.email ? (
                      <a
                        href={`mailto:${contact.email}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-slate-600 hover:text-slate-900 truncate block max-w-[200px]"
                      >
                        {contact.email}
                      </a>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={(e) => onEdit(contact, e)}
                        className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                        title="Editar"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => onDelete(contact.id, e)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
