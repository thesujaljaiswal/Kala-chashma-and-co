import mongoose, { Document, Model } from "mongoose";

export interface IFormField {
  id?: string;
  label: string;
  type: "text" | "dropdown" | "radio" | "checkbox" | "number" | "email" | "undertaking" | "file" | "dynamic_pricing";
  options?: string[]; // for dropdown, radio, checkbox
  dynamicPricingOptions?: { label: string; price: number }[]; // for dynamic_pricing
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
  isAcceptingResponses?: boolean;
  theme?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DynamicPricingOptionSchema = new mongoose.Schema({
  label: { type: String, required: true },
  price: { type: Number, required: true }
});

const FormFieldSchema = new mongoose.Schema({
  id: { type: String },
  label: { type: String, required: true },
  type: { type: String, enum: ["text", "dropdown", "radio", "checkbox", "number", "email", "undertaking", "file", "dynamic_pricing"], required: true },
  options: { type: [String], default: [] },
  dynamicPricingOptions: { type: [DynamicPricingOptionSchema], default: [] },
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
  isEmailTicketEnabled: { type: Boolean, default: false },
  isAcceptingResponses: { type: Boolean, default: true },
  theme: { type: String, default: 'default' }
}, {
  timestamps: true
});

// To prevent OverwriteModelError in Next.js development
if (mongoose.models.Form) {
  delete mongoose.models.Form;
}

export const FormModel: Model<IForm> = mongoose.models.Form || mongoose.model<IForm>("Form", FormSchema);
