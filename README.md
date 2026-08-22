# Aurora — Requirements Conflict Engine

Cross-document requirements conflict detection and stakeholder walkthrough agenda generator for large-scale enterprise and healthcare IT migrations.

## The Problem
Large organisations migrating to new platforms decompose complex workflows into hundreds of Functional Design Specifications (FDSs), reviewed over several weeks by separate workstreams. Requirements are scattered across design documents, field mapping spreadsheets, meeting minutes, and chat transcripts. Separately approved documents often contradict each other, and verbal decisions in chat never propagate back into the approved documents.

Aurora reads the entire multi-source requirements corpus at once and synthesizes **the agenda for the next stakeholder walkthrough**: a ranked list of decisions requiring human adjudication, each backed by an immutable line-level evidence trail (`FILENAME:LINENO`).

## Architecture & Provenance Mechanism

```mermaid
flowchart TB
  subgraph LOCAL["ON DEVICE — Extraction Layer"]
    C1[FDS-DM-04 .md]
    C2[FDS-CLIN-11 .md]
    C3[DM_Field_Mapping_v7 .csv]
    C4[Teams_Export_Channel .txt]
    B[Line-Level Provenance Bundler<br/>FILENAME:LINENO| ]
    C1 --> B
    C2 --> B
    C3 --> B
    C4 --> B
  end

  B --> P1[PASS 1 — Requirement Extraction<br/>Normalised objects with file & line]
  P1 --> P2[PASS 2 — Cross-Document Conflict Detection<br/>Ranked by Blast Radius + Citations]
  P2 --> P3[PASS 3 — Stakeholder Walkthrough Agenda<br/>Questions, attendees, timebox, milestones]
  P3 --> UI[Dense 3-Column UI & JSON Export]
```

### Three-Pass Pipeline
1. **Pass 1 — Extraction:** Extracts atomic requirement objects from formal design docs, mapping sheets, and chat transcripts. Chat decisions are treated as first-class requirements.
2. **Pass 2 — Detection:** Reasons simultaneously across the extracted requirements to identify hard contradictions, unpropagated verbal overrides, orphan dependencies, and governance gaps.
3. **Pass 3 — Agenda:** Converts findings into a prioritized walkthrough agenda with the exact question to adjudicate, required attendees by role, evidence packs, time boxes, and slipping milestones.
4. **Programmatic Citation Verification:** Every finding's citations are verified in code against the original corpus lines. Unresolvable citations are rejected.

## Quickstart

### Prerequisites
- Node.js 18+
- Gemini API Key (`GEMINI_API_KEY`)

### Installation
```bash
npm install
```

### Running the Web Application
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

### Running the CLI Analysis Pipeline
```bash
npm run analyse
```
Outputs:
- `out/findings.json`
- `out/requirements.json`
- `out/agenda.json`

## License
MIT License. See [LICENSE](./LICENSE) for details.
