import React, { useState } from 'react';
import { Header } from './components/Header';
import { CorpusViewer } from './components/CorpusViewer';
import { FindingsList } from './components/FindingsList';
import { EvidencePanel } from './components/EvidencePanel';
import { PipelineStatus } from './components/PipelineStatus';
import { CORPUS_FILES, SAMPLE_RESULTS } from './data/corpus';
import { AnalysisResults, PipelineStageState } from './types';
import { runAnalysisPipeline, exportResultsAsFiles } from './services/pipeline';

export default function App() {
  const [results, setResults] = useState<AnalysisResults>(SAMPLE_RESULTS);
  const [selectedFindingId, setSelectedFindingId] = useState<string>(SAMPLE_RESULTS.findings[0]?.id || 'F-01');
  const [selectedFileKey, setSelectedFileKey] = useState<string>('FLLD-DM-04_Allergy_Data_Migration.md');
  const [highlightedLine, setHighlightedLine] = useState<{ file: string; line: number } | null>(null);
  
  const [useLocalGemma, setUseLocalGemma] = useState<boolean>(false);
  const [pipelineState, setPipelineState] = useState<PipelineStageState>({
    stage: 'idle',
    current_step_text: '',
    progress_percent: 0
  });

  const isRunning = ['pass1_extract', 'pass2_detect', 'pass3_agenda', 'verifying'].includes(pipelineState.stage);

  // Selected finding & matching agenda item
  const selectedFinding = results.findings.find(f => f.id === selectedFindingId) || results.findings[0];
  const selectedAgendaItem = results.agenda.find(a => a.finding_id === selectedFinding?.id);

  // Handler: Run Pipeline
  const handleRunAnalysis = async () => {
    try {
      const newResults = await runAnalysisPipeline({
        useLocalGemma,
        onProgress: (state) => setPipelineState(state)
      });
      setResults(newResults);
      if (newResults.findings.length > 0) {
        setSelectedFindingId(newResults.findings[0].id);
      }
    } catch (err: any) {
      console.error('Failed to complete real-time analysis:', err);
      // Notice pipelineState is set to 'error' inside runAnalysisPipeline, so error banner will appear
    }
  };

  // Handler: Jump to citation in Left Corpus View
  const handleJumpToCitation = (file: string, line: number) => {
    setSelectedFileKey(file);
    setHighlightedLine({ file, line });
  };

  // Handler: Export
  const handleDownload = () => {
    exportResultsAsFiles(results);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0A0A0A] text-[#D1D1D1] font-mono overflow-hidden select-text">
      {/* App Header */}
      <Header
        modelId="gemini-3.7-flash"
        results={results}
        isRunning={isRunning}
        useLocalGemma={useLocalGemma}
        setUseLocalGemma={setUseLocalGemma}
        onRunAnalysis={handleRunAnalysis}
        onDownloadResults={handleDownload}
      />

      {/* Live Pipeline Status / Error Banner */}
      <PipelineStatus
        state={pipelineState}
        onDismissError={() => setPipelineState({ stage: 'idle', current_step_text: '', progress_percent: 0 })}
      />

      {/* Warnings Banner */}
      {results.warnings && results.warnings.length > 0 && (
        <div className="bg-[#1A1711] border-b border-amber-900/60 px-4 py-1.5 text-xs font-mono text-amber-300 flex items-center gap-2 shrink-0">
          <span className="font-bold uppercase tracking-wider text-[9px] bg-amber-950 px-1.5 py-0.5 border border-amber-800/60 text-amber-300">
            Engine Notice
          </span>
          <span className="text-[11px] text-gray-300">{results.warnings.join(' | ')}</span>
        </div>
      )}

      {/* 3-Column Core Workspace */}
      <main className="flex-1 grid grid-cols-12 min-h-0 divide-x divide-[#222] bg-[#0A0A0A]">
        {/* Left Column: Corpus Viewer (4 / 12) */}
        <section className="col-span-12 md:col-span-4 lg:col-span-4 h-full min-h-0">
          <CorpusViewer
            selectedFileKey={selectedFileKey}
            onSelectFileKey={(key) => {
              setSelectedFileKey(key);
              setHighlightedLine(null);
            }}
            highlightedLine={highlightedLine}
          />
        </section>

        {/* Middle Column: Findings Ranked by Blast Radius (3 / 12) */}
        <section className="col-span-12 md:col-span-3 lg:col-span-3 h-full min-h-0">
          <FindingsList
            findings={results.findings}
            selectedFindingId={selectedFinding?.id || ''}
            onSelectFinding={(id) => {
              setSelectedFindingId(id);
              setHighlightedLine(null);
            }}
          />
        </section>

        {/* Right Column: Evidence Trail & Stakeholder Agenda (5 / 12) */}
        <section className="col-span-12 md:col-span-5 lg:col-span-5 h-full min-h-0">
          <EvidencePanel
            finding={selectedFinding}
            agendaItem={selectedAgendaItem}
            onJumpToCitation={handleJumpToCitation}
          />
        </section>
      </main>
    </div>
  );
}
