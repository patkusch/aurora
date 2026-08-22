import React from 'react';
import { 
  FileCheck2, 
  ExternalLink, 
  CheckCircle2, 
  XCircle,
  FolderOpen
} from 'lucide-react';
import { Finding, AgendaItem } from '../types';

interface EvidencePanelProps {
  finding?: Finding;
  agendaItem?: AgendaItem;
  onJumpToCitation: (file: string, line: number) => void;
}

export const EvidencePanel: React.FC<EvidencePanelProps> = ({
  finding,
  agendaItem,
  onJumpToCitation
}) => {
  if (!finding) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-gray-600 font-mono text-xs bg-[#0A0A0A] text-center">
        <FolderOpen className="w-10 h-10 mb-3 text-gray-700 stroke-1" />
        <p className="text-gray-400 font-medium">Select a finding from the middle column</p>
        <p className="text-[10px] text-gray-600 mt-1">Review line-level citations, incompatibility rationale, and walkthrough agenda</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0A0A0A] overflow-hidden font-mono text-xs text-[#D1D1D1]">
      {/* Panel Header */}
      <div className="p-3 border-b border-[#222] bg-[#141414] flex items-center justify-between shrink-0">
        <h2 className="text-[11px] uppercase font-bold text-gray-400 tracking-wider">
          Evidence Pack: {finding.id}
        </h2>
        <div className="flex items-center gap-2">
          <span className={`px-1.5 py-0.5 text-[9px] font-bold uppercase ${
            finding.severity === 'CRITICAL' ? 'bg-red-950/70 text-red-400 border border-red-800/60' :
            finding.severity === 'HIGH' ? 'bg-amber-950/70 text-amber-400 border border-amber-800/60' :
            finding.severity === 'MEDIUM' ? 'bg-blue-950/70 text-blue-400 border border-blue-800/60' :
            'bg-green-950/70 text-green-400 border border-green-800/60'
          }`}>
            {finding.severity}
          </span>
          <span className="text-[9px] text-gray-500 font-mono">
            {finding.type}
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col">
        {/* Title */}
        <div className="pb-2 border-b border-[#222]">
          <h2 className="text-[13px] font-bold text-white leading-snug">
            {finding.title}
          </h2>
        </div>

        {/* Citations Section */}
        <div className="space-y-3">
          <div className="text-[9px] uppercase tracking-wider text-gray-500 font-bold">
            Verified Source Citations ({finding.citations?.length || 0})
          </div>

          <div className="space-y-2.5">
            {finding.citations?.map((cit, idx) => {
              const accentColor = idx % 2 === 0 ? 'bg-[#F27D26]' : 'bg-red-600';
              const textAccent = idx % 2 === 0 ? 'text-[#F27D26]' : 'text-red-500';

              return (
                <div
                  key={idx}
                  id={`citation-chip-${finding.id}-${idx}`}
                  onClick={() => onJumpToCitation(cit.file, cit.line)}
                  className="flex gap-3 group cursor-pointer"
                >
                  <div className={`w-1 shrink-0 ${accentColor}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className={`text-[9px] ${textAccent} uppercase font-bold tracking-tight flex items-center gap-1.5`}>
                        <span>CITATION 0{idx + 1} — {cit.file}:L{cit.line}</span>
                        <ExternalLink className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100" />
                      </div>

                      {cit.verified !== false ? (
                        <span className="text-[8px] text-emerald-400 bg-emerald-950/40 px-1 py-0.2 border border-emerald-800/40 flex items-center gap-0.5">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          VERIFIED
                        </span>
                      ) : (
                        <span className="text-[8px] text-rose-400 bg-rose-950/40 px-1 py-0.2 border border-rose-800/40 flex items-center gap-0.5">
                          <XCircle className="w-2.5 h-2.5" />
                          UNVERIFIED
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-white italic p-2 bg-[#1A1A1A] border border-[#262626] font-sans leading-relaxed group-hover:border-[#383838] transition-colors">
                      "{cit.verbatim_excerpt}"
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Incompatibility & Consequence 2-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-[#222]">
          <div>
            <div className="text-[9px] text-gray-500 uppercase font-bold mb-1">
              Incompatibility
            </div>
            <p className="text-[11px] leading-relaxed text-[#D1D1D1] font-sans">
              {finding.why_incompatible}
            </p>
          </div>
          <div>
            <div className="text-[9px] text-gray-500 uppercase font-bold mb-1">
              Consequence
            </div>
            <p className="text-[11px] leading-relaxed text-[#D1D1D1] font-sans">
              {finding.consequence}
            </p>
          </div>
        </div>

        {/* Sleek Black Agenda Item Box at bottom */}
        {agendaItem && (
          <div className="mt-auto bg-black border border-[#F27D26]/30 p-4 shadow-xl">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] bg-[#F27D26] text-black px-2 py-0.5 font-bold uppercase tracking-wider">
                Walkthrough Agenda Item
              </span>
              <span className="text-[10px] text-gray-500 uppercase font-mono">
                Est: {agendaItem.time_box_minutes} Mins
              </span>
            </div>

            {/* Question */}
            <div className="text-[13px] text-white font-bold mb-3 font-sans leading-snug">
              "{agendaItem.question_to_be_asked}"
            </div>

            {/* Required Attendees and Blocked Milestone */}
            <div className="flex flex-col sm:flex-row gap-4 text-[10px] text-gray-400 border-t border-[#222] pt-3">
              <div className="flex-1">
                <div className="uppercase text-[8px] text-[#F27D26] font-bold tracking-wider">
                  Required Attendees
                </div>
                <div className="mt-1 text-gray-300 font-sans">
                  {agendaItem.required_attendees?.join(', ') || 'Lead Architects, Clinical Safety Rep'}
                </div>
              </div>
              <div className="flex-1">
                <div className="uppercase text-[8px] text-[#F27D26] font-bold tracking-wider">
                  Blocked Milestone
                </div>
                <div className="mt-1 text-gray-300 font-sans">
                  {agendaItem.downstream_milestone_impact}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

