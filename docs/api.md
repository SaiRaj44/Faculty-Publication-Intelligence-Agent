# Publications API Documentation

Base Path: `/api/publications`
Authentication: Requires an active NextAuth session cookie.

## 1. List Publications
\`GET /api/publications\`

Fetches a paginated list of publications for the authenticated user's institution. Filters automatically apply based on the user's role (e.g. Faculty only see their own).

**Query Parameters:**
- \`page\` (optional, default: 1): The page number.
- \`limit\` (optional, default: 10): Items per page.
- \`status\` (optional): Filter by publication status (e.g., PENDING, APPROVED).
- \`year\` (optional): Filter by publication year.

**Response (200 OK):**
\`\`\`json
{
  "data": [...],
  "meta": {
    "total": 45,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
\`\`\`

## 2. Create Publication
\`POST /api/publications\`

Creates a new publication record and queues it for background enrichment/validation.

**Body (JSON):**
\`\`\`json
{
  "title": "Required string",
  "doi": "Optional string",
  "year": 2024,
  "authors": ["Author 1", "Author 2"],
  "journalName": "String",
  "publicationType": "INTERNATIONAL_JOURNAL",
  "facultyId": "Optional (will default to session user if applicable)"
}
\`\`\`

**Response (201 Created):**
\`\`\`json
{
  "data": { ...publication record },
  "message": "Publication created and queued for enrichment"
}
\`\`\`

## 3. Get Single Publication
\`GET /api/publications/[id]\`

Fetches detailed metadata, validation results, and AI enrichment history for a specific publication.

## 4. Update Publication
\`PATCH /api/publications/[id]\`

Updates a publication. Primarily used by Server Actions to transition statuses (e.g., Approve or Reject).

**Body (JSON):**
\`\`\`json
{
  "status": "APPROVED"
}
\`\`\`
