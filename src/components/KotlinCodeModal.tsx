import React, { useState } from 'react';
import { X, Copy, Check, Download, Terminal, Smartphone, Code2 } from 'lucide-react';
import { KOTLIN_PROJECT_FILES } from '../data/kotlinCode';

interface KotlinCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KotlinCodeModal: React.FC<KotlinCodeModalProps> = ({ isOpen, onClose }) => {
  const [selectedFileIndex, setSelectedFileIndex] = useState(1); // Default to RachaScreen.kt
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentFile = KOTLIN_PROJECT_FILES[selectedFileIndex];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([currentFile.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = currentFile.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-[#090d16] border border-cyan-500/30 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.2)] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-[#0c1220]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                Código Nativo Android · Kotlin + Jetpack Compose
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                  Compose M3
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Archivos listos para compilar en Android Studio
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* File Tabs */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#080c14] border-b border-slate-800/80 overflow-x-auto gap-2">
          <div className="flex items-center gap-1.5">
            {KOTLIN_PROJECT_FILES.map((file, idx) => (
              <button
                key={file.filename}
                onClick={() => setSelectedFileIndex(idx)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                  selectedFileIndex === idx
                    ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-700/60 shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                {file.filename}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Copiar</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors shadow-sm"
              title="Descargar este archivo"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Descargar</span>
            </button>
          </div>
        </div>

        {/* File Path & Description */}
        <div className="px-5 py-2.5 bg-[#0a0f1b] border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-2 truncate">
            <Terminal className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="text-slate-300 truncate">{currentFile.path}</span>
          </div>
          <span className="text-slate-500 hidden md:inline text-[11px]">
            {currentFile.description}
          </span>
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-auto p-4 bg-[#05070c] font-mono text-xs text-slate-200 leading-relaxed selection:bg-cyan-600 selection:text-white">
          <pre className="overflow-x-auto whitespace-pre">
            <code>{currentFile.code}</code>
          </pre>
        </div>

        {/* Footer info */}
        <div className="px-5 py-3 border-t border-slate-800 bg-[#0c1220] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Código 100% nativo para Android Studio con Jetpack Compose y Material 3</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            Cerrar visor
          </button>
        </div>
      </div>
    </div>
  );
};
