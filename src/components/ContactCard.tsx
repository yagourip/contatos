import React from 'react';
import { Star, Mail, Phone, MessageSquare, MoreHorizontal, Building2, MapPin, Edit3, Trash2 } from 'lucide-react';
import { Contact } from '../types/contact.ts';
import { getAvatarColor, getInitials, formatWhatsAppUrl } from '../utils/contactExportImport.ts';

interface ContactCardProps {
  contact: Contact;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onSelect: (contact: Contact) => void;
  onEdit: (contact: Contact, e: React.MouseEvent) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
}

export const ContactCard: React.FC<ContactCardProps> = ({
  contact,
  onToggleFavorite,
  onSelect,
  onEdit,
  onDelete,
}) => {
  const whatsAppUrl = formatWhatsAppUrl(contact.phone);
  const avatarBg = getAvatarColor(contact.name);
  const initials = getInitials(contact.name);

  return (
    <div
      onClick={() => onSelect(contact)}
      className="group relative bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-5 transition-all duration-200 hover:shadow-md cursor-pointer flex flex-col justify-between"
    >
      <div>
        {/* Top bar of card: Avatar, Name, Favorite */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            {contact.avatar_url ? (
              <img
                src={contact.avatar_url}
                alt={contact.name}
                referrerPolicy="no-referrer"
                className="w-11 h-11 rounded-full object-cover border border-slate-200 shrink-0"
              />
            ) : (
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs ${avatarBg}`}
              >
                {initials}
              </div>
            )}
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-slate-900 truncate group-hover:text-emerald-700 transition-colors">
                {contact.name}
              </h3>
              {(contact.role || contact.company) && (
                <p className="text-xs text-slate-500 truncate flex items-center gap-1.5 mt-0.5">
                  <Building2 className="w-3 h-3 shrink-0 text-slate-400" />
                  <span className="truncate">
                    {contact.role ? contact.role : ''}
                    {contact.role && contact.company ? ' · ' : ''}
                    {contact.company ? contact.company : ''}
                  </span>
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => onToggleFavorite(contact.id, e)}
            className={`p-1.5 rounded-lg transition-colors ${
              contact.favorite
                ? 'text-amber-500 hover:text-amber-600 bg-amber-50'
                : 'text-slate-300 hover:text-slate-400 hover:bg-slate-100'
            }`}
            title={contact.favorite ? 'Remover dos favoritos' : 'Marcar como favorito'}
          >
            <Star className={`w-4 h-4 ${contact.favorite ? 'fill-amber-400' : ''}`} />
          </button>
        </div>

        {/* Clean unboxed metadata with typographic separators (Zero-Pill discipline) */}
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-4 flex-wrap">
          <span className="font-medium text-slate-700">{contact.category}</span>
          {contact.address && (
            <>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span className="truncate max-w-[180px] flex items-center gap-1" title={contact.address}>
                <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                {contact.address}
              </span>
            </>
          )}
        </div>

        {/* Communication details */}
        <div className="space-y-1.5 mb-4 text-xs">
          {contact.phone && (
            <div className="flex items-center justify-between text-slate-600 group/phone py-0.5">
              <span className="flex items-center gap-2 truncate font-mono text-[11px] tabular-nums">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                {contact.phone}
              </span>
              <div className="flex items-center gap-1 opacity-80 group-hover/phone:opacity-100">
                {whatsAppUrl && (
                  <a
                    href={whatsAppUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-1 rounded text-emerald-600 hover:bg-emerald-50 transition-colors"
                    title="Conversar no WhatsApp"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                  </a>
                )}
                <a
                  href={`tel:${contact.phone}`}
                  onClick={(e) => e.stopPropagation()}
                  className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                  title="Ligar"
                >
                  <Phone className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}

          {contact.email && (
            <div className="flex items-center justify-between text-slate-600 group/email py-0.5">
              <span className="flex items-center gap-2 truncate font-mono text-[11px]">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{contact.email}</span>
              </span>
              <a
                href={`mailto:${contact.email}`}
                onClick={(e) => e.stopPropagation()}
                className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0"
                title="Enviar E-mail"
              >
                <Mail className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>

        {/* Tags if any */}
        {contact.tags && contact.tags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap mb-2">
            {contact.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-xs font-normal"
              >
                #{tag}
              </span>
            ))}
            {contact.tags.length > 3 && (
              <span className="text-[11px] text-slate-400">+{contact.tags.length - 3}</span>
            )}
          </div>
        )}
      </div>

      {/* Card Footer Actions */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-2">
        <span className="text-[11px] text-slate-400 font-mono tabular-nums">
          {new Date(contact.updated_at || contact.created_at).toLocaleDateString('pt-BR')}
        </span>

        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={(e) => onEdit(contact, e)}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
            title="Editar contato"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => onDelete(contact.id, e)}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
            title="Excluir contato"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
