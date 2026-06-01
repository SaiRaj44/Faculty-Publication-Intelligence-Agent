import axios from 'axios';
import { ScopusResult, ScopusAuthorMetrics } from '@/types';

interface ScopusAdapter {
  searchByDOI(doi: string): Promise<ScopusResult | null>;
  searchByTitle(title: string, year?: number): Promise<ScopusResult[]>;
  getAuthorMetrics(authorId: string): Promise<ScopusAuthorMetrics | null>;
  getCitationCount(doi: string): Promise<number>;
}

class MockScopusAdapter implements ScopusAdapter {
  constructor() {
    console.warn('[SCOPUS] Using mock adapter. Set SCOPUS_API_KEY for real data.');
  }

  private generateMockResult(doi?: string, title?: string): ScopusResult {
    // Generate deterministic but fake data based on inputs
    const baseNum = (doi || title || 'random').length;
    
    return {
      eid: `2-s2.0-${80000000000 + baseNum}`,
      doi,
      title: title || 'Mocked Publication Title',
      authors: ['Mock, A.', 'Fake, B.'],
      year: 2023,
      journal: 'Journal of Mocked Research',
      volume: '10',
      issue: '2',
      pages: '100-110',
      citationCount: (baseNum * 3) % 150,
      subjectAreas: ['Computer Science', 'Artificial Intelligence'],
      quartile: baseNum % 2 === 0 ? 'Q1' : 'Q2',
      isOpenAccess: baseNum % 2 === 0,
      affiliation: ['Demo University'],
    };
  }

  async searchByDOI(doi: string): Promise<ScopusResult | null> {
    if (!doi) return null;
    return this.generateMockResult(doi, undefined);
  }

  async searchByTitle(title: string, year?: number): Promise<ScopusResult[]> {
    if (!title) return [];
    return [this.generateMockResult(undefined, title)];
  }

  async getAuthorMetrics(authorId: string): Promise<ScopusAuthorMetrics | null> {
    return {
      authorId,
      hIndex: 12,
      citationCount: 450,
      documentCount: 35,
    };
  }

  async getCitationCount(doi: string): Promise<number> {
    if (!doi) return 0;
    return (doi.length * 3) % 150;
  }
}

class LiveScopusAdapter implements ScopusAdapter {
  private apiKey: string;
  private baseUrl = 'https://api.elsevier.com/content';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private getHeaders() {
    return {
      'X-ELS-APIKey': this.apiKey,
      'Accept': 'application/json',
    };
  }

  async searchByDOI(doi: string): Promise<ScopusResult | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/search/scopus`, {
        params: { query: `DOI(${doi})` },
        headers: this.getHeaders(),
      });

      const entries = response.data?.['search-results']?.entry;
      if (!entries || entries.length === 0) return null;

      const item = entries[0];
      return this.mapToResult(item);
    } catch (error) {
      console.error(`[Scopus] Error looking up DOI ${doi}:`, error);
      return null;
    }
  }

  async searchByTitle(title: string, year?: number): Promise<ScopusResult[]> {
    try {
      let query = `TITLE("${title}")`;
      if (year) {
        query += ` AND PUBYEAR IS ${year}`;
      }

      const response = await axios.get(`${this.baseUrl}/search/scopus`, {
        params: { query },
        headers: this.getHeaders(),
      });

      const entries = response.data?.['search-results']?.entry;
      if (!entries) return [];

      return entries.map(this.mapToResult);
    } catch (error) {
      console.error(`[Scopus] Error searching title ${title}:`, error);
      return [];
    }
  }

  async getAuthorMetrics(authorId: string): Promise<ScopusAuthorMetrics | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/author/author_id/${authorId}`, {
        headers: this.getHeaders(),
      });
      
      const coreData = response.data?.['author-retrieval-response']?.[0]?.coredata;
      if (!coreData) return null;

      return {
        authorId,
        hIndex: parseInt(coreData['h-index'] || '0', 10),
        citationCount: parseInt(coreData['citation-count'] || '0', 10),
        documentCount: parseInt(coreData['document-count'] || '0', 10),
      };
    } catch (error) {
      console.error(`[Scopus] Error fetching author ${authorId}:`, error);
      return null;
    }
  }

  async getCitationCount(doi: string): Promise<number> {
    const result = await this.searchByDOI(doi);
    return result?.citationCount || 0;
  }

  private mapToResult(item: any): ScopusResult {
    let year = new Date().getFullYear();
    if (item['prism:coverDate']) {
      year = new Date(item['prism:coverDate']).getFullYear();
    }

    return {
      eid: item.eid,
      doi: item['prism:doi'],
      title: item['dc:title'],
      authors: item['dc:creator'] ? [item['dc:creator']] : [], // Simplified
      year,
      journal: item['prism:publicationName'],
      volume: item['prism:volume'],
      issue: item['prism:issueIdentifier'],
      pages: item['prism:pageRange'],
      citationCount: parseInt(item['citedby-count'] || '0', 10),
      subjectAreas: [], // Requires separate API call for full abstract
      isOpenAccess: item.openaccess === '1',
      affiliation: item.affiliation ? item.affiliation.map((a: any) => a.affilname) : [],
    };
  }
}

export const getScopusAdapter = (): ScopusAdapter => {
  const apiKey = process.env.SCOPUS_API_KEY;
  if (apiKey) {
    return new LiveScopusAdapter(apiKey);
  }
  return new MockScopusAdapter();
};

export const scopusService = getScopusAdapter();
