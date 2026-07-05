import mongoose, { Schema, Document } from 'mongoose';

export interface IApp extends Document {
  packageName: string;
  name: string;
  developer: string;
  category: mongoose.Types.ObjectId;
  description: string;
  shortDescription: string;
  iconUrl: string;
  featureGraphicUrl?: string;
  screenshots: string[];
  rating: number;
  downloads: number;
  tags: string[];
  website?: string;
  email?: string;
  privacyPolicyUrl?: string;
  isEditorChoice: boolean;
  isTrending: boolean;
  isFeatured: boolean;
  downloadEnabled: boolean;
  status: 'published' | 'hidden' | 'deleted';
  createdAt: Date;
  updatedAt: Date;
}

const AppSchema: Schema = new Schema({
  packageName: { type: String, required: true, unique: true, trim: true, index: true },
  name: { type: String, required: true, trim: true },
  developer: { type: String, required: true, trim: true },
  category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  description: { type: String, required: true },
  shortDescription: { type: String, required: true, maxlength: 200 },
  iconUrl: { type: String, required: true },
  featureGraphicUrl: { type: String },
  screenshots: [{ type: String }],
  rating: { type: Number, default: 0, min: 0, max: 5 },
  downloads: { type: Number, default: 0 },
  tags: [{ type: String }],
  website: { type: String },
  email: { type: String },
  privacyPolicyUrl: { type: String },
  isEditorChoice: { type: Boolean, default: false },
  isTrending: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },
  downloadEnabled: { type: Boolean, default: true },
  status: { type: String, enum: ['published', 'hidden', 'deleted'], default: 'published' }
}, { timestamps: true });

AppSchema.index({ name: 'text', developer: 'text', tags: 'text' });

export default mongoose.model<IApp>('App', AppSchema);
