import mongoose, { Schema, Document } from 'mongoose';

export interface ILog extends Document {
  action: string;
  packageName: string;
  metadata: {
    referrer?: string;
    userAgent?: string;
    country?: string;
    city?: string;
    rating?: number;
    [key: string]: any;
  };
  createdAt: Date;
}

const LogSchema: Schema = new Schema({
  action: { type: String, required: true },
  packageName: { type: String },
  metadata: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: { createdAt: true, updatedAt: false } });

export default mongoose.model<ILog>('Log', LogSchema);
