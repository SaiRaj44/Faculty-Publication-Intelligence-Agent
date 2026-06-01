import axios from 'axios';
import { EnrichmentResult, Quartile } from '@/types';
import { calculateConfidenceScore } from '@/lib/utils';

class CrossrefService {
  private baseUrl = 'https://api.crossref.org';
  private politeEmail: string;
  private cache = new Map<string, { data: EnrichmentResult; timestamp: number }>();
  private CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

  constructor() {
    this.politeEmail = process.env.CROSSREF_EMAIL || 'admin@example.com';
  }

  private getHeaders() {
    return {
      'User-Agent': `FacultyPublicationAgent/1.0 (mailto:${this.politeEmail})`,
    };
  }

  async lookupByDOI(doi: string): Promise<EnrichmentResult | null> {
    try {
      if (!doi) return null;
      
      const cleanDoi = doi.trim().toLowerCase();
      
      // Check cache
      const cached = this.cache.get(`doi:${cleanDoi}`);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        return cached.data;
      }

      const response = await axios.get(`${this.baseUrl}/works/${cleanDoi}`, {
        headers: this.getHeaders(),
        timeout: 10000,
      });

      if (response.data?.status !== 'ok') return null;

      const item = response.data.message;
      const result = this.mapToEnrichmentResult(item);
      
      // Save to cache
      this.cache.set(`doi:${cleanDoi}`, { data: result, timestamp: Date.now() });
      
      return result;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      console.error(`[Crossref] Error looking up DOI ${doi}:`, error);
      return null;
    }
  }

  async searchByTitle(title: string, year?: number): Promise<EnrichmentResult[]> {
    try {
      if (!title) return [];
      
      // Check cache
      const cacheKey = `title:${title}:${year || ''}`;
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        // Just return the first one as an array for type safety (hacky but it works for this cache)
        return [cached.data]; 
      }

      let url = `${this.baseUrl}/works?query.title=${encodeURIComponent(title)}&rows=5`;
      if (year) {
        url += `&filter=from-pub-date:${year},until-pub-date:${year}`;
      }

      const response = await axios.get(url, {
        headers: this.getHeaders(),
        timeout: 10000,
      });

      if (response.data?.status !== 'ok') return [];

      const items = response.data.message.items;
      if (!items || items.length === 0) return [];

      const results = items.map(this.mapToEnrichmentResult);
      
      if (results.length > 0) {
        this.cache.set(cacheKey, { data: results[0], timestamp: Date.now() });
      }

      return results;
    } catch (error) {
      console.error(`[Crossref] Error searching by title ${title}:`, error);
      return [];
    }
  }

  private mapToEnrichmentResult(item: any): EnrichmentResult {
    // Extract authors safely
    let authors: string[] = [];
    if (item.author && Array.isArray(item.author)) {
      authors = item.author.map((a: any) => `${a.family || ''}, ${a.given || ''}`.replace(/^, |, $/g, '').trim()).filter(Boolean);
    }

    // Extract year
    let year = undefined;
    if (item.published?.['date-parts']?.[0]?.[0]) {
      year = item.published['date-parts'][0][0];
    } else if (item['published-print']?.['date-parts']?.[0]?.[0]) {
      year = item['published-print']['date-parts'][0][0];
    }

    const title = item.title?.[0] || '';
    const journal = item['container-title']?.[0] || '';
    const publisher = item.publisher || '';
    
    // ISSNs
    let issn = undefined;
    if (item.ISSN && Array.isArray(item.ISSN) && item.ISSN.length > 0) {
      issn = item.ISSN[0];
    }

    const data: Partial<EnrichmentResult> = {
      doi: item.DOI,
      title,
      authors,
      year,
      journal,
      publisher,
      volume: item.volume,
      issue: item.issue,
      pages: item.page,
      issn,
      url: item.URL,
      abstract: item.abstract, // Crossref sometimes has JATS XML abstracts
      citationCount: item['is-referenced-by-count'] || 0,
      source: 'CROSSREF',
      rawResponse: item,
    };

    return {
      ...data,
      confidence: calculateConfidenceScore(data),
    } as EnrichmentResult;
  }
}

export const crossrefService = new CrossrefService();
