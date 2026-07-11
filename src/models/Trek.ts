import mongoose, { Schema, Document, models } from "mongoose";

export interface IStation {
  name: string;
  time: string;
}

export interface ITrek extends Document {
  name: string;
  date: string;
  shareId: string;
  stations: IStation[];
  createdAt: Date;
}

const StationSchema = new Schema<IStation>({
  name: { type: String, required: true },
  time: { type: String, required: true },
});

const TrekSchema = new Schema<ITrek>({
  name: { type: String, required: true },
  date: { type: String, required: true },
  shareId: { type: String, required: true, unique: true },
  stations: [StationSchema],
  createdAt: { type: Date, default: Date.now },
});

// Force schema compilation in Next.js development (HMR)
if (mongoose.models.Trek) {
  delete mongoose.models.Trek;
}

export default mongoose.model<ITrek>("Trek", TrekSchema);
