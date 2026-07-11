import mongoose, { Schema, Document, models } from "mongoose";

export interface ISelection extends Document {
  passengerName: string;
  phone: string;
  station: string;
  trekId: mongoose.Types.ObjectId;
  ticketToken?: string;
  arrived: boolean;
  createdAt: Date;
}

const SelectionSchema = new Schema<ISelection>({
  passengerName: { type: String, required: true },
  phone: { type: String, required: true },
  station: { type: String, required: true },
  trekId: { type: Schema.Types.ObjectId, ref: 'Trek', required: true },
  ticketToken: { type: String, required: false },
  arrived: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

// Force schema compilation in Next.js development (HMR)
if (mongoose.models.Selection) {
  delete mongoose.models.Selection;
}

export default mongoose.model<ISelection>("Selection", SelectionSchema);
