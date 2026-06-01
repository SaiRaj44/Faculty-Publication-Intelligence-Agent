import { prisma } from '@/lib/prisma';
import { generateStructuredContent } from '@/lib/gemini';
import { storage } from '@/lib/storage';
import { ReportConfig, ReportFormat, ReportType } from '@/types';
import { Publication, Faculty } from '@prisma/client';
// In a real app, use pdfkit or puppeteer for PDF generation, exceljs for Excel.
// We'll mock the actual file generation here, creating text files or mock PDFs.

class ReportService {

  async generateReport(reportId: string, config: ReportConfig): Promise<void> {
    const report = await prisma.report.findUnique({ where: { id: reportId } });
    if (!report) throw new Error(`Report ${reportId} not found`);

    try {
      // 1. Fetch Data
      const data = await this.fetchReportData(config);

      // 2. Generate AI Insights
      const insights = await this.generateInsights(data, config.type);

      // 3. Create File Buffer
      const { buffer, mimeType, extension } = await this.createFileBuffer(data, insights, config);

      // 4. Upload to Storage
      const filename = `report-${report.type}-${Date.now()}.${extension}`;
      const file = await storage.upload(buffer, filename, mimeType, `reports/${report.institutionId}`);

      // 5. Update Report Record
      await prisma.report.update({
        where: { id: reportId },
        data: {
          fileUrl: file.url,
          fileSize: file.size,
        }
      });

    } catch (error) {
      console.error(`[Report] Error generating report ${reportId}:`, error);
      throw error; // Let the queue handle retries
    }
  }

  private async fetchReportData(config: ReportConfig) {
    const whereClause: any = {
      institutionId: config.institutionId,
      status: 'APPROVED', // Only include approved publications
    };

    if (config.departmentId) {
      whereClause.departmentId = config.departmentId;
    }
    if (config.facultyId) {
      whereClause.facultyId = config.facultyId;
    }
    
    if (config.fromDate || config.toDate) {
      whereClause.year = {};
      if (config.fromDate) whereClause.year.gte = new Date(config.fromDate).getFullYear();
      if (config.toDate) whereClause.year.lte = new Date(config.toDate).getFullYear();
    }

    const publications = await prisma.publication.findMany({
      where: whereClause,
      include: {
        faculty: true,
        department: true,
      },
      orderBy: { year: 'desc' }
    });

    const faculties = await prisma.faculty.findMany({
      where: {
        institutionId: config.institutionId,
        ...(config.departmentId ? { departmentId: config.departmentId } : {})
      }
    });

    return { publications, faculties };
  }

  private async generateInsights(data: any, type: ReportType) {
    if (data.publications.length === 0) return "No data available for this period.";

    try {
      const prompt = `
        Analyze this publication data for a ${type} report.
        Total Publications: ${data.publications.length}
        Total Faculty: ${data.faculties.length}
        Provide a 3-paragraph executive summary highlighting trends, strengths, and areas for improvement.
        Format as plain text.
      `;
      
      const { generateContent } = await import('@/lib/gemini');
      return await generateContent(prompt, "You are a senior academic analyst.");
    } catch (e) {
      return "Executive summary could not be generated at this time.";
    }
  }

  private async createFileBuffer(data: any, insights: string, config: ReportConfig) {
    // This is a placeholder for actual PDF/Excel generation logic
    let content = `REPORT: ${config.type}\n`;
    content += `==========================================\n\n`;
    content += `EXECUTIVE SUMMARY\n`;
    content += `${insights}\n\n`;
    content += `==========================================\n`;
    content += `PUBLICATIONS LIST (${data.publications.length})\n\n`;
    
    for (const pub of data.publications) {
      content += `- [${pub.year}] ${pub.title}\n`;
      content += `  Authors: ${pub.authors.join(', ')}\n`;
      content += `  Journal: ${pub.journalName || pub.conferenceName}\n`;
      content += `  Citations: ${pub.citationCount} | Quartile: ${pub.quartile}\n\n`;
    }

    const buffer = Buffer.from(content, 'utf-8');

    if (config.format === ReportFormat.PDF) {
      return { buffer, mimeType: 'text/plain', extension: 'txt' }; // MOCKED as TXT for now
    } else if (config.format === ReportFormat.EXCEL) {
      return { buffer, mimeType: 'text/csv', extension: 'csv' }; // MOCKED as CSV
    }
    
    return { buffer, mimeType: 'text/plain', extension: 'txt' };
  }
}

export const reportService = new ReportService();
