import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Contact, SupabaseConfig } from '../types/contact.ts';
import { INITIAL_DEMO_CONTACTS } from '../utils/mockContacts.ts';

const STORAGE_KEY_CONFIG = 'supabase_contacts_config';
const STORAGE_KEY_LOCAL_DATA = 'supabase_contacts_local_data';

export const DEFAULT_SQL_SCHEMA = `-- ==============================================================================
-- SCRIPT DE CONFIGURAÇÃO DO SUPABASE: BANCO DE DADOS & POLÍTICAS DE ARMAZENAMENTO
-- Execute este script no "SQL Editor" do seu painel Supabase (https://supabase.com/dashboard)
-- ==============================================================================

-- 1. CRIAR A TABELA DE CONTATOS (Armazenamento de Dados)
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade, -- Opcional: vínculo se usar login Supabase
  name text not null,
  email text,
  phone text,
  company text,
  role text,
  category text default 'Trabalho',
  notes text,
  favorite boolean default false,
  avatar_url text,
  address text,
  tags text[] default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. HABILITAR ROW LEVEL SECURITY (RLS) NA TABELA
alter table public.contacts enable row level security;

-- 3. POLÍTICAS DE SEGURANÇA (RLS) PARA A TABELA DE CONTATOS
-- (Permite operações via chave anônima/pública anon_key e usuários autenticados)

-- 3.1 Política de Leitura (SELECT)
drop policy if exists "Permitir leitura de contatos" on public.contacts;
create policy "Permitir leitura de contatos"
  on public.contacts
  for select
  using (true);

-- 3.2 Política de Inserção (INSERT)
drop policy if exists "Permitir criacao de contatos" on public.contacts;
create policy "Permitir criacao de contatos"
  on public.contacts
  for insert
  with check (true);

-- 3.3 Política de Atualização (UPDATE)
drop policy if exists "Permitir atualizacao de contatos" on public.contacts;
create policy "Permitir atualizacao de contatos"
  on public.contacts
  for update
  using (true)
  with check (true);

-- 3.4 Política de Exclusão (DELETE)
drop policy if exists "Permitir exclusao de contatos" on public.contacts;
create policy "Permitir exclusao de contatos"
  on public.contacts
  for delete
  using (true);


-- 4. POLÍTICAS DE ARMAZENAMENTO DE ARQUIVOS (SUPABASE STORAGE)
-- Criação do Bucket público 'contact-avatars' para fotos e anexos de contatos
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'contact-avatars',
  'contact-avatars',
  true,
  5242880, -- Limite de 5MB por arquivo
  array['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'image/svg+xml']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880;

-- 4.1 Política de Leitura Pública do Storage (Download / Visualização)
drop policy if exists "Avatares e Fotos Publicas" on storage.objects;
create policy "Avatares e Fotos Publicas"
  on storage.objects
  for select
  using (bucket_id = 'contact-avatars');

-- 4.2 Política de Upload de Fotos no Storage (INSERT)
drop policy if exists "Permitir Upload de Fotos de Contato" on storage.objects;
create policy "Permitir Upload de Fotos de Contato"
  on storage.objects
  for insert
  with check (bucket_id = 'contact-avatars');

-- 4.3 Política de Atualização de Fotos no Storage (UPDATE)
drop policy if exists "Permitir Atualizar Fotos de Contato" on storage.objects;
create policy "Permitir Atualizar Fotos de Contato"
  on storage.objects
  for update
  using (bucket_id = 'contact-avatars');

-- 4.4 Política de Exclusão de Fotos no Storage (DELETE)
drop policy if exists "Permitir Excluir Fotos de Contato" on storage.objects;
create policy "Permitir Excluir Fotos de Contato"
  on storage.objects
  for delete
  using (bucket_id = 'contact-avatars');


-- 5. TRIGGER AUTOMÁTICO: Atualizar 'updated_at' a cada alteração
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_contacts_updated_at on public.contacts;
create trigger set_contacts_updated_at
  before update on public.contacts
  for each row
  execute function public.handle_updated_at();


-- 6. ÍNDICES DE ALTA PERFORMANCE PARA BUSCA E ORDENAÇÃO
create index if not exists idx_contacts_name on public.contacts (name);
create index if not exists idx_contacts_category on public.contacts (category);
create index if not exists idx_contacts_favorite on public.contacts (favorite);
create index if not exists idx_contacts_email on public.contacts (email);
create index if not exists idx_contacts_phone on public.contacts (phone);
create index if not exists idx_contacts_created_at on public.contacts (created_at desc);
`;

