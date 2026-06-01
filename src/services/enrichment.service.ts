import { prisma } from '@/lib/prisma';
import { crossrefService } from './crossref.service';
import { scopusService } from './scopus.service';
import { scholarService } from './scholar.service';
import { coreRankingService } from './core-ranking.service';
import { EnrichmentResult, PublicationStatus, Quartile } from '@/types';
import { extractDOI, isValidDOI } from '@/lib/utils';
import { Publication } from '@prisma/client';

class EnrichmentService {
  
  async enrichPublication(publicationId: string): Promise<Publication | null> {
    const publication = await prisma.publication.findUnique({
      where: { id: publicationId },
      include: { metadata: true }
    });

    if (!publication) throw new Error(`Publication ${publicationId} not found`);

    // Update status to enriching
    await prisma.publication.update({
      where: { id: publicationId },
      data: { status: PublicationStatus.ENRICHING }
    });

    try {
      let enrichedData: EnrichmentResult | null = null;
      let usedDoi = publication.doi;

      // 1. Try to extract DOI if not explicitly set but might be in URL/Abstract
      if (!usedDoi && publication.url) {
        usedDoi = extractDOI(publication.url);
      }

      // 2. Fetch from Crossref & Scopus concurrently if DOI exists
      if (usedDoi && isValidDOI(usedDoi)) {
        const [crossrefData, scopusData] = await Promise.all([
          crossrefService.lookupByDOI(usedDoi),
          scopusService.searchByDOI(usedDoi)
        ]);

        enrichedData = this.mergeResults(crossrefData, scopusData ? this.mapScopusToEnrichment(scopusData) : null);
      } 
      // 3. Fallback to Title Search
      else if (publication.title) {
        const [crossrefResults, scholarResults] = await Promise.all([
          crossrefService.searchByTitle(publication.title, publication.year || undefined),
          scholarService.searchByTitle(publication.title, publication.year || undefined)
        ]);

        const bestCrossref = crossrefResults.length > 0 ? crossrefResults[0] : null;
        const bestScholar = scholarResults.length > 0 ? this.mapScholarToEnrichment(scholarResults[0]) : null;

        enrichedData = this.mergeResults(bestCrossref, bestScholar);
      }

      if (!enrichedData) {
        // Nothing found, send straight to manual validation
        return await prisma.publication.update({
          where: { id: publicationId },
          data: { status: PublicationStatus.PENDING, enrichedAt: new Date() }
        });
      }

      // 4. Get Conference/Journal Rankings (CORE)
      if (enrichedData.conference || publication.conferenceName) {
        const rank = await coreRankingService.lookupConferenceRank(
          enrichedData.conference || publication.conferenceName || ''
        );
        if (rank) {
          enrichedData.quartile = this.mapCoreRankToQuartile(rank.rank);
        }
      }

      // 5. Save Metadata Record
      await prisma.publicationMetadata.create({
        data: {
          publicationId,
          source: enrichedData.source,
          enrichedData: enrichedData as any,
          rawData: enrichedData.rawResponse || {},
          confidence: enrichedData.confidence
        }
      });

      // 6. Update Publication with merged data (preferring enriched data over user input if confidence is high)
      const updateData = this.prepareUpdateData(publication, enrichedData);
      
      return await prisma.publication.update({
        where: { id: publicationId },
        data: {
          ...updateData,
          status: PublicationStatus.PENDING, // Ready for Validation phase
          enrichedAt: new Date(),
        }
      });

    } catch (error) {
      console.error(`[Enrichment] Failed to enrich publication ${publicationId}:`, error);
      // Revert status on failure
      return await prisma.publication.update({
        where: { id: publicationId },
        data: { status: PublicationStatus.PENDING }
      });
    }
  }

  private mergeResults(primary: EnrichmentResult | null, secondary: EnrichmentResult | null): EnrichmentResult | null {
    if (!primary && !secondary) return null;
    if (!primary) return secondary;
    if (!secondary) return primary;

    // Merge, taking fields from both, preferring primary (usually crossref)
    return {
      ...secondary,
      ...primary,
      authors: primary.authors?.length ? primary.authors : secondary.authors,
      citationCount: Math.max(primary.citationCount || 0, secondary.citationCount || 0),
      confidence: Math.max(primary.confidence, secondary.confidence),
      source: primary.confidence >= secondary.confidence ? primary.source : secondary.source,
    };
  }

  private mapScopusToEnrichment(scopus: any): EnrichmentResult {
    return {
      doi: scopus.doi,
      title: scopus.title,
      authors: scopus.authors,
      year: scopus.year,
      journal: scopus.journal,
      volume: scopus.volume,
      issue: scopus.issue,
      pages: scopus.pages,
      citationCount: scopus.citationCount,
      quartile: scopus.quartile as Quartile,
      confidence: 85,
      source: 'SCOPUS',
      rawResponse: scopus
    };
  }

  private mapScholarToEnrichment(scholar: any): EnrichmentResult {
    return {
      title: scholar.title,
      authors: scholar.authors,
      year: scholar.year,
      journal: scholar.venue,
      url: scholar.url,
      citationCount: scholar.citedBy,
      confidence: 60,
      source: 'SCHOLAR',
      rawResponse: scholar
    };
  }

  private mapCoreRankToQuartile(rank: string): Quartile {
    switch(rank) {
      case 'A*':
      case 'A': return Quartile.Q1;
      case 'B': return Quartile.Q2;
      case 'C': return Quartile.Q3;
      default: return Quartile.NA;
    }
  }

  private prepareUpdateData(original: Publication, enriched: EnrichmentResult) {
    // Only overwrite if original is empty OR enriched confidence is very high (>80)
    const overwrite = enriched.confidence > 80;

    return {
      title: (overwrite && enriched.title) ? enriched.title : original.title,
      doi: (overwrite && enriched.doi) ? enriched.doi : original.doi,
      authors: (overwrite && enriched.authors && enriched.authors.length > 0) ? enriched.authors : original.authors,
      year: (overwrite && enriched.year) ? enriched.year : original.year,
      journalName: (overwrite && enriched.journal) ? enriched.journal : original.journalName,
      publisher: (overwrite && enriched.publisher) ? enriched.publisher : original.publisher,
      citationCount: Math.max(original.citationCount, enriched.citationCount || 0),
      quartile: (enriched.quartile && enriched.quartile !== Quartile.NA) ? enriched.quartile : original.quartile,
      isIndexed: true, // If we found it in these DBs, it's indexed
      indexingDbs: ['Crossref', enriched.source].filter(Boolean),
    };
  }
}

export const enrichmentService = new EnrichmentService();
