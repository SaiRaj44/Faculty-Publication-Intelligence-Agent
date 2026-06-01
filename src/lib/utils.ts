import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import crypto from "crypto";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined, formatStr = "MMM d, yyyy") {
  if (!date) return "N/A";
  const d = new Date(date);
  return isNaN(d.getTime()) ? "Invalid Date" : format(d, formatStr);
}

export function formatNumber(num: number | null | undefined) {
  if (num === null || num === undefined) return "0";
  return new Intl.NumberFormat("en-IN").format(num);
}

export function generateApiKey(): string {
  return `fpi_${crypto.randomBytes(32).toString('hex')}`;
}

export function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

export function extractDOI(text: string): string | null {
  if (!text) return null;
  // Match 10.XXXX/....
  const match = text.match(/10\.\d{4,9}\/[-._;()/:A-Z0-9]+/i);
  return match ? match[0] : null;
}

export function isValidDOI(doi: string): boolean {
  return /^10\.\d{4,9}\/[-._;()/:A-Z0-9]+$/i.test(doi);
}

export function calculateConfidenceScore(fields: Record<string, any>): number {
  let score = 0;
  if (fields.doi) score += 20;
  if (fields.title) score += 15;
  if (fields.authors && fields.authors.length > 0) score += 15;
  if (fields.year) score += 10;
  if (fields.journal || fields.conference) score += 15;
  if (fields.citationCount !== undefined) score += 10;
  if (fields.publisher) score += 10;
  if (fields.quartile && fields.quartile !== 'NA') score += 5;
  return Math.min(100, score);
}

export function truncate(text: string, length: number): string {
  if (!text || text.length <= length) return text || '';
  return text.substring(0, length) + '...';
}
