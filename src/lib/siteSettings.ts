import { unstable_cache } from 'next/cache';

import { connectToDatabase } from '@/lib/db';
import { SiteSettings } from '@/models/SiteSettings';
import { CONTACT, SOCIAL } from '@/lib/constants';

export interface SiteContactSettings {
  contactEmail: string;
  contactPhone: string;
  location: string;
  instagramUrl: string;
  whatsappUrl: string;
}

const DEFAULT_SITE_SETTINGS: SiteContactSettings = {
  contactEmail: CONTACT.email,
  contactPhone: CONTACT.phone,
  location: CONTACT.location,
  instagramUrl: SOCIAL.instagram,
  whatsappUrl: SOCIAL.whatsapp,
};

export const SITE_SETTINGS_TAG = 'site-settings';

/**
 * Cached read of editable contact/social data, falling back to constants.ts
 * defaults when no settings have been saved yet or the database is unreachable.
 */
export const getSiteSettings = unstable_cache(
  async (): Promise<SiteContactSettings> => {
    try {
      await connectToDatabase();
      const settings = await SiteSettings.findOne({}).lean();
      if (!settings) {
        return DEFAULT_SITE_SETTINGS;
      }
      return {
        contactEmail: settings.contactEmail,
        contactPhone: settings.contactPhone,
        location: settings.location,
        instagramUrl: settings.instagramUrl,
        whatsappUrl: settings.whatsappUrl,
      };
    } catch (err) {
      console.warn('Could not read site settings, using defaults:', err);
      return DEFAULT_SITE_SETTINGS;
    }
  },
  ['site-settings'],
  { tags: [SITE_SETTINGS_TAG] }
);
