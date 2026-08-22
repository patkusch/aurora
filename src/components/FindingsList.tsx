import React from 'react';
import { 
  AlertOctagon, 
  Flame, 
  Link, 
  HelpCircle,
  ArrowRight
} from 'lucide-react';
import { Finding, FindingType, SeverityLevel } from '../types';

interface FindingsListProps {
  findings: Finding[];
  selectedFindingId: string;
  onSelectFinding: (id: string) => void;
}

export const FindingsList: React.FC<FindingsListProps> = ({
  findings,
  selectedFindingId,
  onSelectFinding
}) => {
  const getCardStyle = (sev: SeverityLevel) => {
    switch (sev) {
      case 'CRITICAL':
        return {
          cardBg: 'bg-[#1A1111] border-red-900/40 hover:border-red-700/60',
          idBadge: 'text-red-500 bg-red-950/60 border-red-800/60',
          sevText: 'text-red-400',
          label: 'Safety Critical',
          barColor: 'bg-red-600'
        };
      case 'HIGH':
        return {
          cardBg: 'bg-[#1A1711] border-amber-900/40 hover:border-amber-700/60',
          idBadge: 'text-amber-500 bg-amber-950/60 border-amber-800/60',
          sevText: 'text-amber-400',
          label: 'High Risk',
          barColor: 'bg-amber-500'
        };
      case 'MEDIUM':
        return {
          cardBg: 'bg-[#11161A] border-blue-900/40 hover:border-blue-700/60',
          idBadge: 'text-blue-400 bg-blue-950/60 border-blue-800/60',
          sevText: 'text-blue-400',
          label: 'Orphan Dep',
          barColor: 'bg-blue-500'
        };
      case 'LOW':
      default:
        return {
          cardBg: 'bg-[#111A15] border-green-900/40 hover:border-green-700/60',
          idBadge: 'text-green-500 bg-green-950/60 border-green-800/60',
          sevText: 'text-green-400',
          label: 'Governance Gap',
          barColor: 'bg-green-500'
        };
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0E0E0E] border-r border-[#222] overflow-hidden font-mono text-xs text-[#D1D1D1]">
      {/* Column Header */}
      <div className="p-3 border-b border-[#222] flex justify-between items-center bg-[#141414] shrink-0">
        <h2 className="text-[11px] uppercase font-bold text-gray-400 tracking-wider">
          Findings
        </h2>
        <span className="text-[9px] text-gray-500 tracking-tight">
          Ranked by Blast Radius
        </span>
      </div>

      {/* Findings Scroll List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {findings.length === 0 ? (
          <div className="p-8 text-center text-gray-500 space-y-2 font-mono">
            <HelpCircle className="w-8 h-8 mx-auto text-gray-600" />
            <p>No findings detected yet.</p>
            <p className="text-[10px] text-gray-600">Click "Run Analysis" to execute engine.</p>
          </div>
        ) : (
          findings.map((finding) => {
            const isSelected = finding.id === selectedFindingId;
            const style = getCardStyle(finding.severity);
            const blastScore = finding.blast_radius_score || 50;

            return (
              <div
                key={finding.id}
                id={`finding-card-${finding.id}`}
                onClick={() => onSelectFinding(finding.id)}
                className={`p-3 border transition-all cursor-pointer ${style.cardBg} ${
                  isSelected
                    ? 'ring-1 ring-[#F27D26] border-[#F27D26]/70 shadow-lg'
                    : 'opacity-90 hover:opacity-100'
                }`}
              >
                {/* Top Row: ID Badge & Severity Label */}
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 border ${style.idBadge}`}>
                    {finding.id}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] uppercase tracking-wider font-semibold ${style.sevText}`}>
                      {style.label}
                    </span>
                    <span className="text-[9px] text-gray-500 font-mono">
                      Radius: {blastScore}
                    </span>
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-[12px] font-bold text-white leading-tight mb-2">
                  {finding.title}
                </h3>

                {/* Blast Radius Progress Bar */}
                <div className="h-1 w-full bg-gray-800 my-2 overflow-hidden">
                  <div 
                    className={`h-full ${style.barColor} transition-all duration-500`}
                    style={{ width: `${Math.min(100, Math.max(10, blastScore))}%` }}
                  />
                </div>

                {/* Incompatibility preview */}
                <p className="text-[10px] text-gray-400 line-clamp-2 leading-relaxed font-sans mb-2">
                  {finding.why_incompatible}
                </p>

                {/* Footer Citations Link */}
                <div className="flex items-center justify-between text-[9px] text-gray-500 pt-1.5 border-t border-white/5">
                  <div className="flex items-center gap-1">
                    <Link className="w-2.5 h-2.5 text-gray-400" />
                    <span>{finding.citations?.length || 0} cited sources</span>
                  </div>
                  <div className="flex items-center gap-1 text-[#F27D26] font-medium">
                    <span>Evidence</span>
                    <ArrowRight className="w-2.5 h-2.5" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

