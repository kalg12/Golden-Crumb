import mongoose, { Schema } from 'mongoose';

export interface IUser {
  name: string;
  email: string;
  role: 'admin' | 'kitchen' | 'courier';
  password?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    role: {
      type: String,
      required: true,
      enum: ['admin', 'kitchen', 'courier'],
      default: 'admin',
    },
  },
  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
