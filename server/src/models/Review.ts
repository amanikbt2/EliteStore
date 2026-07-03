import mongoose, { Schema, Document } from 'mongoose';

export interface IReview extends Document {
  appId: mongoose.Types.ObjectId;
  username: string;
  stars: number;
  comment: string;
  helpfulCount: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema: Schema = new Schema({
  appId: { type: Schema.Types.ObjectId, ref: 'App', required: true, index: true },
  username: { type: String, required: true, trim: true },
  stars: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true, trim: true, maxlength: 1000 },
  helpfulCount: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
}, { timestamps: true });

export default mongoose.model<IReview>('Review', ReviewSchema);
