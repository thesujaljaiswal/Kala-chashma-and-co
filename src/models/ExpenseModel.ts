import mongoose, { Document, Model } from "mongoose";

export interface IExpense extends Document {
  description: string;
  amount: number;
  eventId?: string;
  eventName?: string; // Cache the event name for standalone forms without events
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new mongoose.Schema({
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  eventId: { type: String, required: false },
  eventName: { type: String, required: false }
}, { timestamps: true });

const ExpenseModel: Model<IExpense> = mongoose.models.Expense || mongoose.model<IExpense>("Expense", ExpenseSchema);

export default ExpenseModel;
