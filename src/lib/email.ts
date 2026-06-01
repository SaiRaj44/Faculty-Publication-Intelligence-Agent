import nodemailer from 'nodemailer';
import { Publication, BatchJob, Report } from '@prisma/client';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const verifyConnection = async () => {
  try {
    await transporter.verify();
    return true;
  } catch (error) {
    console.error('SMTP Connection failed:', error);
    return false;
  }
};

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export const sendEmail = async ({ to, subject, html, text }: SendEmailOptions) => {
  if (!process.env.SMTP_USER) {
    console.warn(`[Email Mock] Would send to ${to}: ${subject}`);
    return;
  }

  return transporter.sendMail({
    from: `"${process.env.APP_NAME || 'Faculty Pub Intelligence'}" <${process.env.SMTP_FROM}>`,
    to,
    subject,
    html,
    text,
  });
};

export const sendWelcomeEmail = async (user: any) => {
  return sendEmail({
    to: user.email,
    subject: `Welcome to ${process.env.APP_NAME || 'Faculty Pub Intelligence'}`,
    html: `
      <h2>Welcome ${user.name}!</h2>
      <p>Your account has been created successfully.</p>
      <p>You can now log in to manage and analyze publications.</p>
    `,
  });
};

export const sendBatchCompleteEmail = async (user: any, jobId: string, stats: any) => {
  return sendEmail({
    to: user.email,
    subject: `Batch Upload Completed - ${stats.successCount} Success`,
    html: `
      <h2>Batch Upload Completed</h2>
      <p>Your batch upload job (ID: ${jobId}) has finished processing.</p>
      <ul>
        <li>Total Records: ${stats.totalRecords}</li>
        <li>Successfully Processed: ${stats.successCount}</li>
        <li>Failed: ${stats.errorCount}</li>
      </ul>
      <p>Log in to view the detailed results.</p>
    `,
  });
};

export const sendValidationAlertEmail = async (user: any, publication: Publication, issues: any[]) => {
  return sendEmail({
    to: user.email,
    subject: `Action Required: Publication Validation Failed`,
    html: `
      <h2>Validation Issues Detected</h2>
      <p>The publication "<strong>${publication.title}</strong>" has validation issues that require your attention.</p>
      <ul>
        ${issues.map(i => `<li>${i.field}: ${i.message}</li>`).join('')}
      </ul>
      <p>Please log in to resolve these issues.</p>
    `,
  });
};

export const sendReportReadyEmail = async (user: any, report: Report, downloadUrl: string) => {
  return sendEmail({
    to: user.email,
    subject: `Your ${report.type} Report is Ready`,
    html: `
      <h2>Report Generated Successfully</h2>
      <p>Your report "<strong>${report.title}</strong>" is ready for download.</p>
      <a href="${downloadUrl}" style="display:inline-block;padding:10px 20px;background-color:#4f46e5;color:white;text-decoration:none;border-radius:5px;">Download Report</a>
    `,
  });
};
