import React from 'react';
import { 
  ShieldAlert, 
  Cpu, 
  Download, 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  Server, 
  RefreshCw,
  Layers
} from 'lucide-react';
import { AnalysisResults } from '../types';

interface HeaderProps {
  modelId: string;
  results: AnalysisResults;
  isRunning: boolean;
  useLocalGemma: boolean;
  setUseLocalGemma: (val: boolean) => void;
  onRunAnalysis: () => void;
  onDownloadResults: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  modelId,
  results,
  isRunning,
  useLocalGemma,
  setUseLocalGemma,
  onRunAnalysis,
  onDownloadResults
}) => {
  const verifiedCitations = results.citations_verified || 0;
  const rejectedCitations = results.citations_rejected || 0;

  return (
    <header className="h-12 border-b border-[#222] bg-[#111] flex items-center justify-between px-4 select-none font-mono text-xs text-[#D1D1D1] shrink-0">
      {/* Title & Brand */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="text-white font-bold tracking-tighter text-base">
            AURORA<span className="text-[#F27D26]">—</span>
          </span>
          <span className="text-[10px] uppercase bg-[#1c1c1c] px-2 py-0.5 rounded border border-[#333] text-gray-400 font-mono tracking-tight">
            ENGINE: {modelId.toUpperCase()}
          </span>
        </div>
        <span className="hidden lg:inline text-[10px] text-gray-500 tracking-tight border-l border-[#222] pl-3">
          Cross-Document Requirements Conflict Engine
        </span>
      </div>

      {/* Middle Status Indicators (Sleek Telemetry) */}
      <div className="hidden md:flex items-center gap-4 text-[10px] uppercase tracking-wider text-gray-500 font-mono">
        <div className="flex items-center gap-1">
          <span>Citations:</span>
          <span className="text-emerald-400 font-bold">{verifiedCitations} Verified</span>
          <span className="text-gray-600">/</span>
          <span className={rejectedCitations > 0 ? 'text-rose-400 font-bold' : 'text-gray-600'}>
            {rejectedCitations} Rejected
          </span>
        </div>

        <div className="flex items-center gap-1 border-l border-[#222] pl-3">
          <span>Pass 1:</span>
          <span className={results.engine === 'GEMMA_LOCAL' ? 'text-cyan-400 font-bold' : 'text-blue-400 font-bold'}>
            {results.engine === 'GEMMA_LOCAL' ? 'Local Gemma' : 'Hybrid Gemini'}
          </span>
        </div>

        <div className="flex items-center gap-1 border-l border-[#222] pl-3">
          <span>Extracted:</span>
          <span className="text-white font-bold">{results.requirements.length} Reqs</span>
        </div>
      </div>

      {/* Action Controls & Toggle */}
      <div className="flex items-center gap-2.5">
        {/* Local Extraction Toggle */}
        <label 
          className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#181818] border border-[#2a2a2a] hover:border-[#3a3a3a] text-[10px] font-mono text-gray-400 cursor-pointer transition-colors"
          title="Toggle local on-device Pass 1 extraction via Ollama (Gemma)"
        >
          <input 
            type="checkbox"
            checked={useLocalGemma}
            onChange={(e) => setUseLocalGemma(e.target.checked)}
            className="w-3 h-3 rounded border-[#333] bg-[#0A0A0A] text-[#F27D26] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#F27D26]"
          />
          <span>Local Gemma</span>
        </label>

        {/* Download Results */}
        <button
          id="btn-download-results"
          onClick={onDownloadResults}
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#181818] border border-[#2a2a2a] hover:bg-[#222] hover:border-[#383838] text-gray-300 text-[10px] font-mono font-medium transition-colors cursor-pointer"
          title="Download requirements.json, findings.json, and agenda.json"
        >
          <Download className="w-3 h-3 text-gray-400" />
          <span>Export</span>
        </button>

        {/* Run Analysis Button */}
        <button
          id="btn-run-analysis"
          onClick={onRunAnalysis}
          disabled={isRunning}
          className={`flex items-center gap-1.5 px-3.5 py-1 rounded font-mono text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
            isRunning 
              ? 'bg-[#F27D26]/60 cursor-not-allowed text-black' 
              : 'bg-[#F27D26] text-black hover:bg-[#ff8c3a] active:scale-[0.98]'
          }`}
        >
          {isRunning ? (
            <>
              <RefreshCw className="w-3 h-3 animate-spin text-black" />
              <span>Analyzing</span>
            </>
          ) : (
            <>
              <Play className="w-3 h-3 fill-current text-black" />
              <span>Run Analysis</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};