export class SupabaseManager {
  private static instance: SupabaseManager;
  private client: SupabaseClient | null = null;
  private config: SupabaseConfig;

  private constructor() {
    this.config = this.loadConfig();
    this.initClient();
  }

  public static getInstance(): SupabaseManager {
    if (!SupabaseManager.instance) {
      SupabaseManager.instance = new SupabaseManager();
    }
    return SupabaseManager.instance;
  }

  private loadConfig(): SupabaseConfig {
    const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          url: parsed.url || '',
          anonKey: parsed.anonKey || '',
          tableName: parsed.tableName || 'contacts',
          isConnected: !!parsed.isConnected,
          lastTested: parsed.lastTested || null,
        };
      } catch (e) {
        console.error('Falha ao carregar configuração do Supabase:', e);
      }
    }

    // Tenta variáveis de ambiente Vite
    const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
    const envAnon = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

    return {
      url: envUrl,
      anonKey: envAnon,
      tableName: 'contacts',
      isConnected: false,
      lastTested: null,
    };
  }

  public getConfig(): SupabaseConfig {
    return { ...this.config };
  }

  public async saveConfig(url: string, anonKey: string, tableName = 'contacts'): Promise<{ success: boolean; error?: string }> {
    const cleanUrl = url.trim();
    const cleanKey = anonKey.trim();
    const cleanTable = tableName.trim() || 'contacts';

    this.config = {
      url: cleanUrl,
      anonKey: cleanKey,
      tableName: cleanTable,
      isConnected: false,
      lastTested: null,
      errorMessage: undefined,
    };

    if (!cleanUrl || !cleanKey) {
      this.client = null;
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(this.config));
      return { success: true };
    }

    try {
      // Validar formato de URL
      new URL(cleanUrl);
    } catch {
      this.config.errorMessage = 'A URL fornecida não é válida. Deve começar com https://';
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(this.config));
      return { success: false, error: this.config.errorMessage };
    }

    this.initClient();
    const testResult = await this.testConnection();
    return testResult;
  }

  private initClient(): void {
    if (this.config.url && this.config.anonKey) {
      try {
        this.client = createClient(this.config.url, this.config.anonKey, {
          auth: { persistSession: false },
        });
      } catch (e: any) {
        console.error('Erro ao inicializar Supabase client:', e);
        this.client = null;
      }
    } else {
      this.client = null;
    }
  }

  public async testConnection(): Promise<{ success: boolean; error?: string }> {
    if (!this.client || !this.config.url || !this.config.anonKey) {
      return { success: false, error: 'URL ou Chave Anônima do Supabase não configuradas.' };
    }

    try {
      const { error } = await this.client
        .from(this.config.tableName)
        .select('id')
        .limit(1);

      if (error) {
        let msg = error.message;
        if (error.code === '42P01') {
          msg = `A tabela "${this.config.tableName}" ainda não existe no seu Supabase. Use o script SQL fornecido abaixo para criá-la!`;
        } else if (error.code === 'PGRST301' || error.message.includes('JWT')) {
          msg = 'Chave Anônima (Anon Key) inválida ou expirada. Verifique no painel do Supabase em Project Settings -> API.';
        }
        this.config.isConnected = false;
        this.config.lastTested = new Date().toISOString();
        this.config.errorMessage = msg;
        localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(this.config));
        return { success: false, error: msg };
      }

      this.config.isConnected = true;
      this.config.lastTested = new Date().toISOString();
      this.config.errorMessage = undefined;
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(this.config));
      return { success: true };
    } catch (err: any) {
      const msg = err?.message || 'Falha de rede ao tentar conectar ao Supabase.';
      this.config.isConnected = false;
      this.config.lastTested = new Date().toISOString();
      this.config.errorMessage = msg;
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(this.config));
      return { success: false, error: msg };
    }
  }

  // --- Local Storage Cache & Fallback ---

  public getLocalContacts(): Contact[] {
    const raw = localStorage.getItem(STORAGE_KEY_LOCAL_DATA);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_LOCAL_DATA, JSON.stringify(INITIAL_DEMO_CONTACTS));
      return INITIAL_DEMO_CONTACTS;
    }
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : INITIAL_DEMO_CONTACTS;
    } catch {
      return INITIAL_DEMO_CONTACTS;
    }
  }

  public saveLocalContacts(contacts: Contact[]): void {
    localStorage.setItem(STORAGE_KEY_LOCAL_DATA, JSON.stringify(contacts));
  }

  // --- Operações CRUD de Contatos ---

  public async fetchContacts(): Promise<{ data: Contact[]; isLive: boolean; error?: string }> {
    if (this.client && this.config.isConnected) {
      try {
        const { data, error } = await this.client
          .from(this.config.tableName)
          .select('*')
          .order('name', { ascending: true });

        if (error) {
          console.warn('Erro ao consultar Supabase, usando cache local:', error.message);
          return { data: this.getLocalContacts(), isLive: false, error: error.message };
        }

        const normalized: Contact[] = (data || []).map((item: any) => ({
          id: String(item.id),
          name: item.name || '',
          email: item.email || '',
          phone: item.phone || '',
          company: item.company || '',
          role: item.role || '',
          category: item.category || 'Geral',
          notes: item.notes || '',
          favorite: Boolean(item.favorite),
          avatar_url: item.avatar_url || '',
          address: item.address || '',
          tags: Array.isArray(item.tags) ? item.tags : [],
          created_at: item.created_at || new Date().toISOString(),
          updated_at: item.updated_at || new Date().toISOString(),
        }));

        // Atualiza cache local
        this.saveLocalContacts(normalized);
        return { data: normalized, isLive: true };
      } catch (err: any) {
        console.warn('Exceção ao consultar Supabase:', err);
        return { data: this.getLocalContacts(), isLive: false, error: err?.message };
      }
    }

    // Modo local
    return { data: this.getLocalContacts(), isLive: false };
  }

  public async createContact(contact: Omit<Contact, 'id' | 'created_at' | 'updated_at'>): Promise<{ data?: Contact; error?: string }> {
    const now = new Date().toISOString();
    const newId = crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const newContact: Contact = {
      ...contact,
      id: newId,
      created_at: now,
      updated_at: now,
    };

    if (this.client && this.config.isConnected) {
      try {
        const payload: any = {
          name: contact.name,
          email: contact.email || null,
          phone: contact.phone || null,
          company: contact.company || null,
          role: contact.role || null,
          category: contact.category || 'Geral',
          notes: contact.notes || null,
          favorite: !!contact.favorite,
          avatar_url: contact.avatar_url || null,
          address: contact.address || null,
          tags: contact.tags || [],
          updated_at: now,
        };

        const { data, error } = await this.client
          .from(this.config.tableName)
          .insert(payload)
          .select()
          .single();

        if (error) {
          throw error;
        }

        const created: Contact = {
          id: String(data.id),
          name: data.name,
          email: data.email || '',
          phone: data.phone || '',
          company: data.company || '',
          role: data.role || '',
          category: data.category || 'Geral',
          notes: data.notes || '',
          favorite: Boolean(data.favorite),
          avatar_url: data.avatar_url || '',
          address: data.address || '',
          tags: Array.isArray(data.tags) ? data.tags : [],
          created_at: data.created_at || now,
          updated_at: data.updated_at || now,
        };

        const local = this.getLocalContacts();
        this.saveLocalContacts([created, ...local]);
        return { data: created };
      } catch (err: any) {
        console.error('Erro ao salvar no Supabase:', err);
        // Fallback local
        const local = this.getLocalContacts();
        this.saveLocalContacts([newContact, ...local]);
        return { data: newContact, error: `Salvo localmente (Erro Supabase: ${err?.message})` };
      }
    }

    // Somente local
    const local = this.getLocalContacts();
    this.saveLocalContacts([newContact, ...local]);
    return { data: newContact };
  }

  public async updateContact(contact: Contact): Promise<{ data?: Contact; error?: string }> {
    const now = new Date().toISOString();
    const updatedContact: Contact = {
      ...contact,
      updated_at: now,
    };

    if (this.client && this.config.isConnected) {
      try {
        const payload: any = {
          name: contact.name,
          email: contact.email || null,
          phone: contact.phone || null,
          company: contact.company || null,
          role: contact.role || null,
          category: contact.category || 'Geral',
          notes: contact.notes || null,
          favorite: !!contact.favorite,
          avatar_url: contact.avatar_url || null,
          address: contact.address || null,
          tags: contact.tags || [],
          updated_at: now,
        };

        const { error } = await this.client
          .from(this.config.tableName)
          .update(payload)
          .eq('id', contact.id);

        if (error) {
          throw error;
        }

        const local = this.getLocalContacts().map(c => c.id === contact.id ? updatedContact : c);
        this.saveLocalContacts(local);
        return { data: updatedContact };
      } catch (err: any) {
        console.error('Erro ao atualizar no Supabase:', err);
        const local = this.getLocalContacts().map(c => c.id === contact.id ? updatedContact : c);
        this.saveLocalContacts(local);
        return { data: updatedContact, error: `Atualizado localmente (Erro Supabase: ${err?.message})` };
      }
    }

    const local = this.getLocalContacts().map(c => c.id === contact.id ? updatedContact : c);
    this.saveLocalContacts(local);
    return { data: updatedContact };
  }

  public async deleteContact(id: string): Promise<{ success: boolean; error?: string }> {
    if (this.client && this.config.isConnected) {
      try {
        const { error } = await this.client
          .from(this.config.tableName)
          .delete()
          .eq('id', id);

        if (error) {
          throw error;
        }

        const local = this.getLocalContacts().filter(c => c.id !== id);
        this.saveLocalContacts(local);
        return { success: true };
      } catch (err: any) {
        console.error('Erro ao excluir no Supabase:', err);
        const local = this.getLocalContacts().filter(c => c.id !== id);
        this.saveLocalContacts(local);
        return { success: true, error: `Excluído localmente (Erro Supabase: ${err?.message})` };
      }
    }

    const local = this.getLocalContacts().filter(c => c.id !== id);
    this.saveLocalContacts(local);
    return { success: true };
  }

  public async deleteMultipleContacts(ids: string[]): Promise<{ success: boolean; count: number; error?: string }> {
    if (ids.length === 0) return { success: true, count: 0 };

    if (this.client && this.config.isConnected) {
      try {
        const { error } = await this.client
          .from(this.config.tableName)
          .delete()
          .in('id', ids);

        if (error) throw error;

        const local = this.getLocalContacts().filter(c => !ids.includes(c.id));
        this.saveLocalContacts(local);
        return { success: true, count: ids.length };
      } catch (err: any) {
        console.error('Erro ao excluir múltiplos no Supabase:', err);
        const local = this.getLocalContacts().filter(c => !ids.includes(c.id));
        this.saveLocalContacts(local);
        return { success: true, count: ids.length, error: err?.message };
      }
    }

    const local = this.getLocalContacts().filter(c => !ids.includes(c.id));
    this.saveLocalContacts(local);
    return { success: true, count: ids.length };
  }

  public async syncLocalToSupabase(): Promise<{ synced: number; error?: string }> {
    if (!this.client || !this.config.isConnected) {
      return { synced: 0, error: 'Supabase não está conectado.' };
    }

    const local = this.getLocalContacts();
    if (local.length === 0) return { synced: 0 };

    try {
      const rows = local.map(c => ({
        name: c.name,
        email: c.email || null,
        phone: c.phone || null,
        company: c.company || null,
        role: c.role || null,
        category: c.category || 'Geral',
        notes: c.notes || null,
        favorite: !!c.favorite,
        avatar_url: c.avatar_url || null,
        address: c.address || null,
        tags: c.tags || [],
        updated_at: new Date().toISOString(),
      }));

      const { data, error } = await this.client
        .from(this.config.tableName)
        .upsert(rows, { onConflict: 'id', ignoreDuplicates: false })
        .select();

      if (error) throw error;

      return { synced: data?.length || rows.length };
    } catch (err: any) {
      return { synced: 0, error: err?.message || 'Falha ao sincronizar com Supabase' };
    }
  }

  public async uploadAvatar(file: File): Promise<{ url?: string; error?: string }> {
    if (this.client && this.config.isConnected) {
      try {
        const ext = file.name.split('.').pop() || 'png';
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
        const filePath = `avatars/${fileName}`;

        const { error: uploadError } = await this.client.storage
          .from('contact-avatars')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true,
          });

        if (uploadError) {
          throw uploadError;
        }

        const { data: publicUrlData } = this.client.storage
          .from('contact-avatars')
          .getPublicUrl(filePath);

        return { url: publicUrlData.publicUrl };
      } catch (err: any) {
        console.warn('Erro ao fazer upload no Supabase Storage:', err);
        // Retornará erro ou fallback local
      }
    }

    // Fallback: Armazena como Data URL base64 se Storage não estiver configurado
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ url: reader.result as string });
      reader.onerror = () => resolve({ error: 'Erro ao processar imagem localmente.' });
      reader.readAsDataURL(file);
    });
  }
}

export const supabaseService = SupabaseManager.getInstance();
