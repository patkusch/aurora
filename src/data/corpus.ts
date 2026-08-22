import { CorpusFile, AnalysisResults, Citation } from '../types';

export const CORPUS_FILES: Record<string, CorpusFile> = {
  'FDS-DM-04_Allergy_Data_Migration.md': {
    filename: 'FDS-DM-04_Allergy_Data_Migration.md',
    title: 'Functional Design Specification: Allergy Data Migration',
    workstream: 'Data Migration',
    date: '14 January 2026',
    type: 'markdown',
    content: `# Functional Design Specification: Allergy Data Migration
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
- Arthur Pendelton, Solution Assurance SME (Approved: 14-Jan-2026)`
  },

  'FDS-CLIN-11_Allergy_Capture_At_First_Appointment.md': {
    filename: 'FDS-CLIN-11_Allergy_Capture_At_First_Appointment.md',
    title: 'Functional Design Specification: Clinical Allergy Capture at First Encounter',
    workstream: 'Clinical Design',
    date: '19 February 2026',
    type: 'markdown',
    content: `# Functional Design Specification: Clinical Allergy Capture at First Encounter
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
- Dr. Eleanor Vance, Clinical Lead Pharmacy & Therapeutics (Approved: 19-Feb-2026)`
  },

  'DM_Field_Mapping_v7.csv': {
    filename: 'DM_Field_Mapping_v7.csv',
    title: 'Data Migration Field Mapping Specification v7',
    workstream: 'Data Migration',
    date: '26 February 2026',
    type: 'csv',
    content: `Row,Legacy_Field,Aurora_Field,Migrate,Transform,Owner,Last_Changed
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
12,WARD_LOCATION_CODE,AUR_CARE_SETTING_ID,Y,Direct lookup pending Ward Master ref,M. Brody,25-Feb-2026`
  },

  'Teams_Export_DataMigration_Channel.txt': {
    filename: 'Teams_Export_DataMigration_Channel.txt',
    title: 'Microsoft Teams Channel Export: #migration-stream-allergy',
    workstream: 'Cross-Stream Collaboration',
    date: '24–27 February 2026',
    type: 'chat',
    content: `[2026-02-24 09:14:22] David Vance: Morning all. We are finalising the DM-04 migration scripts for the dry run next Tuesday. Any pending questions on the allergy schema?
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
  }
};

/**
 * Returns corpus files with the line-level provenance prefix:
 * `FILENAME:LINENO| `
 */
export function getPrefixedCorpus(): string {
  const chunks: string[] = [];

  for (const [filename, file] of Object.entries(CORPUS_FILES)) {
    const lines = file.content.split('\n');
    lines.forEach((line, index) => {
      const lineNo = index + 1;
      chunks.push(`${filename}:${lineNo}| ${line}`);
    });
  }

  return chunks.join('\n');
}

/**
 * Programmatically verify citations against original corpus lines.
 */
export function verifyCitationAgainstSource(citation: Citation): { verified: boolean; actualLineText?: string } {
  const file = CORPUS_FILES[citation.file];
  if (!file) {
    return { verified: false };
  }

  const lines = file.content.split('\n');
  const lineIndex = citation.line - 1;

  if (lineIndex < 0 || lineIndex >= lines.length) {
    return { verified: false };
  }

  const actualLine = lines[lineIndex];
  // Check if verbatim excerpt is a substring of the actual line (ignoring extra whitespace)
  const normalizedActual = actualLine.trim().toLowerCase();
  const normalizedExcerpt = citation.verbatim_excerpt.trim().toLowerCase();

  const isMatch = normalizedActual.includes(normalizedExcerpt) || 
                  normalizedExcerpt.includes(normalizedActual) ||
                  // Handle fuzzy substring containment
                  normalizedActual.replace(/\s+/g, ' ').includes(normalizedExcerpt.replace(/\s+/g, ' '));

  return {
    verified: isMatch,
    actualLineText: actualLine
  };
}

/**
 * Pre-baked sample results for instant UI loading and demo safety.
 */
export const SAMPLE_RESULTS: AnalysisResults = {
  model_id: 'models/gemini-3.7-flash',
  timestamp: new Date().toISOString(),
  engine: 'GEMINI_CLOUD',
  execution_time_ms: 1840,
  citations_verified: 9,
  citations_rejected: 0,
  warnings: [],
  requirements: [
    {
      id: 'DM-04-R01',
      text: 'All historical allergy records (1.4M) migrate into Aurora EPR during cutover.',
      source_file: 'FDS-DM-04_Allergy_Data_Migration.md',
      source_line: 19,
      author: 'David Vance',
      date: '14-Jan-2026',
      status: 'APPROVED',
      workstream: 'Data Migration'
    },
    {
      id: 'DM-04-R03',
      text: 'All migrated allergy records shall be rendered immediately visible and active in the Aurora Allergy & Intolerance clinical summary panel upon initial user login at go-live.',
      source_file: 'FDS-DM-04_Allergy_Data_Migration.md',
      source_line: 25,
      author: 'David Vance',
      date: '14-Jan-2026',
      status: 'APPROVED',
      workstream: 'Data Migration'
    },
    {
      id: 'DM-04-R04',
      text: 'Allergy severity classifications (Mild, Moderate, Severe, Life-Threatening) shall be algorithmically inferred from legacy free-text clinical notes and mapped into Aurora Severity tiers using regex keyword extraction.',
      source_file: 'FDS-DM-04_Allergy_Data_Migration.md',
      source_line: 28,
      author: 'David Vance',
      date: '14-Jan-2026',
      status: 'APPROVED',
      workstream: 'Data Migration'
    },
    {
      id: 'CLIN-11-R01',
      text: 'The Aurora Allergy & Intolerance clinical summary panel shall be unpopulated and empty at go-live for all migrated patients to ensure unverified legacy data does not compromise acute prescribing decisions.',
      source_file: 'FDS-CLIN-11_Allergy_Capture_At_First_Appointment.md',
      source_line: 16,
      author: 'Dr. Fiona Gallagher',
      date: '19-Feb-2026',
      status: 'APPROVED',
      workstream: 'Clinical Design'
    },
    {
      id: 'CLIN-11-R02',
      text: 'Legacy allergy data must never populate a clinical field because the Clinical Safety Group ruled it unsafe for prescribing due to inconsistent coding and unverified dosage thresholds in legacy PAS.',
      source_file: 'FDS-CLIN-11_Allergy_Capture_At_First_Appointment.md',
      source_line: 19,
      author: 'Dr. Fiona Gallagher',
      date: '19-Feb-2026',
      status: 'APPROVED',
      workstream: 'Clinical Design'
    },
    {
      id: 'CLIN-11-R05',
      text: 'Allergy severity and adverse reaction manifestations must be captured directly from the patient at first appointment, never inferred or derived from automated algorithms or unverified historical free-text notes.',
      source_file: 'FDS-CLIN-11_Allergy_Capture_At_First_Appointment.md',
      source_line: 28,
      author: 'Dr. Fiona Gallagher',
      date: '19-Feb-2026',
      status: 'APPROVED',
      workstream: 'Clinical Design'
    },
    {
      id: 'MAP-ROW-06',
      text: 'SEVERITY_CODE -> AUR_SEVERITY_LEVEL | Migrate=N | Do not migrate - free text derivation cancelled by Pharmacy SME',
      source_file: 'DM_Field_Mapping_v7.csv',
      source_line: 7,
      author: 'M. Brody',
      date: '26-Feb-2026',
      status: 'DRAFT',
      workstream: 'Data Migration'
    },
    {
      id: 'MAP-ROW-12',
      text: 'WARD_LOCATION_CODE -> AUR_CARE_SETTING_ID | Migrate=Y | Direct lookup pending Ward Master ref',
      source_file: 'DM_Field_Mapping_v7.csv',
      source_line: 13,
      author: 'M. Brody',
      date: '25-Feb-2026',
      status: 'DRAFT',
      workstream: 'Data Migration'
    },
    {
      id: 'CHAT-REQ-01',
      text: 'We can\'t derive severity from free text, it\'s a prescribing risk.',
      source_file: 'Teams_Export_DataMigration_Channel.txt',
      source_line: 2,
      author: 'Marcus Brody (Pharmacy SME)',
      date: '2026-02-24',
      status: 'VERBAL_PROPOSAL',
      workstream: 'Cross-Stream Collaboration'
    },
    {
      id: 'CHAT-REQ-02',
      text: 'Note that DM-04 needs a version bump to reflect the severity cancellation before the final sign-off audit.',
      source_file: 'Teams_Export_DataMigration_Channel.txt',
      source_line: 7,
      author: 'Sarah Jenkins',
      date: '2026-02-24',
      status: 'UNRECORDED',
      workstream: 'Cross-Stream Collaboration'
    },
    {
      id: 'CHAT-REQ-03',
      text: 'Row 12 has a dependency on ward-code mapping from the legacy PAS, but there is no approved design document for ward-level location translation.',
      source_file: 'Teams_Export_DataMigration_Channel.txt',
      source_line: 8,
      author: 'Marcus Brody',
      date: '2026-02-24',
      status: 'UNRECORDED',
      workstream: 'Cross-Stream Collaboration'
    }
  ],
  findings: [
    {
      id: 'F-01',
      type: 'CONTRADICTION',
      severity: 'CRITICAL',
      title: 'Direct Cross-Workstream Conflict: Allergy Record Ingestion vs Empty Panel Mandate',
      blast_radius_score: 98,
      citations: [
        {
          file: 'FDS-DM-04_Allergy_Data_Migration.md',
          line: 25,
          verbatim_excerpt: 'All migrated allergy records shall be rendered immediately visible and active in the Aurora Allergy & Intolerance clinical summary panel upon initial user login at go-live.',
          verified: true
        },
        {
          file: 'FDS-CLIN-11_Allergy_Capture_At_First_Appointment.md',
          line: 16,
          verbatim_excerpt: 'The Aurora Allergy & Intolerance clinical summary panel shall be unpopulated and empty at go-live for all migrated patients to ensure unverified legacy data does not compromise acute prescribing decisions.',
          verified: true
        },
        {
          file: 'FDS-CLIN-11_Allergy_Capture_At_First_Appointment.md',
          line: 19,
          verbatim_excerpt: 'Legacy allergy data must never populate a clinical field because the Clinical Safety Group ruled it unsafe for prescribing due to inconsistent coding and unverified dosage thresholds in legacy PAS.',
          verified: true
        }
      ],
      why_incompatible: 'Functional Design Specification FDS-DM-04 mandates 1.4 million legacy allergy records populate the active clinical panel at cutover, whereas Functional Design Specification FDS-CLIN-11 (approved 5 weeks later by Clinical Safety Group) strictly mandates the panel remain empty at go-live because legacy data was deemed clinically hazardous for electronic prescribing.',
      consequence: 'Catastrophic patient safety hazard or migration abort: Either 1.4M unverified records flood the prescriber screen triggering dangerous clinical interactions, or clinicians operate under the assumption that allergy histories are present when the panel was suppressed, violating clinical safety standards.'
    },
    {
      id: 'F-02',
      type: 'VERBAL_OVERRIDE',
      severity: 'HIGH',
      title: 'Unpropagated Verbal Override: Free-Text Severity Derivation Cancelled in Chat and CSV but Approved in Functional Design Specification FDS-DM-04',
      blast_radius_score: 85,
      citations: [
        {
          file: 'Teams_Export_DataMigration_Channel.txt',
          line: 2,
          verbatim_excerpt: 'We can\'t derive severity from free text, it\'s a prescribing risk.',
          verified: true
        },
        {
          file: 'DM_Field_Mapping_v7.csv',
          line: 7,
          verbatim_excerpt: 'SEVERITY_CODE,AUR_SEVERITY_LEVEL,N,Do not migrate - free text derivation cancelled by Pharmacy SME,M. Brody,26-Feb-2026',
          verified: true
        },
        {
          file: 'FDS-DM-04_Allergy_Data_Migration.md',
          line: 28,
          verbatim_excerpt: 'Allergy severity classifications (Mild, Moderate, Severe, Life-Threatening) shall be algorithmically inferred from legacy free-text clinical notes and mapped into Aurora Severity tiers using regex keyword extraction.',
          verified: true
        }
      ],
      why_incompatible: 'Pharmacy SME Marcus Brody verbally cancelled severity derivation in Teams chat on 24 Feb and modified CSV Row 6 to Migrate=N on 26 Feb. However, approved Functional Design Specification FDS-DM-04 still contains active requirement DM-04-R04 mandating regex derivation, creating divergence between architectural documentation and ETL implementation.',
      consequence: 'ETL developer ambiguity and audit failure: ETL engineers referencing Functional Design Specification FDS-DM-04 will build regex derivation parsers while mapping technicians suppress the field. The authoritative source of truth is currently an informal Teams message.'
    },
    {
      id: 'F-03',
      type: 'ORPHAN_DEPENDENCY',
      severity: 'MEDIUM',
      title: 'Orphan Dependency: Ward-Code Location Transformation in CSV without Governing Functional Design Specification',
      blast_radius_score: 62,
      citations: [
        {
          file: 'DM_Field_Mapping_v7.csv',
          line: 13,
          verbatim_excerpt: '12,WARD_LOCATION_CODE,AUR_CARE_SETTING_ID,Y,Direct lookup pending Ward Master ref,M. Brody,25-Feb-2026',
          verified: true
        },
        {
          file: 'Teams_Export_DataMigration_Channel.txt',
          line: 8,
          verbatim_excerpt: 'Also noticed Row 12 has a dependency on ward-code mapping from the legacy PAS, but there is no approved design document for ward-level location translation.',
          verified: true
        }
      ],
      why_incompatible: 'Field mapping CSV row 12 marks WARD_LOCATION_CODE as active for migration with a dependency on Ward Master references, but no Functional Design Specification specifies the translation rules or lookup fallbacks.',
      consequence: 'Runtime ETL transformation failure on inpatient records with unmapped historical ward codes, causing allergy entries to reject or attach to invalid clinical care settings.'
    },
    {
      id: 'F-04',
      type: 'GOVERNANCE_GAP',
      severity: 'LOW',
      title: 'Unowned Governance Action: Functional Design Specification FDS-DM-04 Version Bump Omitted After Cancelled Walkthrough',
      blast_radius_score: 41,
      citations: [
        {
          file: 'Teams_Export_DataMigration_Channel.txt',
          line: 6,
          verbatim_excerpt: 'The scheduled joint walkthrough for Wednesday is cancelled due to the trust board meeting, so we will skip formal minuting for now.',
          verified: true
        },
        {
          file: 'Teams_Export_DataMigration_Channel.txt',
          line: 7,
          verbatim_excerpt: 'Note that DM-04 needs a version bump to reflect the severity cancellation before the final sign-off audit.',
          verified: true
        },
        {
          file: 'Teams_Export_DataMigration_Channel.txt',
          line: 11,
          verbatim_excerpt: 'Not yet, everyone is flat out on the cutover dry run. We\'ll pick up doc updates post-dry run.',
          verified: true
        }
      ],
      why_incompatible: 'Joint stakeholder walkthrough was cancelled, resulting in informal agreement to postpone formal documentation changes. No change request was raised or assigned to update Functional Design Specification FDS-DM-04 before dry run execution.',
      consequence: 'Audit non-compliance during regulatory cutover readiness gate and risk of regression in subsequent migration iterations.'
    }
  ],
  agenda: [
    {
      finding_id: 'F-01',
      question_to_be_asked: 'Should historical allergy data be populated into Aurora at cutover (FDS-DM-04) or held in an unpopulated state pending clinical point-of-care reconciliation (FDS-CLIN-11)?',
      required_attendees: [
        'Dr. Fiona Gallagher (Clinical Safety Officer)',
        'Prof. Alistair Finch (Medical Director)',
        'David Vance (Lead Migration Architect)',
        'Sarah Jenkins (Migration Workstream Lead)',
        'Dr. Eleanor Vance (Pharmacy Lead)'
      ],
      evidence_pack: [
        'FDS-DM-04_Allergy_Data_Migration.md (Lines 19-25)',
        'FDS-CLIN-11_Allergy_Capture_At_First_Appointment.md (Lines 15-22)',
        'Clinical Safety Case Review CSG-2026-08'
      ],
      time_box_minutes: 30,
      downstream_milestone_impact: 'Milestone M4: Dry Run 2 ETL Script Freeze (due 03-Mar-2026) — slips 2 weeks if ETL scope is not locked.'
    },
    {
      finding_id: 'F-02',
      question_to_be_asked: 'Formally ratify the cancellation of algorithmic severity derivation (DM-04-R04) and authorise CR-DM-104 to update Functional Design Specification FDS-DM-04 to match DM_Field_Mapping_v7 Row 6.',
      required_attendees: [
        'David Vance (Lead Migration Architect)',
        'Marcus Brody (Pharmacy SME)',
        'Dr. Eleanor Vance (Pharmacy Lead)',
        'Arthur Pendelton (Solution Assurance SME)'
      ],
      evidence_pack: [
        'DM_Field_Mapping_v7.csv (Row 6)',
        'Teams #migration-stream-allergy Chat Log (24-Feb-2026)',
        'FDS-DM-04 Section 3.4'
      ],
      time_box_minutes: 15,
      downstream_milestone_impact: 'Milestone M5: ePMA Prescribing Rules Sign-off (due 08-Mar-2026) — blocks pharmacy validation.'
    },
    {
      finding_id: 'F-03',
      question_to_be_asked: 'Who is accountable for producing the Ward Location Code Translation specification, and can legacy ward codes default to a generic Trust Facility code?',
      required_attendees: [
        'David Vance (Migration Architect)',
        'Marcus Brody (Pharmacy SME)',
        'PAS Legacy Technical Lead'
      ],
      evidence_pack: [
        'DM_Field_Mapping_v7.csv (Row 12)',
        'CareTrak PAS Ward Master Dictionary v4'
      ],
      time_box_minutes: 15,
      downstream_milestone_impact: 'Milestone M4.2: Inpatient Staging Load Validation (due 05-Mar-2026).'
    },
    {
      finding_id: 'F-04',
      question_to_be_asked: 'Assign formal ownership to raise and approve Change Request CR-DM-104 for Functional Design Specification FDS-DM-04 prior to the Cutover Readiness Assessment.',
      required_attendees: [
        'Sarah Jenkins (Migration Workstream Lead)',
        'David Vance (Migration Architect)',
        'Arthur Pendelton (Assurance SME)'
      ],
      evidence_pack: [
        'Teams #migration-stream-allergy Chat Log (24-Feb-2026)',
        'FDS-DM-04 Version Control Table'
      ],
      time_box_minutes: 10,
      downstream_milestone_impact: 'Milestone M6: Cutover Governance Audit (due 15-Mar-2026).'
    }
  ]
};

