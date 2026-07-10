import mongoose, { Schema } from 'mongoose';

export interface ISiteSettings {
  contactEmail: string;
  contactPhone: string;
  location: string;
  instagramUrl: string;
  whatsappUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

const SiteSettingsSchema = new Schema<ISiteSettings>(
  {
    contactEmail: { type: String, required: true },
    contactPhone: { type: String, required: true },
    location: { type: String, required: true },
    instagramUrl: { type: String, required: true },
    whatsappUrl: { type: String, required: true },
  },
  { timestamps: true }
);

export const SiteSettings =
  mongoose.models.SiteSettings ||
  mongoose.model<ISiteSettings>('SiteSettings', SiteSettingsSchema);
