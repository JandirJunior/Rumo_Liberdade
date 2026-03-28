'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Upload, X, FileText, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: Record<string, string>[]) => Promise<void>;
  title: string;
  template?: string[];
  description?: string;
  separator?: string;
  instructions?: React.ReactNode;
}

export function ImportModal({ 
  isOpen, 
  onClose, 
  onImport, 
  title, 
  template = [], 
  description,
  separator = ',', 
  instructions 
}: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        setError('Por favor, selecione um arquivo CSV.');
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const processCSV = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);

    try {
      let text = await file.text();
      // Remove BOM if present
      if (text.charCodeAt(0) === 0xFEFF) {
        text = text.slice(1);
      }

      const lines = text.split('\n').filter(line => line.trim() !== '');
      if (lines.length === 0) throw new Error('O arquivo está vazio.');

      const firstLine = lines[0];
      // Auto-detect separator if it's not the one provided
      const actualSeparator = firstLine.includes(';') ? ';' : (firstLine.includes(',') ? ',' : separator);
      const headers = firstLine.split(actualSeparator).map(h => h.trim().toLowerCase());

      // Validate headers
      const missingHeaders = template.filter(h => !headers.includes(h.toLowerCase()));
      if (missingHeaders.length > 0) {
        throw new Error(`Cabeçalhos ausentes: ${missingHeaders.join(', ')}`);
      }

      const data = lines.slice(1).map(line => {
        const values = line.split(actualSeparator).map(v => v.trim());
        const obj: Record<string, string> = {};
        headers.forEach((header, i) => {
          obj[header] = values[i] || '';
        });
        return obj;
      });

      await onImport(data);
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setFile(null);
      }, 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao processar o arquivo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-6">
        <div className="bg-red-500/10 dark:bg-red-900/20 border border-red-500/30 dark:border-red-900/50 rounded-2xl p-4 flex gap-3 medieval-border">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div className="text-xs text-red-900 dark:text-red-100 space-y-2 flex-1 min-w-0">
            {instructions || (
              <>
                <p className="font-bold text-red-700 dark:text-red-400 text-sm">Instruções de Importação:</p>
                {description && <p className="leading-relaxed font-medium">{description}</p>}
                {!description && <p className="leading-relaxed opacity-90">O arquivo deve ser um CSV com os seguintes cabeçalhos:</p>}
                {template.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold opacity-70 uppercase tracking-wider">Cabeçalhos esperados:</p>
                    <code className="bg-white/50 dark:bg-black/30 px-2 py-1.5 rounded block text-[11px] break-words border border-red-500/20 dark:border-red-900/30 font-mono text-red-800 dark:text-red-300">
                      {template.join('; ')}
                    </code>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {!success ? (
          <div className="space-y-4">
            <div 
              className={cn(
                "border-2 border-dashed rounded-[2rem] p-8 text-center transition-all cursor-pointer medieval-border",
                file ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10" : "border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-bg-dark)]"
              )}
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <input 
                id="file-upload"
                type="file" 
                accept=".csv"
                className="hidden" 
                onChange={handleFileChange}
              />
              {file ? (
                <div className="space-y-2">
                  <FileText className="w-12 h-12 text-[var(--color-primary)] mx-auto" />
                  <p className="text-sm font-bold text-[var(--color-text-main)]">{file.name}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="w-12 h-12 text-[var(--color-text-muted)] mx-auto" />
                  <p className="text-sm font-bold text-[var(--color-text-main)]">Clique para selecionar ou arraste o arquivo</p>
                  <p className="text-xs text-[var(--color-text-muted)]">Apenas arquivos .csv são suportados</p>
                </div>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 bg-red-900/20 border border-red-900/50 p-3 rounded-xl text-xs font-bold medieval-border">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <button
              onClick={processCSV}
              disabled={!file || loading}
              className={cn(
                "w-full py-4 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 medieval-glow",
                !file || loading 
                  ? "bg-[var(--color-border)] text-[var(--color-text-muted)] cursor-not-allowed" 
                  : "bg-[var(--color-primary)] text-[var(--color-bg-dark)] hover:brightness-110 active:scale-95"
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processando...
                </>
              ) : (
                'Iniciar Importação'
              )}
            </button>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12 space-y-4"
          >
            <div className="w-20 h-20 bg-[var(--color-primary)]/20 text-[var(--color-primary)] rounded-full flex items-center justify-center mx-auto border border-[var(--color-primary)]/50 medieval-glow">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <h3 className="text-xl font-bold text-[var(--color-text-main)] medieval-title">Importação Concluída!</h3>
            <p className="text-sm text-[var(--color-text-muted)]">Seus dados foram forjados com sucesso no reino.</p>
          </motion.div>
        )}
      </div>
    </Modal>
  );
}
