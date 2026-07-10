import mongoose, { Schema } from 'mongoose';

export interface ISurvey {
  orderId: mongoose.Types.ObjectId;
  customerName: string;
  customerEmail: string;
  token: string;
  rating?: number;
  feedback?: string;
  respondedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SurveySchema = new Schema<ISurvey>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    token: { type: String, required: true, unique: true },
    rating: { type: Number, min: 1, max: 5 },
    feedback: { type: String },
    respondedAt: { type: Date },
  },
  { timestamps: true }
);

export const Survey = mongoose.models.Survey || mongoose.model<ISurvey>('Survey', SurveySchema);
