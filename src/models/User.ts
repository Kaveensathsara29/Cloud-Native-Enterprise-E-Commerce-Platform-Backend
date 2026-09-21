import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IAddress {
  _id?: mongoose.Types.ObjectId | string;
  fullName: string;
  addressLine: string;
  city: string;
  zipCode: string;
  country: string;
  phone?: string;
}

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password?: string;
  googleId?: string;
  profilePicture?: string;
  phone?: string;
  isAdmin: boolean;
  addresses: mongoose.Types.DocumentArray<IAddress & Document>;
  createdAt: Date;
  updatedAt: Date;
  matchPassword(enteredPassword: string): Promise<boolean>;
}

const addressSchema = new Schema<IAddress & Document>({
  fullName: { type: String, required: true },
  addressLine: { type: String, required: true },
  city: { type: String, required: true },
  zipCode: { type: String, required: true },
  country: { type: String, required: true, default: 'United States' },
  phone: { type: String }
});

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String },
    googleId: { type: String },
    profilePicture: { type: String },
    phone: { type: String },
    isAdmin: { type: Boolean, default: false },
    addresses: [addressSchema]
  },
  { timestamps: true }
);

// Password hashing before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Match entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword: string): Promise<boolean> {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model<IUser>('User', userSchema);
export default User;
