import axios from 'axios';
import { CORERankingResult } from '@/types';

class CoreRankingService {
  private baseUrl = 'https://portal.core.edu.au/conf-ranks';

  // Sample built-in knowledge for major CS venues
  private readonly BUNDLED_VENUES: Record<string, CORERankingResult> = {
    'cvpr': { title: 'IEEE/CVF Conference on Computer Vision and Pattern Recognition', rank: 'A*', source: 'CORE2023', acronym: 'CVPR' },
    'iccv': { title: 'International Conference on Computer Vision', rank: 'A*', source: 'CORE2023', acronym: 'ICCV' },
    'neurips': { title: 'Neural Information Processing Systems', rank: 'A*', source: 'CORE2023', acronym: 'NeurIPS' },
    'icml': { title: 'International Conference on Machine Learning', rank: 'A*', source: 'CORE2023', acronym: 'ICML' },
    'acl': { title: 'Association for Computational Linguistics', rank: 'A*', source: 'CORE2023', acronym: 'ACL' },
    'ieee tpami': { title: 'IEEE Transactions on Pattern Analysis and Machine Intelligence', rank: 'A*', source: 'CORE2023', acronym: 'TPAMI' },
    'nature': { title: 'Nature', rank: 'A*', source: 'CORE2023' },
    'science': { title: 'Science', rank: 'A*', source: 'CORE2023' },
    'aaai': { title: 'AAAI Conference on Artificial Intelligence', rank: 'A*', source: 'CORE2023', acronym: 'AAAI' },
    'ijcai': { title: 'International Joint Conference on Artificial Intelligence', rank: 'A*', source: 'CORE2023', acronym: 'IJCAI' },
    'sigmod': { title: 'ACM SIGMOD International Conference on Management of Data', rank: 'A*', source: 'CORE2023', acronym: 'SIGMOD' },
    'vldb': { title: 'International Conference on Very Large Data Bases', rank: 'A*', source: 'CORE2023', acronym: 'VLDB' },
    'sosp': { title: 'ACM Symposium on Operating Systems Principles', rank: 'A*', source: 'CORE2023', acronym: 'SOSP' },
    'osdi': { title: 'USENIX Symposium on Operating Systems Design and Implementation', rank: 'A*', source: 'CORE2023', acronym: 'OSDI' },
    'asplos': { title: 'Architectural Support for Programming Languages and Operating Systems', rank: 'A*', source: 'CORE2023', acronym: 'ASPLOS' },
    'ccs': { title: 'ACM Conference on Computer and Communications Security', rank: 'A*', source: 'CORE2023', acronym: 'CCS' },
    's&p': { title: 'IEEE Symposium on Security and Privacy', rank: 'A*', source: 'CORE2023', acronym: 'S&P' },
    'usenix security': { title: 'USENIX Security Symposium', rank: 'A*', source: 'CORE2023' },
    'kdd': { title: 'Knowledge Discovery and Data Mining', rank: 'A*', source: 'CORE2023', acronym: 'KDD' },
    'www': { title: 'The Web Conference', rank: 'A*', source: 'CORE2023', acronym: 'WWW' },
  };

  private searchBundled(query: string): CORERankingResult | null {
    if (!query) return null;
    const lowerQuery = query.toLowerCase().trim();
    
    // Direct acronym match
    if (this.BUNDLED_VENUES[lowerQuery]) {
      return this.BUNDLED_VENUES[lowerQuery];
    }

    // Fuzzy title match
    for (const key in this.BUNDLED_VENUES) {
      const venue = this.BUNDLED_VENUES[key];
      if (venue.title.toLowerCase().includes(lowerQuery) || lowerQuery.includes(venue.title.toLowerCase())) {
        return venue;
      }
    }

    return null;
  }

  async lookupConferenceRank(conferenceName: string, acronym?: string): Promise<CORERankingResult | null> {
    // 1. Try bundled data first
    const bundledResult = this.searchBundled(acronym || conferenceName);
    if (bundledResult) return bundledResult;

    // 2. Fallback to API/Scrape if configured
    try {
      const query = acronym || conferenceName;
      if (!query) return null;

      // Note: CORE doesn't have a public JSON API without an account, so we'd normally scrape or use a provided API key.
      // This is a placeholder for actual API call.
      if (process.env.CORE_API_KEY) {
        const response = await axios.get(`https://api.core.edu.au/v1/conferences/search`, {
          params: { query },
          headers: { 'Authorization': `Bearer ${process.env.CORE_API_KEY}` }
        });
        
        if (response.data?.items?.length > 0) {
          const item = response.data.items[0];
          return {
            title: item.title,
            rank: item.rank,
            source: `CORE${item.year}`,
            acronym: item.acronym,
          };
        }
      } else {
        console.warn(`[CORE] No API key. Could not find ranking for "${query}"`);
      }
      return null;
    } catch (error) {
      console.error(`[CORE] Error searching rank for ${conferenceName}:`, error);
      return null;
    }
  }

  async lookupJournalRank(journalName: string, issn?: string): Promise<CORERankingResult | null> {
    // Similar to conference logic but hitting journal endpoints
    const bundledResult = this.searchBundled(journalName);
    if (bundledResult) return bundledResult;

    return null;
  }
}

export const coreRankingService = new CoreRankingService();
