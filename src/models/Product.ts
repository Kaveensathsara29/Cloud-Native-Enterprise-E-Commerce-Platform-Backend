import mongoose, { Schema, Document } from 'mongoose';

export interface IReview {
  id?: string;
  userName: string;
  rating: number;
  date: string;
  comment: string;
}

export interface IProductColor {
  name: string;
  hex: string;
}

export interface IProduct extends Document {
  _id: mongoose.Types.ObjectId;
  id?: string;
  name: string;
  slug: string;
  description: string;
  longDescription?: string;
  price: number;
  originalPrice?: number;
  category: string;
  images: string[];
  rating: number;
  reviewCount: number;
  isFeatured?: boolean;
  featured?: boolean;
  onSale?: boolean;
  inStock: boolean;
  freeShipping?: boolean;
  shippingFee?: number;
  colors?: Array<IProductColor | string>;
  sizes?: string[];
  specs?: Record<string, string>;
  reviews?: IReview[];
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>({
  id: { type: String },
  userName: { type: String, required: true },
  rating: { type: Number, required: true },
  date: { type: String, required: true },
  comment: { type: String, required: true }
});

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    longDescription: { type: String },
    price: { type: Number, required: true, default: 0.0 },
    originalPrice: { type: Number },
    category: { type: String, required: true },
    images: [{ type: String, required: true }],
    rating: { type: Number, required: true, default: 4.5 },
    reviewCount: { type: Number, required: true, default: 0 },
    isFeatured: { type: Boolean, default: false },
    featured: { type: Boolean, default: false },
    onSale: { type: Boolean, default: false },
    inStock: { type: Boolean, default: true },
    freeShipping: { type: Boolean, default: false },
    shippingFee: { type: Number, default: 0 },
    colors: [{ type: Schema.Types.Mixed }],
    sizes: [{ type: String }],
    specs: { type: Schema.Types.Mixed, default: {} },
    reviews: [reviewSchema]
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (_doc, ret: any) {
        ret.id = ret._id.toString();
        ret.featured = ret.featured || ret.isFeatured || false;
        ret.isFeatured = ret.featured;
        return ret;
      }
    },
    toObject: {
      virtuals: true,
      transform: function (_doc, ret: any) {
        ret.id = ret._id.toString();
        ret.featured = ret.featured || ret.isFeatured || false;
        ret.isFeatured = ret.featured;
        return ret;
      }
    }
  }
);

productSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

const Product = mongoose.model<IProduct>('Product', productSchema);
export default Product;
