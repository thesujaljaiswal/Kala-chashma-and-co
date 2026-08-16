import { NextResponse } from "next/server";
import crypto from "crypto";
import dbConnect from "@/lib/mongodb";
import { FormResponseModel } from "@/models/FormResponseModel";

export async function POST(req: Request) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, formResponseId } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !formResponseId) {
      return NextResponse.json({ success: false, error: 'Invalid payment payload' });
    }

    const key_secret = process.env.RAZORPAY_KEY_SECRET || "YourKeySecret";

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", key_secret)
      .update(body.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    await dbConnect();

    if (isAuthentic) {
      await FormResponseModel.findByIdAndUpdate(formResponseId, {
        paymentStatus: 'success',
        transactionId: razorpay_payment_id
      });

      // Generate and send ticket email after successful payment
      const { processEmailTicket } = await import('@/app/actions');
      const emailDebugInfo = await processEmailTicket(formResponseId);

      return NextResponse.json({ success: true, emailDebugInfo });
    } else {
      await FormResponseModel.findByIdAndUpdate(formResponseId, {
        paymentStatus: 'failed',
      });
      return NextResponse.json({ success: false, error: 'Signature verification failed' });
    }

  } catch (error: any) {
    console.error("Payment callback error:", error);
    return NextResponse.json({ success: false, error: 'Server error' });
  }
}
