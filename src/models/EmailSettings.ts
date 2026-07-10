import mongoose, { Schema } from 'mongoose';

export interface IEmailTemplate {
  subject: string;
  body: string;
}

export interface IEmailSettings {
  provider: 'resend' | 'smtp' | 'mock';
  resendApiKey?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUser?: string;
  smtpPass?: string;
  fromAddress: string;
  adminAddress: string;
  templates: {
    customerConfirmation: IEmailTemplate;
    adminConfirmation: IEmailTemplate;
    statusKitchenPrep: IEmailTemplate;
    statusReadyForDelivery: IEmailTemplate;
    statusOutForDelivery: IEmailTemplate;
    statusDelivered: IEmailTemplate;
    statusCancelled: IEmailTemplate;
    satisfactionSurvey: IEmailTemplate;
  };
  createdAt: Date;
  updatedAt: Date;
}

const EmailTemplateSchema = new Schema<IEmailTemplate>({
  subject: { type: String, required: true },
  body: { type: String, required: true },
});

const EmailSettingsSchema = new Schema<IEmailSettings>(
  {
    provider: {
      type: String,
      required: true,
      enum: ['resend', 'smtp', 'mock'],
      default: 'mock',
    },
    resendApiKey: { type: String },
    smtpHost: { type: String },
    smtpPort: { type: Number },
    smtpSecure: { type: Boolean, default: false },
    smtpUser: { type: String },
    smtpPass: { type: String },
    fromAddress: {
      type: String,
      required: true,
      default: 'Golden Crumb <orders@golden-crumb.com>',
    },
    adminAddress: {
      type: String,
      required: true,
      default: 'admin@golden-crumb.com',
    },
    templates: {
      customerConfirmation: {
        type: EmailTemplateSchema,
        required: true,
      },
      adminConfirmation: {
        type: EmailTemplateSchema,
        required: true,
      },
      statusKitchenPrep: {
        type: EmailTemplateSchema,
        required: true,
      },
      statusReadyForDelivery: {
        type: EmailTemplateSchema,
        required: true,
      },
      statusOutForDelivery: {
        type: EmailTemplateSchema,
        required: true,
      },
      statusDelivered: {
        type: EmailTemplateSchema,
        required: true,
      },
      statusCancelled: {
        type: EmailTemplateSchema,
        required: true,
      },
      satisfactionSurvey: {
        type: EmailTemplateSchema,
        required: true,
      },
    },
  },
  { timestamps: true }
);

export const EmailSettings =
  mongoose.models.EmailSettings ||
  mongoose.model<IEmailSettings>('EmailSettings', EmailSettingsSchema);
