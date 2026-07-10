'use server';

import { updateTag } from 'next/cache';

import { connectToDatabase } from '@/lib/db';
import { SiteSettings } from '@/models/SiteSettings';
import { SITE_SETTINGS_TAG, type SiteContactSettings } from '@/lib/siteSettings';
import { getCurrentSession } from './authActions';

/**
 * Server Action: Update site contact/social settings (admin only).
 */
export async function updateSiteSettingsAction(
  payload: SiteContactSettings
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getCurrentSession();
    if (!session.isLoggedIn || session.role !== 'admin') {
      return { success: false, error: 'Unauthorized. Administrator access required.' };
    }

    if (
      !payload.contactEmail?.trim() ||
      !payload.contactPhone?.trim() ||
      !payload.location?.trim() ||
      !payload.instagramUrl?.trim() ||
      !payload.whatsappUrl?.trim()
    ) {
      return { success: false, error: 'All fields are required.' };
    }

    await connectToDatabase();
    let settings = await SiteSettings.findOne({});
    if (!settings) {
      settings = new SiteSettings({});
    }

    settings.contactEmail = payload.contactEmail.trim();
    settings.contactPhone = payload.contactPhone.trim();
    settings.location = payload.location.trim();
    settings.instagramUrl = payload.instagramUrl.trim();
    settings.whatsappUrl = payload.whatsappUrl.trim();

    await settings.save();
    updateTag(SITE_SETTINGS_TAG);

    return { success: true };
  } catch (err) {
    console.error('updateSiteSettingsAction error:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Failed to update site settings' };
  }
}
