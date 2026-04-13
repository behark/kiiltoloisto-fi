import nodemailer from 'nodemailer';
import sgMail from '@sendgrid/mail';
import { logger } from './logger';
import { siteConfig } from './siteConfig';

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

function validateSendgridConfig(): { isValid: boolean; error?: string } {
  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.SENDER_EMAIL || siteConfig.emailFrom;

  if (!apiKey) {
    return { isValid: false, error: 'SENDGRID_API_KEY not configured' };
  }
  if (!apiKey.startsWith('SG.')) {
    return { isValid: false, error: 'SENDGRID_API_KEY appears invalid' };
  }
  if (!fromEmail?.includes('@')) {
    return { isValid: false, error: 'SENDER_EMAIL not configured properly' };
  }
  return { isValid: true };
}

function bookingBcc(): string | undefined {
  const raw = process.env.BOOKING_BCC_EMAIL?.trim();
  return raw || undefined;
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

  const smtpOk = validateEmailConfig();
  const bcc = bookingBcc();

  if (smtpOk.isValid) {
    console.log('✅ Using SMTP for outbound mail');

    const transporter = createTransporter();
    if (!transporter) {
      return { success: false, error: 'Failed to create email transporter' };
    }

    try {
      const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER;
      const info = await transporter.sendMail({
        from: `"Autopesu Kiilto & Loisto" <${fromEmail}>`,
        to,
        ...(bcc ? { bcc } : {}),
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

      console.log('✅ Email sent successfully (SMTP):', info.messageId);

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

      console.log('❌ SMTP send failed:', error.message);

      return { success: false, error: error.message };
    }
  }

  const sgOk = validateSendgridConfig();
  if (!sgOk.isValid) {
    const errorMsg =
      `Email not configured: SMTP (${smtpOk.error}); SendGrid (${sgOk.error})`;
    console.log('❌ Email Config Error:', errorMsg);
    logger.warn(errorMsg);
    return { success: false, error: errorMsg };
  }

  console.log('✅ Using SendGrid for outbound mail (SMTP not configured)');

  try {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);
    const fromAddr = process.env.SENDER_EMAIL || siteConfig.emailFrom;

    await sgMail.send({
      to,
      from: {
        email: fromAddr,
        name: 'Autopesu Kiilto & Loisto',
      },
      ...(bcc ? { bcc } : {}),
      subject,
      text: textContent,
      html: htmlContent,
    });

    logger.info('Email sent successfully', {
      to,
      subject,
      timestamp: new Date().toISOString()
    });

    console.log('✅ Email sent successfully (SendGrid)');

    return { success: true };
  } catch (error: any) {
    const errorMsg = `Failed to send email to ${to}`;
    logger.error(errorMsg, {
      error: error.message,
      code: error.code,
      response: error.response?.body
    });

    console.log('❌ SendGrid send failed:', error.message);

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

export async function sendBookingNotificationToOwner(
  booking: any
): Promise<{ success: boolean; error?: string }> {
  try {
    const ownerEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER || 'info@kiiltoloisto.fi';
    const emailTemplate = (await import('./email-templates')).adminBookingNotificationTemplate(booking);

    console.log('📧 Sending admin notification to:', ownerEmail);

    return await sendEmail(
      ownerEmail,
      emailTemplate.subject,
      emailTemplate.html,
      emailTemplate.text
    );
  } catch (error: any) {
    console.error('Error sending admin notification email:', error);
    return { success: false, error: error.message };
  }
}
