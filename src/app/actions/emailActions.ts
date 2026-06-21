'use server';

import { connectToDatabase } from '@/lib/db';
import { EmailSettings, IEmailSettings } from '@/models/EmailSettings';
import { getCurrentSession } from './authActions';
import { sendEmail, DEFAULT_TEMPLATES } from '@/lib/email';

/**
 * Server Action: Get current email settings, creating/bootstrapping defaults if empty.
 */
export async function getEmailSettingsAction(): Promise<{
  success: boolean;
  settings?: any;
  error?: string;
}> {
  try {
    const session = await getCurrentSession();
    if (!session.isLoggedIn || session.role !== 'admin') {
      return { success: false, error: 'Unauthorized. Administrator access required.' };
    }

    await connectToDatabase();
    let settings = await EmailSettings.findOne({});
    if (!settings) {
      settings = new EmailSettings({
        provider: 'mock',
        fromAddress: 'Golden Crumb <orders@golden-crumb.com>',
        adminAddress: 'admin@golden-crumb.com',
        templates: DEFAULT_TEMPLATES,
      });
      await settings.save();
    }

    // Serialize MongoDB document
    const serialized = {
      _id: settings._id.toString(),
      provider: settings.provider,
      resendApiKey: settings.resendApiKey || '',
      smtpHost: settings.smtpHost || '',
      smtpPort: settings.smtpPort || 587,
      smtpSecure: settings.smtpSecure || false,
      smtpUser: settings.smtpUser || '',
      smtpPass: settings.smtpPass || '',
      fromAddress: settings.fromAddress,
      adminAddress: settings.adminAddress,
      templates: JSON.parse(JSON.stringify(settings.templates)),
    };

    return { success: true, settings: serialized };
  } catch (err) {
    console.error('getEmailSettingsAction error:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Failed to query email settings' };
  }
}

/**
 * Server Action: Update email settings (admin only).
 */
export async function updateEmailSettingsAction(
  payload: any
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getCurrentSession();
    if (!session.isLoggedIn || session.role !== 'admin') {
      return { success: false, error: 'Unauthorized. Administrator access required.' };
    }

    await connectToDatabase();
    let settings = await EmailSettings.findOne({});
    if (!settings) {
      settings = new EmailSettings({});
    }

    settings.provider = payload.provider;
    settings.resendApiKey = payload.resendApiKey;
    settings.smtpHost = payload.smtpHost;
    settings.smtpPort = payload.smtpPort;
    settings.smtpSecure = payload.smtpSecure;
    settings.smtpUser = payload.smtpUser;
    settings.smtpPass = payload.smtpPass;
    settings.fromAddress = payload.fromAddress;
    settings.adminAddress = payload.adminAddress;
    settings.templates = payload.templates;

    await settings.save();
    return { success: true };
  } catch (err) {
    console.error('updateEmailSettingsAction error:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Failed to update email settings' };
  }
}

/**
 * Server Action: Send a test email (admin only).
 */
export async function sendTestEmailAction(
  toAddress: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getCurrentSession();
    if (!session.isLoggedIn || session.role !== 'admin') {
      return { success: false, error: 'Unauthorized. Administrator access required.' };
    }

    if (!toAddress || !toAddress.trim()) {
      return { success: false, error: 'Recipient email address is required.' };
    }

    const testHtml = `
      <h2>Golden Crumb Email Test</h2>
      <p>Hello! This is a test email sent from your Golden Crumb HQ Portal.</p>
      <p>If you are reading this, your email configuration (SMTP or Resend) is set up and working correctly!</p>
      <p>Timestamp: <strong>${new Date().toLocaleString()}</strong></p>
    `;

    const success = await sendEmail({
      to: toAddress.trim(),
      subject: '🍪 Test Email - Golden Crumb HQ Portal',
      html: testHtml,
    });

    if (success) {
      return { success: true };
    } else {
      return { success: false, error: 'Failed to send test email. Check server log output.' };
    }
  } catch (err) {
    console.error('sendTestEmailAction error:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Failed to send test email' };
  }
}

/**
 * Server Action: Reset email settings to default values (admin only).
 */
export async function resetEmailSettingsAction(): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getCurrentSession();
    if (!session.isLoggedIn || session.role !== 'admin') {
      return { success: false, error: 'Unauthorized. Administrator access required.' };
    }

    await connectToDatabase();
    await EmailSettings.deleteMany({});
    
    // Create new default settings
    const settings = new EmailSettings({
      provider: 'mock',
      fromAddress: 'Golden Crumb <orders@golden-crumb.com>',
      adminAddress: 'admin@golden-crumb.com',
      templates: DEFAULT_TEMPLATES,
    });
    await settings.save();

    return { success: true };
  } catch (err) {
    console.error('resetEmailSettingsAction error:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Failed to reset settings' };
  }
}
