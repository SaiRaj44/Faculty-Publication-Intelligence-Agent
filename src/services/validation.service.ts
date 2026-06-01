import { prisma } from '@/lib/prisma';
import { generateStructuredContent } from '@/lib/gemini';
import { sendValidationAlertEmail } from '@/lib/email';
import { ValidationReport, ValidationIssue, PublicationStatus } from '@/types';

class ValidationService {

  async validatePublication(publicationId: string): Promise<ValidationReport> {
    const publication = await prisma.publication.findUnique({
      where: { id: publicationId },
      include: { 
        faculty: { include: { user: true } },
        metadata: true 
      }
    });

    if (!publication) throw new Error(`Publication ${publicationId} not found`);

    // 1. Basic Rule-Based Validation
    const ruleIssues: ValidationIssue[] = [];
    
    if (!publication.title) {
      ruleIssues.push({ field: 'title', message: 'Title is missing', severity: 'error' });
    }
    
    if (!publication.year) {
      ruleIssues.push({ field: 'year', message: 'Publication year is missing', severity: 'error' });
    } else if (publication.year > new Date().getFullYear() + 1 || publication.year < 1950) {
      ruleIssues.push({ field: 'year', message: `Invalid year: ${publication.year}`, severity: 'error' });
    }

    if (!publication.authors || publication.authors.length === 0) {
      ruleIssues.push({ field: 'authors', message: 'Authors list is empty', severity: 'error' });
    }

    // 2. Duplicate Detection (Basic Levenshtein / Exact Match on Title or DOI)
    const duplicates = await this.findDuplicates(publication);

    // 3. AI-Powered Deep Validation
    let aiValidation: Partial<ValidationReport> = { issues: [], suggestions: [], isValid: true, overallScore: 100 };
    
    try {
      const prompt = `
      Analyze the following academic publication record for inconsistencies, predatory journals, or formatting errors.
      
      Publication Data:
      Title: ${publication.title}
      Authors: ${publication.authors.join(', ')}
      Year: ${publication.year}
      Journal/Conference: ${publication.journalName || publication.conferenceName || 'Unknown'}
      DOI: ${publication.doi || 'None'}
      Publisher: ${publication.publisher || 'Unknown'}
      
      Respond strictly with a JSON object matching this schema:
      {
        "issues": [{"field": string, "message": string, "severity": "error"|"warning"|"info"}],
        "suggestions": [{"field": string, "originalValue": any, "suggestedValue": any, "reason": string}],
        "isValid": boolean,
        "overallScore": number (0-100)
      }
      `;

      aiValidation = await generateStructuredContent<ValidationReport>(
        prompt,
        "You are an expert academic librarian and publication validator. Be strict about predatory journals and malformed citations."
      );
    } catch (error) {
      console.error(`[Validation] AI Validation failed for ${publicationId}:`, error);
      // Proceed with just rule-based validation if AI fails
    }

    // 4. Combine Results
    const combinedIssues = [...ruleIssues, ...(aiValidation.issues || [])];
    const hasErrors = combinedIssues.some(i => i.severity === 'error') || duplicates.length > 0;
    const isValid = !hasErrors && (aiValidation.isValid ?? true);
    
    const report: ValidationReport = {
      publicationId,
      overallScore: aiValidation.overallScore ?? (hasErrors ? 40 : 100),
      isValid,
      issues: combinedIssues,
      suggestions: aiValidation.suggestions || [],
      duplicates
    };

    // 5. Save Validation Result
    await prisma.validationResult.upsert({
      where: { publicationId },
      update: {
        overallScore: report.overallScore,
        isValid: report.isValid,
        issues: report.issues as any,
        suggestions: report.suggestions as any,
        duplicates: report.duplicates as any,
        validatedBy: 'AI',
        validatedAt: new Date()
      },
      create: {
        publicationId,
        overallScore: report.overallScore,
        isValid: report.isValid,
        issues: report.issues as any,
        suggestions: report.suggestions as any,
        duplicates: report.duplicates as any,
        validatedBy: 'AI'
      }
    });

    // 6. Update Publication Status
    const newStatus = isValid ? PublicationStatus.APPROVED : PublicationStatus.FLAGGED;
    await prisma.publication.update({
      where: { id: publicationId },
      data: { 
        status: newStatus,
        validatedAt: new Date(),
        ...(isValid ? { approvedAt: new Date() } : {})
      }
    });

    // 7. Notify if Flagged
    if (newStatus === PublicationStatus.FLAGGED && publication.faculty?.user?.email) {
      // Don't await this, let it run in background
      sendValidationAlertEmail(publication.faculty.user, publication, combinedIssues).catch(console.error);
    }

    return report;
  }

  private async findDuplicates(publication: any) {
    const duplicates = [];

    // Exact DOI match
    if (publication.doi) {
      const doiMatches = await prisma.publication.findMany({
        where: { 
          doi: publication.doi,
          id: { not: publication.id }
        }
      });
      for (const match of doiMatches) {
        duplicates.push({ id: match.id, title: match.title, similarity: 100 });
      }
    }

    // Exact Title match (case insensitive)
    const titleMatches = await prisma.publication.findMany({
      where: {
        title: { equals: publication.title, mode: 'insensitive' },
        id: { not: publication.id }
      }
    });
    for (const match of titleMatches) {
      if (!duplicates.find(d => d.id === match.id)) {
        duplicates.push({ id: match.id, title: match.title, similarity: 95 });
      }
    }

    return duplicates;
  }
}

export const validationService = new ValidationService();
