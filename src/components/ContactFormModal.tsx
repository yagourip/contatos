import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Building2, Briefcase, MapPin, Tag, FileText, Star, X, Plus, Camera, Loader2 } from 'lucide-react';
import { Contact, ContactCategory } from '../types/contact.ts';
import { supabaseService } from '../services/supabase.ts';

interface ContactFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (contactData: Omit<Contact, 'id' | 'created_at' | 'updated_at'>, id?: string) => Promise<void>;
  initialData?: Contact | null;
}

const CATEGORIES: ContactCategory[] = ['Trabalho', 'Pessoal', 'Cliente', 'Fornecedor', 'Parceiro', 'Outro'];

export const ContactFormModal: React.FC<ContactFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [category, setCategory] = useState<ContactCategory>('Trabalho');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [favorite, setFavorite] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setEmail(initialData.email || '');
      setPhone(initialData.phone || '');
      setCompany(initialData.company || '');
      setRole(initialData.role || '');
      setCategory(initialData.category || 'Trabalho');
      setAddress(initialData.address || '');
      setNotes(initialData.notes || '');
      setFavorite(!!initialData.favorite);
      setAvatarUrl(initialData.avatar_url || '');
      setTags(initialData.tags || []);
    } else {
      setName('');
      setEmail('');
      setPhone('');
      setCompany('');
      setRole('');
      setCategory('Trabalho');
      setAddress('');
      setNotes('');
      setFavorite(false);
      setAvatarUrl('');
      setTags([]);
    }
    setError(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleAddTag = () => {
    const trimmed = tagInput.trim().replace(/^#/, '');
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleKeyDownTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('O tamanho da foto deve ser menor que 5MB (limite do Storage).');
      return;
    }

    setUploadingAvatar(true);
    setError(null);

    try {
      const result = await supabaseService.uploadAvatar(file);
      if (result.url) {
        setAvatarUrl(result.url);
      } else if (result.error) {
        setError(`Aviso ao enviar foto: ${result.error}`);
      }
    } catch (err: any) {
      setError(err?.message || 'Erro ao enviar foto para o armazenamento.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Por favor, informe o nome do contato.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSave(
        {
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          company: company.trim(),
          role: role.trim(),
          category,
          address: address.trim(),
          notes: notes.trim(),
          favorite,
          avatar_url: avatarUrl.trim(),
          tags,
        },
        initialData ? initialData.id : undefined
      );
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Erro ao salvar contato.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              {initialData ? 'Editar Contato' : 'Novo Contato'}
            </h2>
            <p className="text-xs text-slate-500">
              Preencha os dados para registrar na sua base de contatos
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
              {error}
            </div>
          )}

          {/* Avatar Upload / Preview + Nome + Favorito */}
          <div className="flex items-center gap-4 p-3 bg-slate-50/70 border border-slate-200 rounded-xl">
            {/* Avatar thumbnail & file trigger */}
            <div className="relative group shrink-0">
              <label className="block cursor-pointer">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="w-14 h-14 rounded-full object-cover border-2 border-emerald-500 shadow-2xs"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-slate-200 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                    {uploadingAvatar ? (
                      <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                    ) : (
                      <Camera className="w-5 h-5" />
                    )}
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarFileChange}
                  disabled={uploadingAvatar}
                  className="hidden"
                />
              </label>
              {avatarUrl && (
                <button
                  type="button"
                  onClick={() => setAvatarUrl('')}
                  className="absolute -top-1 -right-1 bg-rose-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] hover:bg-rose-700 shadow-xs"
                  title="Remover foto"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-800">Foto do Contato</span>
                <span className="text-[10px] text-slate-400">Armazenamento Supabase</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {uploadingAvatar
                  ? 'Fazendo upload no bucket contact-avatars...'
                  : 'Clique no ícone para carregar uma imagem do seu dispositivo'}
              </p>
            </div>
          </div>

          {/* Nome e Favorito */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Nome Completo *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Carlos Santana"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>
            <div className="pt-5">
              <button
                type="button"
                onClick={() => setFavorite(!favorite)}
                className={`p-2 rounded-lg border transition-colors flex items-center gap-1.5 text-xs ${
                  favorite
                    ? 'bg-amber-50 border-amber-300 text-amber-800 font-medium'
                    : 'bg-slate-50 border-slate-300 text-slate-600 hover:bg-slate-100'
                }`}
                title="Favoritar contato"
              >
                <Star className={`w-4 h-4 ${favorite ? 'fill-amber-400 text-amber-500' : 'text-slate-400'}`} />
                <span>Favorito</span>
              </button>
            </div>
          </div>

          {/* Telefone e E-mail */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                Telefone / WhatsApp
              </label>
              <input
                type="text"
                placeholder="+55 11 98888-7777"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-mono text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                E-mail
              </label>
              <input
                type="email"
                placeholder="nome@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>
          </div>

          {/* Empresa e Cargo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                Empresa / Instituição
              </label>
              <input
                type="text"
                placeholder="Ex: Supabase Inc"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                Cargo / Função
              </label>
              <input
                type="text"
                placeholder="Ex: Engenheiro de Software"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Categoria
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    category === cat
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Endereço */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              Endereço / Localização
            </label>
            <input
              type="text"
              placeholder="Ex: Av. Paulista, 1000 - São Paulo, SP"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              Tags
            </label>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="text"
                placeholder="Adicionar tag (pressione Enter)"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleKeyDownTag}
                className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-md"
                  >
                    #{t}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="text-slate-400 hover:text-slate-700"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Notas */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Observações / Histórico
            </label>
            <textarea
              rows={2}
              placeholder="Detalhes adicionais, preferências de contato, tópicos conversados..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg transition-colors shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? 'Salvando...' : initialData ? 'Salvar Alterações' : 'Criar Contato'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
