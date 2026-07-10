import mongoose, { Schema } from 'mongoose';

export interface IOrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
}

export interface IOrder {
  customerId?: mongoose.Types.ObjectId;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  items: IOrderItem[];
  totalPrice: number;
  lat: number;
  lng: number;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    zip?: string;
  };
  addressReference?: string;
  preferredDate: string; // YYYY-MM-DD
  preferredTime: string; // HH:MM
  notes?: string;
  status:
    | 'pending'
    | 'kitchen_prep'
    | 'ready_for_delivery'
    | 'out_for_delivery'
    | 'delivered'
    | 'cancelled';
  labelPrinted: boolean;
  prepStartedAt?: Date;
  prepCompletedAt?: Date;
  prepDuration?: number; // duration in seconds
  surveySentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>({
  productId: { type: String, required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
});

const OrderSchema = new Schema<IOrder>(
  {
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer' },
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    customerEmail: { type: String, required: true },
    items: [OrderItemSchema],
    totalPrice: { type: Number, required: true },
    lat: { type: Number, required: true, default: 37.7749 },
    lng: { type: Number, required: true, default: -122.4194 },
    address: {
      line1: { type: String, required: true },
      line2: { type: String },
      city: { type: String, required: true, default: 'San Francisco' },
      state: { type: String, required: true, default: 'CA' },
      zip: { type: String },
    },
    addressReference: { type: String },
    preferredDate: { type: String, required: true },
    preferredTime: { type: String, required: true },
    notes: { type: String },
    status: {
      type: String,
      required: true,
      enum: [
        'pending',
        'kitchen_prep',
        'ready_for_delivery',
        'out_for_delivery',
        'delivered',
        'cancelled',
      ],
      default: 'pending',
    },
    labelPrinted: { type: Boolean, required: true, default: false },
    prepStartedAt: { type: Date },
    prepCompletedAt: { type: Date },
    prepDuration: { type: Number },
    surveySentAt: { type: Date },
  },
  { timestamps: true }
);

export const Order = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
