import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
// Hosting platforms (Render, Railway, Fly, Cloud Run) inject the port to bind
// and health-check against it, so this must not be hardcoded.
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Helper to extract JSON from model responses (lenient parser with fence removal & brace extraction)
function parseLenientJson<T>(rawText: string, fallback: T): T {
  try {
    if (!rawText) return fallback;

    let clean = rawText.trim();
    // Remove markdown code fences ```json ... ``` or ``` ... ```
    if (clean.startsWith('```')) {
      clean = clean.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    }

    // Try direct parse
    try {
      return JSON.parse(clean);
    } catch {
      // Find first [ or { and last ] or }
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
        const substring = clean.substring(startIdx, endIdx + 1);
        return JSON.parse(substring);
      }
    }
  } catch (err) {
    console.error('Failed to parse JSON response leniently:', err);
  }
  return fallback;
}

// Lazy Gemini client helper
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set. Add it to .env locally, or as an environment variable on your host.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
}

// 3-Pass Analysis Pipeline Route
app.post('/api/analyse', async (req, res) => {
  const startTime = Date.now();
  const { prefixedCorpus, useLocalGemma } = req.body;

  if (!prefixedCorpus) {
    return res.status(400).json({ error: 'prefixedCorpus is required' });
  }

  const modelId = 'gemini-3.7-flash';
  let engine: 'GEMINI_CLOUD' | 'GEMMA_LOCAL' | 'GEMMA_FALLBACK' = 'GEMINI_CLOUD';
  const warnings: string[] = [];

  let extractedRequirements: any[] = [];
  let findings: any[] = [];
  let agenda: any[] = [];

  try {
    // ----------------------------------------------------
    // PASS 1: Extraction
    // ----------------------------------------------------
    let pass1RanOnLocal = false;

    if (useLocalGemma) {
      try {
        console.log('Attempting Pass 1 on local Ollama endpoint...');
        const ollamaRes = await fetch('http://localhost:11434/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'gemma4',
            prompt: `Extract every atomic requirement from these corpus lines:\n${prefixedCorpus}\nFormat as JSON array of {id, text, source_file, source_line, author, date, status, workstream}.`,
            stream: false
          })
        });

        if (ollamaRes.ok) {
          const ollamaData = await ollamaRes.json();
          extractedRequirements = parseLenientJson(ollamaData.response, []);
          if (extractedRequirements.length > 0) {
            pass1RanOnLocal = true;
            engine = 'GEMMA_LOCAL';
          }
        }
      } catch (ollamaErr: any) {
        console.warn('Local Ollama extraction failed, falling back to Gemini 3.7 Flash:', ollamaErr.message);
        engine = 'GEMMA_FALLBACK';
        warnings.push('Local Gemma extraction was unreachable at localhost:11434. Automatically fell back to cloud Gemini 3.7 Flash.');
      }
    }

    const ai = getGeminiClient();

    if (!pass1RanOnLocal) {
      console.log('Running Pass 1 (Extraction) on Gemini 3.7 Flash...');
      const pass1Prompt = `You are Aurora Pass 1 — Requirements Extraction Engine.
Analyze the following multi-source corpus where EVERY LINE is prefixed with "FILENAME:LINENO| ".
Extract EVERY atomic requirement from the formal design documents, the spreadsheet rows, AND the chat messages.
IMPORTANT: Decisions and statements made in Teams chat messages are FIRST-CLASS requirements (e.g., pharmacy cancellations, ward-code dependencies, doc update notes).

Corpus:
${prefixedCorpus}

Return ONLY a valid JSON array of objects with the following structure:
[
  {
    "id": "string (e.g. DM-04-R01, CLIN-11-R01, MAP-ROW-06, CHAT-REQ-01)",
    "text": "string (exact or clear summary of the requirement)",
    "source_file": "string (filename matching the prefix)",
    "source_line": number (line number from prefix),
    "author": "string (person or team who wrote or stated it)",
    "date": "string (date from header or timestamp)",
    "status": "APPROVED" | "DRAFT" | "VERBAL_PROPOSAL" | "UNRECORDED",
    "workstream": "string (e.g. Data Migration, Clinical Design, Cross-Stream Collaboration)"
  }
]`;

      const pass1Response = await ai.models.generateContent({
        model: modelId,
        contents: pass1Prompt,
        config: {
          temperature: 0.1,
          responseMimeType: 'application/json'
        }
      });

      extractedRequirements = parseLenientJson(pass1Response.text || '', []);
    }

    // Check if any requirements came from Teams chat
    const teamsReqs = extractedRequirements.filter(r => r.source_file && r.source_file.includes('Teams'));
    if (teamsReqs.length === 0) {
      warnings.push('WARNING: Zero requirements extracted from Teams chat export. Chat decisions may not have propagated.');
    }

    // ----------------------------------------------------
    // PASS 2: Conflict Detection & Reasoning
    // ----------------------------------------------------
    console.log('Running Pass 2 (Conflict Detection) on Gemini 3.7 Flash...');
    const pass2Prompt = `You are Aurora Pass 2 — Requirements Conflict & Blast Radius Detection Engine.
You have the full extracted requirement set and original prefixed corpus lines.
Reason across the entire requirements corpus simultaneously to identify:
1. Hard Contradictions between separately approved design documents (e.g., historical allergy data ingestion in FDS-DM-04 vs unpopulated/empty panel in FDS-CLIN-11).
2. Unpropagated Verbal Overrides (decisions made in chat that reached the mapping sheet but never updated the approved design document, such as free-text severity derivation cancelled by Pharmacy SME).
3. Orphan Dependencies (e.g., field mapping depending on ward codes without an approved governing design document).
4. Unowned Governance Gaps (e.g., version bump omitted, cancelled walkthrough minuting skipped).

Rank findings by blast radius (Patient Safety hazards ranked highest, followed by ETL build divergence, runtime mapping failures, and governance audit risks).

Corpus Reference:
${prefixedCorpus}

Extracted Requirements:
${JSON.stringify(extractedRequirements, null, 2)}

Return ONLY a valid JSON array of finding objects with the following structure:
[
  {
    "id": "F-01",
    "type": "CONTRADICTION" | "VERBAL_OVERRIDE" | "ORPHAN_DEPENDENCY" | "GOVERNANCE_GAP",
    "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
    "title": "string (clear descriptive headline)",
    "blast_radius_score": number (1 to 100),
    "citations": [
      {
        "file": "string (exact filename)",
        "line": number (exact 1-based line number),
        "verbatim_excerpt": "string (verbatim exact substring of that line)"
      }
    ],
    "why_incompatible": "string (deep multi-source reasoning explaining why they cannot both be true)",
    "consequence": "string (downstream clinical, operational, or technical failure if unresolved)"
  }
]
EVERY finding MUST cite at least two citations with exact FILENAME:LINENO and verbatim_excerpt.`;

    const pass2Response = await ai.models.generateContent({
      model: modelId,
      contents: pass2Prompt,
      config: {
        temperature: 0.1,
        responseMimeType: 'application/json'
      }
    });

    findings = parseLenientJson(pass2Response.text || '', []);

    // ----------------------------------------------------
    // PASS 3: Walkthrough Agenda Generation
    // ----------------------------------------------------
    console.log('Running Pass 3 (Walkthrough Agenda) on Gemini 3.7 Flash...');
    const pass3Prompt = `You are Aurora Pass 3 — Stakeholder Walkthrough Agenda Generator.
Convert the following detected findings into an executive walkthrough agenda for the Clinical & Architecture Review Board.
The output must not be a vague report; it must be an actionable meeting agenda where stakeholders adjudicate unowned decisions.

Findings:
${JSON.stringify(findings, null, 2)}

Return ONLY a valid JSON array of agenda items matching the findings:
[
  {
    "finding_id": "string (matching finding id, e.g. F-01)",
    "question_to_be_asked": "string (precise, unambiguous question to be adjudicated by the room)",
    "required_attendees": ["string (attendee name and/or clinical/technical role)"],
    "evidence_pack": ["string (specific documents, lines, and safety reviews to table)"],
    "time_box_minutes": number (e.g. 10, 15, 30),
    "downstream_milestone_impact": "string (specific delivery milestone and delay consequence if unresolved)"
  }
]`;

    const pass3Response = await ai.models.generateContent({
      model: modelId,
      contents: pass3Prompt,
      config: {
        temperature: 0.1,
        responseMimeType: 'application/json'
      }
    });

    agenda = parseLenientJson(pass3Response.text || '', []);

    // Stabilise finding IDs. The model assigns F-01.. in whatever order it
    // emits, so the same conflict can be F-02 on one run and F-03 on the next —
    // which makes IDs useless for citing in docs or a live demo. Sort by blast
    // radius and reassign, then remap the agenda's finding_id references so the
    // two stay in step.
    findings.sort((a, b) => (b?.blast_radius_score ?? 0) - (a?.blast_radius_score ?? 0));

    const idRemap = new Map<string, string>();
    findings = findings.map((finding, index) => {
      const stableId = `F-${String(index + 1).padStart(2, '0')}`;
      if (finding?.id && finding.id !== stableId) idRemap.set(finding.id, stableId);
      return { ...finding, id: stableId };
    });

    agenda = agenda.map((item: any) =>
      item?.finding_id && idRemap.has(item.finding_id)
        ? { ...item, finding_id: idRemap.get(item.finding_id) }
        : item
    );

    const duration = Date.now() - startTime;

    return res.json({
      model_id: modelId,
      timestamp: new Date().toISOString(),
      engine,
      execution_time_ms: duration,
      warnings,
      requirements: extractedRequirements,
      findings,
      agenda
    });

  } catch (error: any) {
    console.error('Pipeline error:', error);
    return res.status(500).json({
      error: error.message || 'Internal error during analysis pipeline execution'
    });
  }
});

// Vite / static middleware
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Express 4 wildcard. ('*all' is Express 5 syntax and matches nothing here,
    // which made every non-root path 404 instead of falling back to the SPA.)
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Aurora Conflict Engine server running on http://localhost:${PORT}`);
  });
}

startServer();
