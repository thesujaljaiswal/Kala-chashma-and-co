import { NextResponse } from "next/server";
import Razorpay from "razorpay";

export async function POST(req: Request) {
  try {
    const { formResponseId, amount, formName } = await req.json();

    const key_id = process.env.RAZORPAY_KEY_ID || "rzp_test_YourKeyId";
    const key_secret = process.env.RAZORPAY_KEY_SECRET || "YourKeySecret";

    const razorpay = new Razorpay({
      key_id: key_id,
      key_secret: key_secret,
    });

    const options = {
      amount: amount * 100, // Amount in paise
      currency: "INR",
      receipt: `rcpt_${formResponseId}`,
      notes: {
        formName: formName,
        formResponseId: formResponseId,
      }
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: key_id
    });
  } catch (error: any) {
    console.error("Payment initiation error:", error);
    return NextResponse.json({ success: false, error: error.message });
  }
}
