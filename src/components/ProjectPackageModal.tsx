import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Download,
  FolderArchive,
  FileCode,
  Smartphone,
  Database,
  Terminal,
  Settings
} from 'lucide-react';
import { ALL_PROJECT_FILES, ProjectFileEntry } from '../data/allProjectFiles';
import { downloadFullProjectZip } from '../utils/zipDownloader';

interface ProjectPackageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectPackageModal: React.FC<ProjectPackageModalProps> = ({ isOpen, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [selectedFile, setSelectedFile] = useState<ProjectFileEntry>(ALL_PROJECT_FILES[0]);
  const [copied, setCopied] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  if (!isOpen) return null;

  const categories = ['Todos', 'Base de Datos (SQL)', 'Android Kotlin', 'Configuración Gradle'];

  const filteredFiles = selectedCategory === 'Todos'
    ? ALL_PROJECT_FILES
    : ALL_PROJECT_FILES.filter(f => f.category === selectedCategory);

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSingle = () => {
    const blob = new Blob([selectedFile.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAllZip = async () => {
    setIsDownloading(true);
    try {
      await downloadFullProjectZip();
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl h-[94vh] flex flex-col bg-[#070a12] border border-emerald-500/40 rounded-2xl shadow-[0_0_60px_rgba(16,185,129,0.25)] overflow-hidden">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-[#0c101c]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <FolderArchive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                Paquete Completo del Proyecto RACHA
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700">
                  ZIP + Scripts SQL
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                13 archivos: Android Jetpack Compose, Room Database, SQLite y Python CLI
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/racha-proyecto-completo.zip"
              download="racha-proyecto-completo.zip"
              onClick={handleDownloadAllZip}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] cursor-pointer"
            >
              {isDownloading ? (
                <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download className="w-4 h-4 text-black stroke-[3]" />
              )}
              <span>Descargar ZIP Completo</span>
            </a>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Category Filters Bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#090d18] border-b border-slate-800 overflow-x-auto gap-2">
          <div className="flex items-center gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/80 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
            {filteredFiles.length} archivos disponibles
          </span>
        </div>

        {/* Main Body (File Tree on left, Code Viewer on right) */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          
          {/* File Selector Sidebar */}
          <div className="w-full md:w-72 bg-[#090c16] border-b md:border-b-0 md:border-r border-slate-800 p-2 overflow-y-auto shrink-0 flex flex-col gap-1 max-h-48 md:max-h-none">
            {filteredFiles.map((file) => {
              const isSelected = selectedFile.path === file.path;
              return (
                <button
                  key={file.path}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-mono flex items-center justify-between gap-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {file.category === 'Base de Datos (SQL)' ? (
                      <Database className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : file.category === 'Android Kotlin' ? (
                      <Smartphone className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    ) : (
                      <Settings className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                    )}
                    <span className="truncate">{file.name}</span>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800/60 text-slate-400 shrink-0">
                    {file.name.split('.').pop()}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Code Viewer Panel */}
          <div className="flex-1 flex flex-col min-w-0 bg-[#05070e]">
            {/* File Path & Action Buttons */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-[#0b0f1c] border-b border-slate-800">
              <div className="flex items-center gap-2 truncate text-xs font-mono text-slate-300">
                <Terminal className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate font-semibold">{selectedFile.path}</span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700 cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleDownloadSingle}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700 cursor-pointer"
                  title="Descargar este archivo individualmente"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="hidden sm:inline">Descargar</span>
                </button>
              </div>
            </div>

            {/* Code Pre Area */}
            <div className="flex-1 overflow-auto p-4 font-mono text-xs text-slate-200 leading-relaxed selection:bg-emerald-600 selection:text-white">
              <pre className="whitespace-pre">
                <code>{selectedFile.content}</code>
              </pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-[#0a0e1a] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              Incluye base de datos SQLite/Room, triggers automáticos y código completo de Jetpack Compose.
            </span>
          </div>

          <a
            href="/racha-proyecto-completo.zip"
            download="racha-proyecto-completo.zip"
            className="text-emerald-400 hover:text-emerald-300 font-bold underline font-mono text-xs cursor-pointer"
          >
            Descargar archivo directo: racha-proyecto-completo.zip
          </a>
        </div>
      </div>
    </div>
  );
};
