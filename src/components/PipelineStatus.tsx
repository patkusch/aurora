import React from 'react';
import { RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { PipelineStageState } from '../types';

interface PipelineStatusProps {
  state: PipelineStageState;
  onDismissError?: () => void;
}

export const PipelineStatus: React.FC<PipelineStatusProps> = ({
  state,
  onDismissError
}) => {
  if (state.stage === 'idle') return null;

  if (state.stage === 'error') {
    return (
      <div className="bg-[#1A1111] border-b border-red-900/60 px-4 py-2 text-xs font-mono text-red-300 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-2">
          <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
          <span>
            <strong className="text-red-400">ENGINE ERROR:</strong> {state.error_message || state.current_step_text} (Cached baseline preserved on screen)
          </span>
        </div>
        {onDismissError && (
          <button
            onClick={onDismissError}
            className="text-red-400 hover:text-white underline cursor-pointer text-[10px]"
          >
            DISMISS
          </button>
        )}
      </div>
    );
  }

  const isCompleted = state.stage === 'completed';

  return (
    <div className="bg-[#141414] border-b border-[#222] px-4 py-2 text-xs font-mono text-[#D1D1D1] flex items-center justify-between gap-4 shrink-0">
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        {isCompleted ? (
          <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        ) : (
          <RefreshCw className="w-3.5 h-3.5 text-[#F27D26] animate-spin shrink-0" />
        )}
        <span className="truncate text-gray-300 text-[11px]">
          {state.current_step_text}
        </span>
      </div>

      {!isCompleted && (
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-28 bg-[#222] h-1 overflow-hidden">
            <div
              className="bg-[#F27D26] h-full transition-all duration-300"
              style={{ width: `${state.progress_percent}%` }}
            />
          </div>
          <span className="text-[10px] text-gray-500 font-mono w-8 text-right">
            {state.progress_percent}%
          </span>
        </div>
      )}
    </div>
  );
};

