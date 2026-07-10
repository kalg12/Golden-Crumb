'use server';

import { connectToDatabase } from '@/lib/db';
import { ContactMessage } from '@/models/ContactMessage';
import { sendEmail } from '@/lib/email';
import { getSiteSettings } from '@/lib/siteSettings';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Server Action: Submit a contact form message. Persists it and best-effort
 * notifies the site's configured contact address.
 */
export async function submitContactAction(
  name: string,
  email: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  const trimmedName = name.trim();
  const trimmedEmail = email.trim();
  const trimmedMessage = message.trim();

  if (!trimmedName || !trimmedEmail || !trimmedMessage) {
    return { success: false, error: 'Name, email, and message are required.' };
  }

  if (!EMAIL_PATTERN.test(trimmedEmail)) {
    return { success: false, error: 'Please enter a valid email address.' };
  }

  try {
    await connectToDatabase();
    await ContactMessage.create({
      name: trimmedName,
      email: trimmedEmail,
      message: trimmedMessage,
    });
  } catch (err) {
    console.error('submitContactAction: failed to persist message:', err);
    return { success: false, error: 'Failed to submit your message. Please try again.' };
  }

  try {
    const settings = await getSiteSettings();
    await sendEmail({
      to: settings.contactEmail,
      subject: `New contact message from ${trimmedName}`,
      html: `
        <h2>New Contact Message</h2>
        <p><strong>Name:</strong> ${trimmedName}</p>
        <p><strong>Email:</strong> ${trimmedEmail}</p>
        <p><strong>Message:</strong></p>
        <p>${trimmedMessage.replace(/\n/g, '<br />')}</p>
      `,
    });
  } catch (err) {
    console.warn('submitContactAction: message saved but notification email failed:', err);
  }

  return { success: true };
}
