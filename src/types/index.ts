export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type FindingType = 'CONTRADICTION' | 'VERBAL_OVERRIDE' | 'ORPHAN_DEPENDENCY' | 'GOVERNANCE_GAP';

export interface Citation {
  file: string;
  line: number;
  verbatim_excerpt: string;
  verified?: boolean;
}

export interface Requirement {
  id: string;
  text: string;
  source_file: string;
  source_line: number;
  author: string;
  date: string;
  status: 'APPROVED' | 'DRAFT' | 'VERBAL_PROPOSAL' | 'UNRECORDED';
  workstream: string;
  /** Set by programmatic verification: does source_file:source_line actually exist? */
  provenance_verified?: boolean;
}

export interface Finding {
  id: string;
  type: FindingType;
  severity: SeverityLevel;
  title: string;
  citations: Citation[];
  why_incompatible: string;
  consequence: string;
  blast_radius_score: number;
}

export interface AgendaItem {
  finding_id: string;
  question_to_be_asked: string;
  required_attendees: string[];
  evidence_pack: string[];
  time_box_minutes: number;
  downstream_milestone_impact: string;
}

export interface AnalysisResults {
  model_id: string;
  timestamp: string;
  engine: 'GEMINI_CLOUD' | 'GEMMA_LOCAL' | 'GEMMA_FALLBACK';
  execution_time_ms: number;
  citations_verified: number;
  citations_rejected: number;
  requirements_verified: number;
  requirements_unverified: number;
  warnings: string[];
  requirements: Requirement[];
  findings: Finding[];
  agenda: AgendaItem[];
}

export interface CorpusFile {
  filename: string;
  title: string;
  workstream: string;
  date: string;
  type: 'markdown' | 'csv' | 'chat';
  content: string;
}

export interface PipelineStageState {
  stage: 'idle' | 'pass1_extract' | 'pass2_detect' | 'pass3_agenda' | 'verifying' | 'completed' | 'error';
  current_step_text: string;
  progress_percent: number;
  error_message?: string;
}
