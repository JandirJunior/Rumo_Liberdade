'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Upload, X, FileText, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: any[]) => Promise<void>;
  title: string;
  template: string[];
}

export function ImportModal({ isOpen, onClose, onImport, title, template }: ImportModalProps) {
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
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim() !== '');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

      // Validate headers
      const missingHeaders = template.filter(h => !headers.includes(h.toLowerCase()));
      if (missingHeaders.length > 0) {
        throw new Error(`Cabeçalhos ausentes: ${missingHeaders.join(', ')}`);
      }

      const data = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const obj: any = {};
        headers.forEach((header, i) => {
          obj[header] = values[i];
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
    } catch (err: any) {
      setError(err.message || 'Erro ao processar o arquivo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-6">
        <div className="bg-amber-900/20 border border-amber-900/50 rounded-2xl p-4 flex gap-3 medieval-border">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
          <div className="text-xs text-amber-200/80 space-y-1">
            <p className="font-bold text-amber-400">Instruções de Importação:</p>
            <p>O arquivo deve ser um CSV com os seguintes cabeçalhos:</p>
            <code className="bg-[var(--color-bg-dark)] px-1 rounded block mb-2 border border-[var(--color-border)]">{template.join(', ')}</code>
            <p className="font-bold mt-2 text-amber-400">Exemplo de preenchimento:</p>
            <code className="bg-[var(--color-bg-dark)] px-1 rounded block border border-[var(--color-border)]">expense, 150.50, Compra no mercado, alimentacao, 2023-10-25</code>
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
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <button
              onClick={processCSV}
              disabled={!file || loading}
              className={cn(
                "w-full py-4 rounded-xl font-bold text-[var(--color-bg-dark)] shadow-lg transition-all flex items-center justify-center gap-2 medieval-glow",
                !file || loading ? "bg-[var(--color-border)] text-[var(--color-text-muted)] cursor-not-allowed" : "bg-[var(--color-primary)] hover:brightness-110 active:scale-95"
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
