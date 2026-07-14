import mongoose, { Document, Model } from "mongoose";

export interface IFormField {
  label: string;
  type: "text" | "dropdown" | "radio" | "checkbox" | "number" | "email" | "undertaking";
  options?: string[]; // for dropdown, radio, checkbox
  required: boolean;
}

export interface IForm extends Document {
  name: string;
  description?: string;
  shareId: string;
  fields: IFormField[];
  createdAt: Date;
  updatedAt: Date;
}

const FormFieldSchema = new mongoose.Schema({
  label: { type: String, required: true },
  type: { type: String, enum: ["text", "dropdown", "radio", "checkbox", "number", "email", "undertaking"], required: true },
  options: { type: [String], default: [] },
  required: { type: Boolean, default: false }
});

const FormSchema = new mongoose.Schema<IForm>({
  name: { type: String, required: true },
  description: { type: String, default: "" },
  shareId: { type: String, required: true, unique: true },
  fields: { type: [FormFieldSchema], default: [] }
}, {
  timestamps: true
});

// To prevent OverwriteModelError in Next.js development
if (mongoose.models.Form) {
  delete mongoose.models.Form;
}

export const FormModel: Model<IForm> = mongoose.models.Form || mongoose.model<IForm>("Form", FormSchema);
