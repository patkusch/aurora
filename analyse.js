import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

// Define corpus inline / read from source
const CORPUS_FILES = {
  'FDS-DM-04_Allergy_Data_Migration.md': `# Functional Design Specification: Allergy Data Migration
**Document Reference:** FDS-DM-04 (Functional Design Specification)  
**Workstream:** Patient Data Migration & PAS Cutover  
**Author:** David Vance (Lead Migration Architect)  
**Approved Date:** 14 January 2026  
**Version:** 1.0 (Final Approved)  
**Target Platform:** Aurora EPR Release 4.2  
**Source Platform:** Legacy CareTrak PAS v11.3  

## 1. Executive Summary & Scope
This Functional Design Specification document governs the extraction, transformation, and automated migration of historical patient allergy and adverse drug reaction (ADR) records from the legacy CareTrak PAS into the Aurora EPR core database schema.

## 2. Technical Architecture & Cutover Strategy
Historical allergy records represent a foundational safety element for longitudinal patient care. During the scheduled cutover weekend, legacy allergy entities will be extracted via the ETL staging layer, mapped to national terminology standards, and directly populated into the active patient record.

## 3. Detailed Functional Requirements

### DM-04-R01: Historical Allergy Record Migration
All historical allergy and adverse reaction records associated with active and archived patient master records in CareTrak PAS (approx. 1.4 million records spanning 2004–2025) shall be migrated into Aurora EPR during the cutover window.

### DM-04-R02: SNOMED CT Terminology Coding
Legacy allergen identifiers and free-text substance labels shall undergo best-effort algorithmic matching against the UK NHS SNOMED CT drug and substance subset (release v34.1). Unmapped items shall be assigned SNOMED code 716186003 (No Known Allergy) with legacy text retained in secondary notes.

### DM-04-R03: Immediate Visibility in Active Clinical Panel
All migrated allergy records shall be rendered immediately visible and active in the Aurora Allergy & Intolerance clinical summary panel upon initial user login at go-live.

### DM-04-R04: Algorithmic Severity Derivation from Legacy Notes
Allergy severity classifications (Mild, Moderate, Severe, Life-Threatening) shall be algorithmically inferred from legacy free-text clinical notes and mapped into Aurora Severity tiers using regex keyword extraction.

### DM-04-R05: Audit Logging and Clinician Attestation
The system shall preserve the original legacy recording timestamp, legacy clinician ID, and migration batch identifier for every migrated allergy entity to support medicolegal compliance.

### DM-04-R06: Duplicate Resolution Mechanism
Where duplicate allergy entries exist for a single patient with matching substance concepts, the migration engine shall merge them into a single active record, preserving the highest recorded severity level.

### DM-04-R07: Paediatric Exemption Logic
Allergy records pertaining to paediatric patients under 16 years of age shall carry a mandatory verification flag requiring secondary review at the subsequent hospital encounter.

### DM-04-R08: Transformation Failure Handling
Any record failing structural schema validation shall be diverted to the staging exception queue for manual resolution within 72 hours of cutover completion.

## 4. Sign-Off and Approvals
- David Vance, Lead Migration Architect (Approved: 14-Jan-2026)
- Sarah Jenkins, Migration Workstream Lead (Approved: 14-Jan-2026)
- Arthur Pendelton, Solution Assurance SME (Approved: 14-Jan-2026)`,

  'FDS-CLIN-11_Allergy_Capture_At_First_Appointment.md': `# Functional Design Specification: Clinical Allergy Capture at First Encounter
**Document Reference:** FDS-CLIN-11 (Functional Design Specification)  
**Workstream:** Clinical Design & Patient Safety  
**Author:** Dr. Fiona Gallagher (Consultant Clinical Safety Officer)  
**Approved Date:** 19 February 2026  
**Version:** 1.0 (Final Approved)  
**Target Platform:** Aurora EPR Release 4.2  
**Clinical Safety Authority:** Meridian Health CSG (Clinical Safety Group)  

## 1. Executive Summary & Clinical Governance
This Functional Design Specification specifies the mandatory clinical workflow for establishing patient allergy and intolerance profiles in Aurora EPR. Following Clinical Safety Case Review CSG-2026-08, direct automated ingestion of legacy PAS allergy data was evaluated and classified as an unacceptable clinical prescribing hazard.

## 2. Clinical Safety Baseline & Workflow Requirements

### CLIN-11-R01: Unpopulated Allergy Panel at Go-Live
The Aurora Allergy & Intolerance clinical summary panel shall be unpopulated and empty at go-live for all migrated patients to ensure unverified legacy data does not compromise acute prescribing decisions.

### CLIN-11-R02: Absolute Prohibition of Unverified Legacy Data Ingestion
Legacy allergy data must never populate a clinical field because the Clinical Safety Group ruled it unsafe for prescribing due to inconsistent coding and unverified dosage thresholds in legacy PAS.

### CLIN-11-R03: Point-of-Care Allergy Reconciliation
Allergy and intolerance profiles must be captured directly from the patient by an authorised registered prescriber during their first physical or virtual clinical appointment post go-live.

### CLIN-11-R04: Mandatory Prescribing Hard-Stop
The electronic prescribing and medicines administration (ePMA) module shall enforce a mandatory hard-stop blocking all non-emergency drug orders until point-of-care allergy reconciliation is completed by an authorised clinician.

### CLIN-11-R05: Direct Patient Elicitation of Severity
Allergy severity and adverse reaction manifestations must be captured directly from the patient at first appointment, never inferred or derived from automated algorithms or unverified historical free-text notes.

### CLIN-11-R06: Clinical Decision Support Rule Alignment
Point-of-care captured allergies shall immediately trigger real-time drug-allergy interaction (DAI) alerts within the Aurora pharmacy engine upon confirmed clinician signing.

## 3. Governance and Safety Approvals
- Dr. Fiona Gallagher, Clinical Safety Officer (Approved: 19-Feb-2026)
- Prof. Alistair Finch, Medical Director & Chair CSG (Approved: 19-Feb-2026)
- Dr. Eleanor Vance, Clinical Lead Pharmacy & Therapeutics (Approved: 19-Feb-2026)`,

  'DM_Field_Mapping_v7.csv': `Row,Legacy_Field,Aurora_Field,Migrate,Transform,Owner,Last_Changed
1,PAT_ALLERGY_ID,AUR_ALLERGY_ID,Y,Direct 1:1 GUID generation,D. Vance,12-Jan-2026
2,PAT_NHS_NUMBER,AUR_PATIENT_NHS_NO,Y,Format ISO-13606 validation,S. Jenkins,14-Jan-2026
3,ALLERGY_DESC,AUR_ALLERGEN_NAME,Y,Cleanse whitespace trim,D. Vance,14-Jan-2026
4,ALLERGEN_CODE,AUR_SNOMED_CONCEPT_ID,Y,SNOMED CT NHS UK subset map,A. Pendelton,14-Jan-2026
5,REACTION_TYPE,AUR_REACTION_CATEGORY,Y,Map Enum (Allergy|Intolerance|Adverse),D. Vance,14-Jan-2026
6,SEVERITY_CODE,AUR_SEVERITY_LEVEL,N,Do not migrate - free text derivation cancelled by Pharmacy SME,M. Brody,26-Feb-2026
7,DATE_RECORDED,AUR_RECORDED_DATETIME,Y,Convert DD/MM/YYYY to UTC ISO-8601,S. Jenkins,14-Jan-2026
8,RECORDING_CLINICIAN_ID,AUR_ORIGINATING_STAFF_REF,Y,Lookup GMC/NMC master table,D. Vance,14-Jan-2026
9,STATUS_FLAG,AUR_ACTIVE_STATUS,Y,Map (A->Active, I->Resolved),D. Vance,14-Jan-2026
10,CLINICAL_COMMENTS,AUR_HISTORICAL_NOTES,Y,Truncate 4000 chars sanitize HTML,A. Pendelton,14-Jan-2026
11,VERIFICATION_STATUS,AUR_CONFIRMATION_STATE,Y,Default to Unconfirmed_Legacy,D. Vance,14-Jan-2026
12,WARD_LOCATION_CODE,AUR_CARE_SETTING_ID,Y,Direct lookup pending Ward Master ref,M. Brody,25-Feb-2026`,

  'Teams_Export_DataMigration_Channel.txt': `[2026-02-24 09:14:22] David Vance: Morning all. We are finalising the DM-04 migration scripts for the dry run next Tuesday. Any pending questions on the allergy schema?
[2026-02-24 09:21:05] Marcus Brody (Pharmacy SME): Hi David. I reviewed the severity transformation logic in DM-04-R04. We can't derive severity from free text, it's a prescribing risk.
[2026-02-24 09:23:40] Dr. Eleanor Vance (Pharmacy Lead): Marcus is completely right. Clinical Safety Group reviewed this last Thursday. Free-text severity inference generates false high-risk flags and misses anaphylaxis cases. It cannot go live.
[2026-02-24 09:28:15] David Vance: Understood Eleanor. If pharmacy rejects automated derivation, we need to drop Row 6 from the active ETL payload.
[2026-02-24 09:31:00] Marcus Brody: Perfect. I will update Row 6 on DM_Field_Mapping_v7.csv right now to set Migrate=N.
[2026-02-24 09:34:12] David Vance: Thanks Marcus. The scheduled joint walkthrough for Wednesday is cancelled due to the trust board meeting, so we will skip formal minuting for now.
[2026-02-24 09:35:48] Sarah Jenkins: Note that DM-04 needs a version bump to reflect the severity cancellation before the final sign-off audit.
[2026-02-24 09:38:10] Marcus Brody: Also noticed Row 12 has a dependency on ward-code mapping from the legacy PAS, but there is no approved design document for ward-level location translation.
[2026-02-24 09:41:04] David Vance: Good spot Marcus. We have no Functional Design Specification covering ward code transformations yet. Let's park that until the PAS team responds.
[2026-02-24 09:45:30] Arthur Pendelton: Has anyone logged a change request to update Functional Design Specification FDS-DM-04 itself? The approved PDF still states DM-04-R04 is active.
[2026-02-24 09:47:11] Sarah Jenkins: Not yet, everyone is flat out on the cutover dry run. We'll pick up doc updates post-dry run.`
};

