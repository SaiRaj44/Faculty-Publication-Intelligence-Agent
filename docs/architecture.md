# Faculty Publication Intelligence Agent - Architecture

This document provides a high-level overview of the architectural design and technology stack for the Faculty Publication Intelligence Agent.

## Technology Stack

- **Frontend**: Next.js 15+ (App Router), React 19, Tailwind CSS v4
- **Backend API**: Next.js Server Actions & Route Handlers
- **Database**: PostgreSQL (managed via Prisma ORM)
- **Background Tasks**: BullMQ (backed by Redis)
- **Authentication**: NextAuth.js (Session based JWTs)
- **AI Integration**: Google Gemini (`@google/generative-ai`) via `src/agents/`

## Core Systems

### 1. The Publication Ingestion Pipeline
Publications can be ingested via manual entry, DOI lookups, or bulk CSV uploads.
- **Enrichment Agent**: When a DOI is provided, the `enrichmentAgent.ts` leverages Gemini 1.5 Flash to automatically parse and structure missing metadata fields.

### 2. The Validation Pipeline
When a publication is added to the system, it enters the `PENDING` state.
- **Validation Agent**: The `validationAgent.ts` acts as an automated reviewer. It scans the publication for red flags (e.g., predatory journals, mismatched author data, anomalous publication volumes).
- If flagged, it enters `FLAGGED` state for manual review. Otherwise, it proceeds to the dashboard for human HOD/Admin approval.

### 3. Role-Based Access Control (RBAC)
- **FACULTY**: Can only view and submit their own publications.
- **HOD**: Can view and approve/reject publications for their entire department.
- **INSTITUTION_ADMIN**: Has global oversight over the institution's data.
RBAC logic is enforced dynamically within the Next.js Server Components and Prisma queries.

### 4. Background Processing (BullMQ & Redis)
Heavy tasks (like AI Metadata Enrichment via Gemini or processing a batch CSV of 500 publications) are offloaded to BullMQ queues. 
- **`workers/` Directory**: Contains standalone Node.js scripts (e.g., `enrichmentWorker.ts`) that connect directly to Redis and continuously process queue jobs in the background, keeping the Next.js API completely non-blocking and snappy.
- **`scripts/` Directory**: Contains utility scripts, such as `start-workers.ts`, which are used to easily spin up all background queues (e.g., via `npm run workers`).
