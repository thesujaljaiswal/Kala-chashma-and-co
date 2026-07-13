import mongoose, { Schema, Document, models } from "mongoose";

export interface ISelection extends Document {
  passengerName: string;
  phone: string;
  normalizedPhone: string;
  station: string;
  eventId: mongoose.Types.ObjectId;
  ticketToken?: string;
  arrived: boolean;
  createdAt: Date;
}

const SelectionSchema = new Schema<ISelection>({
  passengerName: { type: String, required: true },
  phone: { type: String, required: true },
  normalizedPhone: { type: String, required: true },
  station: { type: String, required: true },
  eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
  ticketToken: { type: String, required: false },
  arrived: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

// Enforce database-level uniqueness to prevent concurrency race conditions
SelectionSchema.index({ passengerName: 1, normalizedPhone: 1, station: 1, eventId: 1 }, { unique: true });

// Force schema compilation in Next.js development (HMR)
if (mongoose.models.Selection) {
  delete mongoose.models.Selection;
}

export default mongoose.models.Selection || mongoose.model<ISelection>("Selection", SelectionSchema);
