import React, { useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, X, Download } from 'lucide-react';
import { Contact } from '../types/contact.ts';
import { parseCSV } from '../utils/contactExportImport.ts';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (contacts: Partial<Contact>[]) => Promise<void>;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const [parsedContacts, setParsedContacts] = useState<Partial<Contact>[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const contacts = parseCSV(text);
        if (contacts.length === 0) {
          setError('Nenhum contato válido encontrado no arquivo CSV. Verifique se o arquivo possui a coluna "Nome".');
          setParsedContacts([]);
        } else {
          setParsedContacts(contacts);
        }
      } catch (err: any) {
        setError('Erro ao processar arquivo: ' + err?.message);
        setParsedContacts([]);
      }
    };
    reader.readAsText(file);
  };

  const handleDownloadSample = () => {
    const sample = `Nome,Email,Telefone,Empresa,Cargo,Categoria,Favorito,Endereco,Tags,Notas
Juliana Prado,juliana.prado@exemplo.com.br,+55 11 91234-5678,Inovação Corp,Gerente de Projetos,Trabalho,Sim,"Av. Brasil, 500 - SP","Projetos; Gestão",Contato prioritário para Q3
Rafael Siqueira,rafael.s@consultoria.com,+55 21 98765-4321,Siqueira Consultoria,Consultor Sênior,Cliente,Não,"Rua Ouvidor, 10 - RJ","Financeiro",Reunião agendada`;

    const blob = new Blob(['\uFEFF' + sample], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'modelo_importacao_contatos.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExecuteImport = async () => {
    if (parsedContacts.length === 0) return;
    setIsImporting(true);
    try {
      await onImport(parsedContacts);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Erro ao importar contatos.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <Upload className="w-5 h-5 text-emerald-600" />
            <div>
              <h2 className="text-base font-semibold text-slate-900">Importar Contatos (CSV)</h2>
              <p className="text-xs text-slate-500">Envie um arquivo CSV com os contatos para sua base de dados</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Sample download */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
            <div className="flex items-center gap-2 text-slate-700">
              <FileText className="w-4 h-4 text-slate-400" />
              <span>Precisa de um modelo para organizar os dados?</span>
            </div>
            <button
              onClick={handleDownloadSample}
              className="text-emerald-700 hover:text-emerald-800 font-medium flex items-center gap-1 hover:underline"
            >
              <Download className="w-3.5 h-3.5" /> Baixar Modelo CSV
            </button>
          </div>

          {/* File drop zone */}
          <label className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-emerald-50/20">
            <Upload className="w-8 h-8 text-slate-400 mb-2" />
            <span className="text-xs font-semibold text-slate-800">
              {fileName ? fileName : 'Clique para selecionar o arquivo .CSV'}
            </span>
            <span className="text-[11px] text-slate-500 mt-1">Compatível com Google Contatos, Outlook e Excel</span>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Preview list */}
          {parsedContacts.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  {parsedContacts.length} contatos prontos para importar
                </span>
              </div>
              <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 text-xs">
                {parsedContacts.slice(0, 10).map((c, idx) => (
                  <div key={idx} className="p-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-900 block">{c.name}</span>
                      <span className="text-slate-500 text-[11px]">{c.email || c.phone || 'Sem contato'}</span>
                    </div>
                    <span className="text-slate-500 text-[11px]">{c.company || c.category}</span>
                  </div>
                ))}
                {parsedContacts.length > 10 && (
                  <div className="p-2 text-center text-slate-500 text-[11px] bg-slate-50">
                    ... e mais {parsedContacts.length - 10} contatos
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={parsedContacts.length === 0 || isImporting}
            onClick={handleExecuteImport}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg transition-colors shadow-xs disabled:opacity-50 flex items-center gap-2"
          >
            {isImporting ? 'Importando...' : `Importar ${parsedContacts.length} Contatos`}
          </button>
        </div>
      </div>
    </div>
  );
};
