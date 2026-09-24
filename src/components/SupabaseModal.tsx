import React, { useState } from 'react';
import { Database, CheckCircle2, AlertCircle, Copy, Check, ExternalLink, RefreshCw, Key, Globe, Table, ShieldCheck, HardDrive } from 'lucide-react';
import { SupabaseConfig } from '../types/contact.ts';
import { DEFAULT_SQL_SCHEMA, supabaseService } from '../services/supabase.ts';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SupabaseConfig;
  onConfigUpdated: (config: SupabaseConfig) => void;
  onSyncLocal: () => Promise<void>;
  localCount: number;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({
  isOpen,
  onClose,
  config,
  onConfigUpdated,
  onSyncLocal,
  localCount,
}) => {
  const [url, setUrl] = useState(config.url);
  const [anonKey, setAnonKey] = useState(config.anonKey);
  const [tableName, setTableName] = useState(config.tableName || 'contacts');
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(
    config.lastTested
      ? {
          success: config.isConnected,
          message: config.isConnected
            ? 'Conectado com sucesso à tabela Supabase!'
            : config.errorMessage || 'Falha ao conectar.',
        }
      : null
  );
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSql, setShowSql] = useState(false);

  if (!isOpen) return null;

  const handleSaveAndTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTesting(true);
    setTestResult(null);

    const result = await supabaseService.saveConfig(url, anonKey, tableName);
    setIsTesting(false);

    if (result.success) {
      setTestResult({
        success: true,
        message: 'Conexão estabelecida com sucesso! Seu sistema agora armazena os contatos diretamente no Supabase.',
      });
    } else {
      setTestResult({
        success: false,
        message: result.error || 'Não foi possível conectar ao Supabase.',
      });
      if (result.error && result.error.includes('não existe')) {
        setShowSql(true);
      }
    }

    onConfigUpdated(supabaseService.getConfig());
  };

  const handleDisconnect = async () => {
    setUrl('');
    setAnonKey('');
    await supabaseService.saveConfig('', '', tableName);
    setTestResult(null);
    onConfigUpdated(supabaseService.getConfig());
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(DEFAULT_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleRunSync = async () => {
    setIsSyncing(true);
    await onSyncLocal();
    setIsSyncing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-xs">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 tracking-tight">Configuração do Supabase</h2>
              <p className="text-xs text-slate-500">Conecte sua instância Supabase para persistência dos contatos em nuvem</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Banner */}
          <div className={`p-4 rounded-lg border flex items-start gap-3 ${
            config.isConnected
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
              : 'bg-amber-50/80 border-amber-200 text-amber-900'
          }`}>
            {config.isConnected ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div className="text-xs leading-relaxed">
              <span className="font-semibold block mb-0.5">
                {config.isConnected ? 'Supabase Conectado e Ativo' : 'Modo de Armazenamento Local Ativo'}
              </span>
              {config.isConnected ? (
                <span>
                  Os contatos estão sendo gravados e consultados em tempo real na tabela <code className="px-1 py-0.5 bg-emerald-100/70 rounded text-emerald-800 font-mono">{config.tableName}</code> do seu projeto Supabase.
                </span>
              ) : (
                <span>
                  Os dados estão salvos localmente no seu navegador. Insira a <strong>Project URL</strong> e a <strong>Anon Key</strong> do seu projeto Supabase para sincronizar em nuvem.
                </span>
              )}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSaveAndTest} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-slate-400" />
                  Supabase Project URL
                </span>
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-700 hover:text-emerald-800 flex items-center gap-1 text-[11px]"
                >
                  Abrir Dashboard Supabase <ExternalLink className="w-3 h-3" />
                </a>
              </label>
              <input
                type="url"
                required
                placeholder="https://seu-projeto.supabase.co"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all font-mono"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Disponível no painel do Supabase em <strong>Project Settings → API → Project URL</strong>.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-slate-400" />
                Supabase Anon / Public API Key
              </label>
              <input
                type="text"
                required
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all font-mono"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Disponível em <strong>Project Settings → API → Project API keys → anon (public)</strong>.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Table className="w-3.5 h-3.5 text-slate-400" />
                Nome da Tabela no Banco
              </label>
              <input
                type="text"
                required
                placeholder="contacts"
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-mono text-xs"
              />
            </div>

            {testResult && (
              <div className={`p-3 rounded-lg text-xs border ${
                testResult.success
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}>
                {testResult.message}
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={!config.isConnected && !url}
                className="text-xs text-rose-600 hover:text-rose-700 disabled:opacity-40 disabled:hover:text-rose-600 font-medium px-2 py-1.5"
              >
                Limpar Credenciais
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isTesting}
                  className="px-4 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-2 shadow-xs disabled:opacity-60"
                >
                  {isTesting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Testando Conexão...
                    </>
                  ) : (
                    'Salvar e Testar Conexão'
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Sync Local to Supabase button (if connected) */}
          {config.isConnected && localCount > 0 && (
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between bg-slate-50 p-3.5 rounded-lg">
              <div>
                <span className="text-xs font-semibold text-slate-800 block">Sincronizar Contatos Locais</span>
                <span className="text-[11px] text-slate-500">
                  Deseja enviar os {localCount} contatos locais existentes para a tabela no Supabase?
                </span>
              </div>
              <button
                onClick={handleRunSync}
                disabled={isSyncing}
                className="px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-100/70 hover:bg-emerald-200/70 rounded-md transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Sincronizando...' : 'Enviar para Nuvem'}
              </button>
            </div>
          )}

          {/* SQL Generator Helper Section */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setShowSql(!showSql)}
              className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 text-left flex items-center justify-between text-xs font-medium text-slate-800 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold">Script SQL com Políticas de Armazenamento e RLS</span>
              </div>
              <span className="text-emerald-700 text-[11px] font-medium">
                {showSql ? 'Ocultar Script' : 'Ver Script SQL Completo'}
              </span>
            </button>

            {/* Always visible feature summary when collapsed or expanded */}
            <div className="px-4 py-2.5 bg-slate-50/50 border-t border-slate-200 text-[11px] text-slate-600 flex flex-wrap gap-x-4 gap-y-1">
              <span className="flex items-center gap-1 text-slate-700">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                Tabela <code>contacts</code> com RLS
              </span>
              <span className="flex items-center gap-1 text-slate-700">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                Políticas SELECT, INSERT, UPDATE, DELETE
              </span>
              <span className="flex items-center gap-1 text-slate-700">
                <HardDrive className="w-3.5 h-3.5 text-emerald-600" />
                Bucket Storage <code>contact-avatars</code> (5MB)
              </span>
              <span className="flex items-center gap-1 text-slate-700">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Políticas em <code>storage.objects</code>
              </span>
            </div>

            {showSql && (
              <div className="p-4 bg-slate-900 text-slate-200 text-xs font-mono relative">
                <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-800">
                  <div>
                    <span className="text-xs font-semibold text-slate-300 block">PostgreSQL + Supabase Storage Script</span>
                    <span className="text-[10px] text-slate-400 font-sans">Pronto para rodar no SQL Editor do Supabase</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopySql}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-xs font-sans font-medium transition-colors shadow-xs cursor-pointer"
                  >
                    {copiedSql ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copiado com Sucesso!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar Todo o Script SQL</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="overflow-x-auto max-h-72 text-[11px] leading-relaxed text-emerald-300/90 whitespace-pre p-2 bg-slate-950/80 rounded border border-slate-800 selection:bg-emerald-700 selection:text-white">
                  {DEFAULT_SQL_SCHEMA}
                </pre>
                <div className="mt-3 text-[11px] text-slate-300 border-t border-slate-800 pt-2.5 font-sans space-y-1">
                  <p>
                    💡 <strong>Instruções de execução no Supabase:</strong>
                  </p>
                  <ol className="list-decimal list-inside text-slate-400 space-y-0.5 pl-1 text-[11px]">
                    <li>Acesse o dashboard do seu projeto no Supabase (<a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-emerald-400 underline">supabase.com/dashboard</a>).</li>
                    <li>No menu lateral esquerdo, clique em <strong>SQL Editor</strong>.</li>
                    <li>Clique em <strong>New Query</strong>, cole o código copiado acima e clique no botão verde <strong>Run</strong>.</li>
                    <li>Pronto! A tabela, o bucket de arquivos e todas as políticas de segurança estarão ativas.</li>
                  </ol>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
