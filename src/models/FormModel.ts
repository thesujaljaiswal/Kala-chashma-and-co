import mongoose, { Document, Model } from "mongoose";

export interface IFormField {
  id?: string;
  label: string;
  type: "text" | "dropdown" | "radio" | "checkbox" | "number" | "email" | "undertaking" | "file";
  options?: string[]; // for dropdown, radio, checkbox
  required: boolean;
}

export interface IForm extends Document {
  name: string;
  description?: string;
  shareId: string;
  fields: IFormField[];
  isRegistrationForm?: boolean;
  registrationEventId?: string;
  isPaymentEnabled?: boolean;
  paymentAmount?: number;
  isEmailTicketEnabled?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FormFieldSchema = new mongoose.Schema({
  id: { type: String },
  label: { type: String, required: true },
  type: { type: String, enum: ["text", "dropdown", "radio", "checkbox", "number", "email", "undertaking", "file"], required: true },
  options: { type: [String], default: [] },
  required: { type: Boolean, default: false }
});

const FormSchema = new mongoose.Schema<IForm>({
  name: { type: String, required: true },
  description: { type: String, default: "" },
  shareId: { type: String, required: true, unique: true },
  fields: { type: [FormFieldSchema], default: [] },
  isRegistrationForm: { type: Boolean, default: false },
  registrationEventId: { type: String, default: null },
  isPaymentEnabled: { type: Boolean, default: false },
  paymentAmount: { type: Number, default: 0 },
  isEmailTicketEnabled: { type: Boolean, default: false }
}, {
  timestamps: true
});

// To prevent OverwriteModelError in Next.js development
if (mongoose.models.Form) {
  delete mongoose.models.Form;
}

export const FormModel: Model<IForm> = mongoose.models.Form || mongoose.model<IForm>("Form", FormSchema);
