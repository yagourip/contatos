import React, { useState } from 'react';
import { Mail, Phone, MessageSquare, Building2, MapPin, Tag, FileText, Star, Edit3, Trash2, X, ExternalLink, Copy, Check, Calendar } from 'lucide-react';
import { Contact } from '../types/contact.ts';
import { getAvatarColor, getInitials, formatWhatsAppUrl } from '../utils/contactExportImport.ts';

interface ContactDetailModalProps {
  contact: Contact | null;
  onClose: () => void;
  onEdit: (contact: Contact) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

export const ContactDetailModal: React.FC<ContactDetailModalProps> = ({
  contact,
  onClose,
  onEdit,
  onDelete,
  onToggleFavorite,
}) => {
  const [copied, setCopied] = useState(false);

  if (!contact) return null;

  const whatsAppUrl = formatWhatsAppUrl(contact.phone);
  const avatarBg = getAvatarColor(contact.name);
  const initials = getInitials(contact.name);

  const handleCopyInfo = () => {
    const text = `Nome: ${contact.name}
Email: ${contact.email || '—'}
Telefone: ${contact.phone || '—'}
Empresa: ${contact.company || '—'}
Cargo: ${contact.role || '—'}
Categoria: ${contact.category}
Endereço: ${contact.address || '—'}
Notas: ${contact.notes || '—'}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const mapsUrl = contact.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contact.address)}`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-start justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            {contact.avatar_url ? (
              <img
                src={contact.avatar_url}
                alt={contact.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-xs"
              />
            ) : (
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl shadow-xs ${avatarBg}`}
              >
                {initials}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 truncate">{contact.name}</h2>
                <button
                  type="button"
                  onClick={() => onToggleFavorite(contact.id)}
                  className={`p-1 rounded-md transition-colors ${
                    contact.favorite
                      ? 'text-amber-500 hover:text-amber-600'
                      : 'text-slate-300 hover:text-slate-400'
                  }`}
                  title={contact.favorite ? 'Remover favorito' : 'Marcar favorito'}
                >
                  <Star className={`w-4 h-4 ${contact.favorite ? 'fill-amber-400' : ''}`} />
                </button>
              </div>
              {(contact.role || contact.company) && (
                <p className="text-xs text-slate-600 mt-0.5 truncate flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>
                    {contact.role ? contact.role : ''}
                    {contact.role && contact.company ? ' · ' : ''}
                    {contact.company ? contact.company : ''}
                  </span>
                </p>
              )}
              <div className="mt-1 text-xs text-slate-500">
                <span className="font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                  {contact.category}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick action bar */}
        <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-200 bg-white">
          {whatsAppUrl ? (
            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noreferrer"
              className="py-3 px-2 flex flex-col items-center justify-center text-emerald-600 hover:bg-emerald-50/50 transition-colors text-xs font-medium gap-1"
            >
              <MessageSquare className="w-4 h-4" />
              <span>WhatsApp</span>
            </a>
          ) : (
            <div className="py-3 px-2 flex flex-col items-center justify-center text-slate-300 text-xs gap-1 cursor-not-allowed">
              <MessageSquare className="w-4 h-4" />
              <span>WhatsApp</span>
            </div>
          )}

          {contact.phone ? (
            <a
              href={`tel:${contact.phone}`}
              className="py-3 px-2 flex flex-col items-center justify-center text-slate-700 hover:bg-slate-50 transition-colors text-xs font-medium gap-1"
            >
              <Phone className="w-4 h-4 text-slate-500" />
              <span>Ligar</span>
            </a>
          ) : (
            <div className="py-3 px-2 flex flex-col items-center justify-center text-slate-300 text-xs gap-1 cursor-not-allowed">
              <Phone className="w-4 h-4" />
              <span>Ligar</span>
            </div>
          )}

          {contact.email ? (
            <a
              href={`mailto:${contact.email}`}
              className="py-3 px-2 flex flex-col items-center justify-center text-slate-700 hover:bg-slate-50 transition-colors text-xs font-medium gap-1"
            >
              <Mail className="w-4 h-4 text-slate-500" />
              <span>E-mail</span>
            </a>
          ) : (
            <div className="py-3 px-2 flex flex-col items-center justify-center text-slate-300 text-xs gap-1 cursor-not-allowed">
              <Mail className="w-4 h-4" />
              <span>E-mail</span>
            </div>
          )}
        </div>

        {/* Modal Body Info */}
        <div className="p-6 space-y-4 text-xs">
          {/* Telefone */}
          <div className="flex items-start gap-3">
            <Phone className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-slate-400 block text-[11px]">Telefone</span>
              <span className="font-mono text-slate-900 font-medium text-xs">
                {contact.phone || 'Não informado'}
              </span>
            </div>
          </div>

          {/* Email */}
          <div className="flex items-start gap-3">
            <Mail className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-slate-400 block text-[11px]">E-mail</span>
              {contact.email ? (
                <a href={`mailto:${contact.email}`} className="font-mono text-emerald-700 hover:underline">
                  {contact.email}
                </a>
              ) : (
                <span className="text-slate-500">Não informado</span>
              )}
            </div>
          </div>

          {/* Endereço */}
          {contact.address && (
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="text-slate-400 block text-[11px]">Endereço</span>
                <span className="text-slate-800">{contact.address}</span>
                {mapsUrl && (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-emerald-700 hover:underline mt-1 block"
                  >
                    Ver no Google Maps <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Tags */}
          {contact.tags && contact.tags.length > 0 && (
            <div className="flex items-start gap-3">
              <Tag className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-400 block text-[11px] mb-1">Tags</span>
                <div className="flex flex-wrap gap-1">
                  {contact.tags.map((t, idx) => (
                    <span key={idx} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Notas */}
          {contact.notes && (
            <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
              <FileText className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-400 block text-[11px] mb-0.5">Observações</span>
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{contact.notes}</p>
              </div>
            </div>
          )}

          {/* Metadados / Timestamps */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Criado: {new Date(contact.created_at).toLocaleDateString('pt-BR')}
            </span>
            <button
              type="button"
              onClick={handleCopyInfo}
              className="flex items-center gap-1 text-slate-500 hover:text-slate-800 font-sans"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span>Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copiar Dados</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={() => onDelete(contact.id)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100/70 rounded-lg transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Excluir</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Fechar
            </button>
            <button
              type="button"
              onClick={() => onEdit(contact)}
              className="flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Editar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
