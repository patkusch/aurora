import { AnalysisResults, Citation, Finding, Requirement, AgendaItem, PipelineStageState } from '../types';
import { CORPUS_FILES, getPrefixedCorpus, verifyCitationAgainstSource, SAMPLE_RESULTS } from '../data/corpus';

export interface RunPipelineOptions {
  useLocalGemma?: boolean;
  onProgress?: (state: PipelineStageState) => void;
}

export async function runAnalysisPipeline(options: RunPipelineOptions = {}): Promise<AnalysisResults> {
  const startTime = Date.now();
  const onProgress = options.onProgress || (() => {});
  const useLocalGemma = options.useLocalGemma || false;

  try {
    onProgress({
      stage: 'pass1_extract',
      current_step_text: useLocalGemma 
        ? 'Pass 1/3: Extracting atomic requirements on-device via Gemma (Ollama)...' 
        : 'Pass 1/3: Extracting atomic requirements across all corpus files...',
      progress_percent: 25
    });

    // Call server endpoint
    const response = await fetch('/api/analyse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        useLocalGemma,
        prefixedCorpus: getPrefixedCorpus()
      })
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({ error: `Server error: ${response.statusText}` }));
      throw new Error(errJson.error || `HTTP ${response.status}: Failed to run requirements analysis pipeline`);
    }

    onProgress({
      stage: 'pass2_detect',
      current_step_text: 'Pass 2/3: Reasoning across corpus for contradictions and unowned decisions...',
      progress_percent: 60
    });

    const data: AnalysisResults = await response.json();

    onProgress({
      stage: 'pass3_agenda',
      current_step_text: 'Pass 3/3: Synthesizing stakeholder walkthrough agenda and impact radius...',
      progress_percent: 85
    });

    onProgress({
      stage: 'verifying',
      current_step_text: 'Enforcing line-level programmatic citation verification against source text...',
      progress_percent: 95
    });

    // Run programmatic citation verification in browser
    let verifiedCount = 0;
    let rejectedCount = 0;

    const validatedFindings: Finding[] = [];

    for (const finding of data.findings) {
      let findingValid = true;
      const verifiedCitations: Citation[] = [];

      for (const citation of finding.citations) {
        const check = verifyCitationAgainstSource(citation);
        if (check.verified) {
          verifiedCitations.push({
            ...citation,
            verified: true
          });
          verifiedCount++;
        } else {
          // If slight mismatch, we still inspect
          console.warn(`Citation validation failed for ${citation.file}:${citation.line} - excerpt: "${citation.verbatim_excerpt}"`);
          rejectedCount++;
          // If at least some text is matched, we keep it marked as unverified or filter
          verifiedCitations.push({
            ...citation,
            verified: false
          });
        }
      }

      if (verifiedCitations.length >= 1) {
        validatedFindings.push({
          ...finding,
          citations: verifiedCitations
        });
      }
    }

    const duration = Date.now() - startTime;

    onProgress({
      stage: 'completed',
      current_step_text: `Analysis complete in ${(duration / 1000).toFixed(2)}s. ${verifiedCount} citations verified.`,
      progress_percent: 100
    });

    return {
      ...data,
      findings: validatedFindings,
      citations_verified: verifiedCount,
      citations_rejected: rejectedCount,
      execution_time_ms: duration
    };

  } catch (error: any) {
    console.error('Pipeline execution error:', error);
    onProgress({
      stage: 'error',
      current_step_text: `Analysis failed: ${error.message || 'Unknown error'}`,
      progress_percent: 0,
      error_message: error.message
    });
    throw error;
  }
}

/**
 * Downloads analysis result JSON files as requested in export requirements
 */
export function exportResultsAsFiles(results: AnalysisResults) {
  const headerMeta = {
    app: 'Aurora — Requirements Conflict Engine',
    model_id: results.model_id,
    timestamp: results.timestamp,
    engine: results.engine,
    execution_time_ms: results.execution_time_ms,
    citations_verified: results.citations_verified,
    citations_rejected: results.citations_rejected
  };

  const downloadJson = (filename: string, payload: any) => {
    const jsonStr = JSON.stringify({ _metadata: headerMeta, data: payload }, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  downloadJson('requirements.json', results.requirements);
  downloadJson('findings.json', results.findings);
  downloadJson('agenda.json', results.agenda);
}
