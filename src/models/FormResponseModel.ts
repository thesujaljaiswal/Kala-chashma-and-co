import mongoose, { Document, Model, Schema } from "mongoose";

export interface IResponseField {
  label: string;
  value: string;
}

export interface IFormResponse extends Document {
  formId: mongoose.Types.ObjectId;
  responses: IResponseField[];
  createdAt: Date;
  updatedAt: Date;
}

const ResponseFieldSchema = new mongoose.Schema({
  label: { type: String, required: true },
  value: { type: String, required: true }
});

const FormResponseSchema = new mongoose.Schema<IFormResponse>({
  formId: { type: Schema.Types.ObjectId, ref: "Form", required: true },
  responses: { type: [ResponseFieldSchema], default: [] }
}, {
  timestamps: true
});

// To prevent OverwriteModelError in Next.js development
if (mongoose.models.FormResponse) {
  delete mongoose.models.FormResponse;
}

export const FormResponseModel: Model<IFormResponse> = mongoose.models.FormResponse || mongoose.model<IFormResponse>("FormResponse", FormResponseSchema);
