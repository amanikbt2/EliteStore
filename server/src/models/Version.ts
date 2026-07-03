import mongoose, { Schema, Document } from 'mongoose';

export interface IVersion extends Document {
  appId: mongoose.Types.ObjectId;
  versionName: string;
  versionCode: number;
  apkUrl: string;
  fileSize: number; // in bytes
  sha256Checksum: string;
  minimumAndroidVersion: string;
  releaseNotes: string;
  isMandatoryUpdate: boolean;
  status: 'active' | 'deprecated' | 'soft_deleted';
  createdAt: Date;
  updatedAt: Date;
}

const VersionSchema: Schema = new Schema({
  appId: { type: Schema.Types.ObjectId, ref: 'App', required: true, index: true },
  versionName: { type: String, required: true },
  versionCode: { type: Number, required: true },
  apkUrl: { type: String, required: true },
  fileSize: { type: Number, required: true },
  sha256Checksum: { type: String, required: true },
  minimumAndroidVersion: { type: String, default: '5.0' },
  releaseNotes: { type: String },
  isMandatoryUpdate: { type: Boolean, default: false },
  status: { type: String, enum: ['active', 'deprecated', 'soft_deleted'], default: 'active' }
}, { timestamps: true });

// Ensure versionCode is unique per app
VersionSchema.index({ appId: 1, versionCode: 1 }, { unique: true });

export default mongoose.model<IVersion>('Version', VersionSchema);
