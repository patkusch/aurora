/**
 * Pass 1 on a local model through Ollama: the on-device half of the hybrid path.
 *
 * Kept out of server.ts so it can be tested without starting Express. Passes 2
 * and 3 still run on Gemini, so this path needs GEMINI_API_KEY as well.
 */

/** The tag the submitted build asked for. Override with AURORA_GEMMA_MODEL. */
export const DEFAULT_LOCAL_MODEL = 'gemma4';
export const OLLAMA_GENERATE_URL = 'http://localhost:11434/api/generate';

export function localModelName(env: Record<string, string | undefined> = process.env): string {
  return env.AURORA_GEMMA_MODEL?.trim() || DEFAULT_LOCAL_MODEL;
}

export function buildPass1Prompt(prefixedCorpus: string): string {
  return `Extract every atomic requirement from these corpus lines:\n${prefixedCorpus}\nFormat as JSON array of {id, text, source_file, source_line, author, date, status, workstream}.`;
}

/**
 * Ollama gives a model a 4096-token window unless told otherwise. The demo
 * corpus alone is about 4,700 tokens, so Ollama quietly kept only the last
 * 2,051 tokens of the prompt and cut the reply off mid-array, which parsed to
 * nothing. Size the window from the prompt instead, with room for the reply.
 */
const REPLY_BUDGET_TOKENS = 8192;

export function contextWindowFor(prompt: string): number {
  // Two characters per token overestimates (about three was observed), which is
  // the safe direction: too big costs memory, too small silently drops text.
  const needed = Math.ceil(prompt.length / 2) + REPLY_BUDGET_TOKENS;
  let window = 8192;
  while (window < needed) window *= 2;
  return window;
}

export function buildOllamaRequest(prefixedCorpus: string, model: string) {
  const prompt = buildPass1Prompt(prefixedCorpus);
  return {
    model,
    prompt,
    stream: false,
    // Same temperature as the Gemini passes.
    options: { temperature: 0.1, num_ctx: contextWindowFor(prompt) },
  };
}

// Lenient JSON parser for model replies: strips code fences, then falls back to
// the outermost [..] or {..} if the reply has prose around it.
export function parseLenientJson<T>(rawText: string, fallback: T): T {
  try {
    if (!rawText) return fallback;

    let clean = rawText.trim();
    if (clean.startsWith('```')) {
      clean = clean.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    }

    try {
      return JSON.parse(clean);
    } catch {
      const firstBracket = clean.indexOf('[');
      const firstBrace = clean.indexOf('{');
      let startIdx = -1;
      let endIdx = -1;

      if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
        startIdx = firstBracket;
        endIdx = clean.lastIndexOf(']');
      } else if (firstBrace !== -1) {
        startIdx = firstBrace;
        endIdx = clean.lastIndexOf('}');
      }

      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        return JSON.parse(clean.substring(startIdx, endIdx + 1));
      }
    }
  } catch (err) {
    console.error('Failed to parse JSON response leniently:', err);
  }
  return fallback;
}

export interface LocalExtractionOutcome {
  requirements: any[];
  /** Set when Pass 1 could not be used and must fall back to Gemini. */
  warning?: string;
}

const FALLBACK = 'Fell back to cloud Gemini 3.7 Flash for Pass 1.';

/**
 * Turn Ollama's reply into requirements, or into a reason to fall back.
 * Every failure produces a warning: before this, a missing model or an
 * unreadable reply fell back to the cloud without telling the user.
 */
export function readOllamaResult(status: number, body: any, model: string): LocalExtractionOutcome {
  if (status < 200 || status >= 300) {
    const detail = body?.error ? ` (${body.error})` : '';
    const hint = status === 404
      ? ` Run \`ollama pull ${model}\`, or set AURORA_GEMMA_MODEL to a model you have.`
      : '';
    return { requirements: [], warning: `Local model "${model}" returned HTTP ${status}${detail}.${hint} ${FALLBACK}` };
  }

  if (body?.done_reason === 'length') {
    return {
      requirements: [],
      warning: `Local model "${model}" ran out of context and its reply was cut off. ${FALLBACK}`,
    };
  }

  const parsed = parseLenientJson<unknown>(body?.response ?? '', []);
  const requirements = (Array.isArray(parsed) ? parsed : [])
    .filter((r) => r && typeof r === 'object')
    // Gemini's JSON mode returns line numbers as numbers; Gemma often writes
    // "12". The verifier rightly insists on an integer, so every local
    // requirement failed provenance even when it pointed at the right line.
    .map((r: any) =>
      typeof r.source_line === 'string' && /^\s*\d+\s*$/.test(r.source_line)
        ? { ...r, source_line: Number(r.source_line) }
        : r,
    );

  if (requirements.length === 0) {
    return {
      requirements: [],
      warning: `Local model "${model}" returned no requirements that could be read as JSON. ${FALLBACK}`,
    };
  }

  return { requirements };
}
