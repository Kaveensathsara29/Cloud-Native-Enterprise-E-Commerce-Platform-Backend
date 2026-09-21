import mongoose, { Schema, Document } from 'mongoose';

export interface IPromo extends Document {
  code: string;
  discount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const promoSchema = new Schema<IPromo>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    discount: { type: Number, required: true, min: 1, max: 100 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const Promo = mongoose.model<IPromo>('Promo', promoSchema);
export default Promo;
