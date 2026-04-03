import nodemailer from 'nodemailer';
import { logger } from './logger';

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

function validateEmailConfig(): { isValid: boolean; error?: string } {
  if (!process.env.SMTP_HOST) {
    return { isValid: false, error: 'SMTP_HOST not configured' };
  }
  if (!process.env.SMTP_USER) {
    return { isValid: false, error: 'SMTP_USER not configured' };
  }
  if (!process.env.SMTP_PASSWORD) {
    return { isValid: false, error: 'SMTP_PASSWORD not configured' };
  }
  return { isValid: true };
}

export async function sendEmail(
  to: string,
  subject: string,
  htmlContent: string,
  textContent: string
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  console.log('📧 Email Debug - Starting send process...');
  console.log('📬 Target email:', to);
  console.log('📝 Subject:', subject);

  const validation = validateEmailConfig();

  if (!validation.isValid) {
    const errorMsg = `Email service not configured: ${validation.error}`;
    console.log('❌ Email Config Error:', errorMsg);
    logger.warn(errorMsg);
    return { success: false, error: validation.error };
  }

  console.log('✅ Email config validation passed');

  const transporter = createTransporter();
  if (!transporter) {
    return { success: false, error: 'Failed to create email transporter' };
  }

  try {
    const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER;
    const info = await transporter.sendMail({
      from: `"Autopesu Kiilto & Loisto" <${fromEmail}>`,
      to,
      subject,
      text: textContent,
      html: htmlContent,
    });

    logger.info('Email sent successfully', {
      to,
      subject,
      messageId: info.messageId,
      timestamp: new Date().toISOString()
    });

    console.log('✅ Email sent successfully:', info.messageId);

    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error: any) {
    const errorMsg = `Failed to send email to ${to}`;
    logger.error(errorMsg, {
      error: error.message,
      code: error.code,
      response: error.response
    });

    console.log('❌ Email send failed:', error.message);

    return { success: false, error: error.message };
  }
}

export async function sendBookingConfirmationEmail(
  to: string,
  booking: any,
  loyaltyInfo?: any
): Promise<{ success: boolean; error?: string }> {
  try {
    const emailTemplate = (await import('./email-templates')).bookingConfirmationTemplate(booking, loyaltyInfo);

    return await sendEmail(
      to,
      emailTemplate.subject,
      emailTemplate.html,
      emailTemplate.text
    );
  } catch (error: any) {
    console.error('Error sending booking confirmation email:', error);
    return { success: false, error: error.message };
  }
}
