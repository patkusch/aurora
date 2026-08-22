import React, { useState, useEffect, useRef } from 'react';
import { FileText, FileSpreadsheet, MessageSquare, Hash, FileCode, Search } from 'lucide-react';
import { CORPUS_FILES } from '../data/corpus';
import { CorpusFile } from '../types';

interface CorpusViewerProps {
  selectedFileKey: string;
  onSelectFileKey: (key: string) => void;
  highlightedLine?: { file: string; line: number } | null;
}

export const CorpusViewer: React.FC<CorpusViewerProps> = ({
  selectedFileKey,
  onSelectFileKey,
  highlightedLine
}) => {
  const [filterQuery, setFilterQuery] = useState('');
  const activeFile: CorpusFile = CORPUS_FILES[selectedFileKey] || Object.values(CORPUS_FILES)[0];
  const fileLines = activeFile.content.split('\n');
  const highlightedLineRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (highlightedLine && highlightedLine.file === selectedFileKey && highlightedLineRef.current) {
      highlightedLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [highlightedLine, selectedFileKey]);

  const getFileIcon = (type: CorpusFile['type']) => {
    switch (type) {
      case 'markdown':
        return <FileText className="w-3.5 h-3.5 text-sky-400 shrink-0" />;
      case 'csv':
        return <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
      case 'chat':
        return <MessageSquare className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
      default:
        return <FileCode className="w-3.5 h-3.5 text-neutral-400 shrink-0" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0C0C0C] border-r border-[#222] overflow-hidden font-mono text-xs text-[#D1D1D1]">
      {/* Column Header */}
      <div className="p-3 border-b border-[#222] flex justify-between items-center bg-[#141414] shrink-0">
        <h2 className="text-[11px] uppercase font-bold text-gray-400 tracking-wider">
          Corpus
        </h2>
        <span className="text-[9px] bg-gray-800 text-gray-300 px-1.5 py-0.5 rounded-none font-mono">
          {Object.keys(CORPUS_FILES).length} Files
        </span>
      </div>

      {/* File List Navigation */}
      <div className="p-2 space-y-1 border-b border-[#222] bg-[#0E0E0E] shrink-0 text-[11px]">
        {Object.entries(CORPUS_FILES).map(([key, file]) => {
          const isSelected = selectedFileKey === key;
          const lineCount = file.content.split('\n').length;
          const hasHighlightedCitation = highlightedLine?.file === key;

          return (
            <div
              key={key}
              id={`file-btn-${key}`}
              onClick={() => onSelectFileKey(key)}
              className={`p-2 transition-all flex items-start gap-2.5 cursor-pointer ${
                isSelected
                  ? 'bg-[#1A1A1A] border-l-2 border-[#F27D26] text-white shadow-sm'
                  : 'hover:bg-[#151515] text-gray-500 hover:text-gray-300 border-l-2 border-transparent'
              } ${hasHighlightedCitation && !isSelected ? 'ring-1 ring-[#F27D26]/40' : ''}`}
            >
              <div className="mt-0.5 shrink-0">{getFileIcon(file.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <div className={`truncate font-mono text-[11px] ${isSelected ? 'text-white font-medium' : 'text-gray-400'}`}>
                    {file.filename}
                  </div>
                  <span className="shrink-0 text-[9px] text-gray-500 font-mono">
                    {lineCount}L
                  </span>
                </div>
                <div className="text-[9px] text-gray-500 mt-0.5 truncate">
                  {lineCount} Lines • {file.workstream} • {file.date}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active File Header & Search */}
      <div className="px-3 py-1.5 border-b border-[#222] bg-[#111] flex items-center justify-between gap-2 shrink-0">
        <div className="truncate text-gray-300 font-medium text-[10px] tracking-tight">
          SOURCE: {activeFile.filename}
        </div>
        <div className="relative w-36">
          <input
            type="text"
            placeholder="Search lines..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-full bg-[#0A0A0A] border border-[#2a2a2a] rounded-none px-2 py-0.5 text-[10px] text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#F27D26]"
          />
          {filterQuery && (
            <button
              onClick={() => setFilterQuery('')}
              className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-[10px]"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Line-Numbered File Viewer */}
      <div className="flex-1 overflow-y-auto overflow-x-auto p-2 bg-[#0A0A0A] text-gray-300 selection:bg-[#F27D26]/30 selection:text-white">
        <div className="min-w-full inline-block">
          {fileLines.map((line, idx) => {
            const lineNo = idx + 1;
            const isTargetLine = highlightedLine?.file === selectedFileKey && highlightedLine?.line === lineNo;
            const matchesFilter = filterQuery ? line.toLowerCase().includes(filterQuery.toLowerCase()) : true;

            if (filterQuery && !matchesFilter) return null;

            return (
              <div
                key={lineNo}
                ref={isTargetLine ? highlightedLineRef : null}
                id={`corpus-${selectedFileKey}-L${lineNo}`}
                className={`flex items-start gap-2 py-0.5 px-1.5 rounded-none text-[11px] font-mono leading-relaxed transition-colors ${
                  isTargetLine
                    ? 'bg-[#22160e] text-[#ffd6b0] border-l-2 border-[#F27D26] font-semibold'
                    : matchesFilter && filterQuery
                    ? 'bg-[#262010] text-amber-200'
                    : 'hover:bg-[#141414]'
                }`}
              >
                {/* Line Number Gutter */}
                <span className="w-8 shrink-0 text-right text-gray-600 select-none font-mono text-[10px] pr-1">
                  {lineNo}
                </span>

                {/* Line Text */}
                <span className="whitespace-pre-wrap break-all flex-1">
                  {line || <span className="opacity-0">.</span>}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