function getPrefixedCorpus() {
  const chunks = [];
  for (const [filename, content] of Object.entries(CORPUS_FILES)) {
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      chunks.push(`${filename}:${index + 1}| ${line}`);
    });
  }
  return chunks.join('\n');
}

function parseLenientJson(rawText, fallback) {
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
    console.error('Parse error:', err.message);
  }
  return fallback;
}

async function runCliAnalysis() {
  console.log('====================================================');
  console.log('   Aurora Requirements Conflict Engine — CLI Runner  ');
  console.log('====================================================\n');

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('ERROR: GEMINI_API_KEY environment variable is not set.');
    process.exit(1);
  }

  // Model ID: Gemini 3.7 Flash
  const modelId = 'gemini-3.7-flash';
  console.log(`Using Model: ${modelId}`);

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: { 'User-Agent': 'aistudio-build' }
    }
  });

  const prefixedCorpus = getPrefixedCorpus();
  console.log(`Prepared prefixed corpus (${prefixedCorpus.split('\n').length} lines across 4 source files)...\n`);

  // PASS 1: Extraction
  console.log('--> [Pass 1/3] Extracting atomic requirements...');
  const pass1Prompt = `You are Aurora Pass 1 — Requirements Extraction Engine.
Analyze the following multi-source corpus where EVERY LINE is prefixed with "FILENAME:LINENO| ".
Extract EVERY atomic requirement from the formal design documents, the spreadsheet rows, AND the chat messages.
IMPORTANT: Decisions and statements made in Teams chat messages are FIRST-CLASS requirements.

Corpus:
${prefixedCorpus}

Return ONLY a valid JSON array of objects:
[
  {
    "id": "string",
    "text": "string",
    "source_file": "string",
    "source_line": number,
    "author": "string",
    "date": "string",
    "status": "APPROVED" | "DRAFT" | "VERBAL_PROPOSAL" | "UNRECORDED",
    "workstream": "string"
  }
]`;

  const pass1Res = await ai.models.generateContent({
    model: modelId,
    contents: pass1Prompt,
    config: { temperature: 0.1, responseMimeType: 'application/json' }
  });

  const requirements = parseLenientJson(pass1Res.text || '', []);
  console.log(`    Extracted ${requirements.length} atomic requirements.`);

  // PASS 2: Detect
  console.log('\n--> [Pass 2/3] Detecting contradictions, verbal overrides & gaps...');
  const pass2Prompt = `You are Aurora Pass 2 — Requirements Conflict & Blast Radius Detection Engine.
Reason across the entire requirements corpus simultaneously to identify:
1. Hard Contradictions between separately approved design documents.
2. Unpropagated Verbal Overrides (decisions in chat reaching mapping sheet but not approved design docs).
3. Orphan Dependencies (field mapping without approved design doc).
4. Unowned Governance Gaps (omitted version bump, cancelled walkthrough minuting).

Corpus Reference:
${prefixedCorpus}

Extracted Requirements:
${JSON.stringify(requirements, null, 2)}

Return ONLY a valid JSON array of finding objects:
[
  {
    "id": "F-01",
    "type": "CONTRADICTION" | "VERBAL_OVERRIDE" | "ORPHAN_DEPENDENCY" | "GOVERNANCE_GAP",
    "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
    "title": "string",
    "blast_radius_score": number,
    "citations": [
      {
        "file": "string",
        "line": number,
        "verbatim_excerpt": "string"
      }
    ],
    "why_incompatible": "string",
    "consequence": "string"
  }
]
EVERY finding MUST cite at least two citations with exact FILENAME:LINENO and verbatim_excerpt.`;

  const pass2Res = await ai.models.generateContent({
    model: modelId,
    contents: pass2Prompt,
    config: { temperature: 0.1, responseMimeType: 'application/json' }
  });

  const findings = parseLenientJson(pass2Res.text || '', []);
  console.log(`    Identified ${findings.length} findings.`);

  // PASS 3: Agenda
  console.log('\n--> [Pass 3/3] Generating stakeholder walkthrough agenda...');
  const pass3Prompt = `You are Aurora Pass 3 — Stakeholder Walkthrough Agenda Generator.
Convert findings into an actionable walkthrough agenda.
Findings:
${JSON.stringify(findings, null, 2)}

Return ONLY a valid JSON array of agenda items:
[
  {
    "finding_id": "string",
    "question_to_be_asked": "string",
    "required_attendees": ["string"],
    "evidence_pack": ["string"],
    "time_box_minutes": number,
    "downstream_milestone_impact": "string"
  }
]`;

  const pass3Res = await ai.models.generateContent({
    model: modelId,
    contents: pass3Prompt,
    config: { temperature: 0.1, responseMimeType: 'application/json' }
  });

  const agenda = parseLenientJson(pass3Res.text || '', []);
  console.log(`    Generated ${agenda.length} walkthrough agenda items.`);

  // Programmatic verification
  console.log('\n--> Verifying citations against source corpus files...');
  let verifiedCitations = 0;
  for (const finding of findings) {
    for (const cit of finding.citations || []) {
      const file = CORPUS_FILES[cit.file];
      if (file) {
        const lines = file.split('\n');
        const line = lines[cit.line - 1] || '';
        if (line.toLowerCase().includes(cit.verbatim_excerpt.toLowerCase().trim())) {
          cit.verified = true;
          verifiedCitations++;
        }
      }
    }
  }
  console.log(`    Verified ${verifiedCitations} citation links.`);

  // Write output files to /out
  const outDir = path.join(process.cwd(), 'out');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const findingsPath = path.join(outDir, 'findings.json');
  const requirementsPath = path.join(outDir, 'requirements.json');
  const agendaPath = path.join(outDir, 'agenda.json');

  fs.writeFileSync(findingsPath, JSON.stringify(findings, null, 2), 'utf-8');
  fs.writeFileSync(requirementsPath, JSON.stringify(requirements, null, 2), 'utf-8');
  fs.writeFileSync(agendaPath, JSON.stringify(agenda, null, 2), 'utf-8');

  console.log(`\n Output written successfully:`);
  console.log(`  - ${findingsPath} (${findings.length} findings)`);
  console.log(`  - ${requirementsPath} (${requirements.length} requirements)`);
  console.log(`  - ${agendaPath} (${agenda.length} agenda items)`);
  console.log('\nDone.');
}

runCliAnalysis().catch(err => {
  console.error('\nAnalysis run failed:', err);
  process.exit(1);
});
