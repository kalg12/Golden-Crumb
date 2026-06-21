import mongoose, { Schema } from 'mongoose';

export interface ICustomer {
  name: string;
  phone: string;
  email: string;
  password?: string;
  totalSpent: number;
  orderCount: number;
  orders: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String },
    totalSpent: { type: Number, required: true, default: 0 },
    orderCount: { type: Number, required: true, default: 0 },
    orders: [{ type: Schema.Types.ObjectId, ref: 'Order' }],
  },
  { timestamps: true }
);

export const Customer = mongoose.models.Customer || mongoose.model<ICustomer>('Customer', CustomerSchema);
