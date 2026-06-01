import { 
  Publication, 
  Faculty, 
  Department, 
  PublicationMetadata, 
  ValidationResult,
  UserRole,
  PublicationType,
  Quartile,
  PublicationStatus,
  Institution,
  User,
  BatchJobStatus,
  ReportType,
  ReportFormat
} from '@prisma/client';

export { 
  UserRole,
  PublicationType,
  Quartile,
  PublicationStatus,
  BatchJobStatus,
  ReportType,
  ReportFormat
};

// ============================================================================
// Database Relational Types
// ============================================================================

export interface PublicationWithRelations extends Publication {
  faculty: Faculty | null;
  department: Department | null;
  institution: Institution;
  metadata: PublicationMetadata[];
  validationResult: ValidationResult | null;
  submittedBy: User | null;
}

export interface FacultyWithRelations extends Faculty {
  department: Department;
  institution: Institution;
  user: User | null;
}

export interface FacultyWithPublications extends FacultyWithRelations {
  publications: Publication[];
}

export interface DepartmentWithRelations extends Department {
  institution: Institution;
  headFaculty: Faculty | null;
}

// ============================================================================
// Service Layer Types
// ============================================================================

export interface EnrichmentResult {
  doi?: string;
  title?: string;
  authors?: string[];
  year?: number;
  month?: number;
  journal?: string;
  conference?: string;
  publisher?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  issn?: string;
  isbn?: string;
  url?: string;
  abstract?: string;
  citationCount?: number;
  quartile?: Quartile;
  impactFactor?: number;
  isIndexed?: boolean;
  indexingDbs?: string[];
  confidence: number; // 0-100
  source: 'CROSSREF' | 'SCOPUS' | 'SCHOLAR' | 'CORE' | 'MANUAL';
  rawResponse?: any;
}

export interface ValidationIssue {
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  suggestion?: string;
}

export interface DuplicateRecord {
  id: string;
  title: string;
  similarity: number; // 0-100
}

export interface ValidationReport {
  publicationId: string;
  overallScore: number; // 0-100
  isValid: boolean;
  issues: ValidationIssue[];
  suggestions: { field: string; originalValue: any; suggestedValue: any; reason: string }[];
  duplicates: DuplicateRecord[];
  agentResponse?: string;
}

export interface BatchRowError {
  row: number;
  column?: string;
  message: string;
}

export interface BatchUploadResult {
  jobId: string;
  totalRows: number;
  successCount: number;
  errorCount: number;
  errors: BatchRowError[];
}

export interface ReportConfig {
  type: ReportType;
  format: ReportFormat;
  institutionId: string;
  departmentId?: string;
  facultyId?: string;
  fromDate?: Date;
  toDate?: Date;
  filters?: Record<string, any>;
}

// ============================================================================
// External API Types
// ============================================================================

export interface ScopusResult {
  eid: string;
  doi?: string;
  title: string;
  authors: string[];
  year: number;
  journal?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  citationCount: number;
  subjectAreas: string[];
  quartile?: string;
  isOpenAccess: boolean;
  affiliation: string[];
}

export interface ScopusAuthorMetrics {
  authorId: string;
  hIndex: number;
  citationCount: number;
  documentCount: number;
}

export interface ScholarResult {
  title: string;
  authors: string[];
  year?: number;
  venue?: string;
  citedBy: number;
  url?: string;
  snippet?: string;
}

export interface ScholarMetrics {
  citationCount: number;
  hIndex5y: number;
  i10Index: number;
}

export interface CORERankingResult {
  title: string;
  rank: 'A*' | 'A' | 'B' | 'C' | 'Unranked';
  source: string;
  year?: number;
  acronym?: string;
  publisher?: string;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface DashboardStats {
  totalPublications: number;
  pendingValidation: number;
  thisYear: number;
  totalCitations: number;
  byType: Array<{ type: string; count: number }>;
  byYear: Array<{ year: number; count: number }>;
  byQuartile: Array<{ quartile: string; count: number }>;
  topFaculty: Array<{ name: string; id: string; count: number }>;
  recentPublications: Array<{ id: string; title: string; year: number; status: string; type: string }>;
}

export interface StorageFile {
  path: string;
  url: string;
  size: number;
  mimeType: string;
}

export interface QueueJobStatus {
  jobId: string;
  status: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed' | 'paused';
  progress: number;
  result?: any;
  error?: string;
}
