import mongoose, { Schema, Document } from 'mongoose';

export interface IAdmin extends Document {
  username: string;
  passwordHash: string;
  lastLogin: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AdminSchema: Schema = new Schema({
  username: { type: String, required: true, unique: true, trim: true },
  passwordHash: { type: String, required: true },
  lastLogin: { type: Date }
}, { timestamps: true });

export default mongoose.model<IAdmin>('Admin', AdminSchema);
