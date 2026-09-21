import mongoose, { Schema, Document } from 'mongoose';
import { IAddress, IUser } from './User.js';

export interface IOrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  color: string;
  size?: string;
  image: string;
}

export interface IOrder extends Document {
  _id: mongoose.Types.ObjectId;
  orderId: string;
  user: mongoose.Types.ObjectId | IUser;
  items: IOrderItem[];
  total: number;
  shippingAddress: IAddress;
  paymentMethod: string;
  status: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>({
  productId: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  color: { type: String, required: true },
  size: { type: String },
  image: { type: String, required: true }
});

const orderSchema = new Schema<IOrder>(
  {
    orderId: { type: String, required: true, unique: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    items: [orderItemSchema],
    total: { type: Number, required: true },
    shippingAddress: {
      fullName: { type: String, required: true },
      addressLine: { type: String, required: true },
      city: { type: String, required: true },
      zipCode: { type: String, required: true },
      country: { type: String, required: true },
      phone: { type: String }
    },
    paymentMethod: { type: String, required: true },
    status: {
      type: String,
      enum: ['Processing', 'Shipped', 'Delivered', 'Cancelled'],
      default: 'Processing'
    }
  },
  { timestamps: true }
);

const Order = mongoose.model<IOrder>('Order', orderSchema);
export default Order;
