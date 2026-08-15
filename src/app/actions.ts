"use server";

import dbConnect from "@/lib/mongodb";
import Selection from "@/models/Selection";
import EventModel from "@/models/EventModel";
import { FormModel } from "@/models/FormModel";
import { FormResponseModel } from "@/models/FormResponseModel";
import crypto from "crypto";
import Razorpay from "razorpay";

// Helper to generate a random 24 char hex string for the share URL
function generateShareId() {
  return crypto.randomBytes(12).toString('hex');
}

// --- EVENTS ---
export async function getEvents() {
  await dbConnect();
  // Return plain objects to avoid serialization issues
  const events = await EventModel.find({}).sort({ createdAt: -1 }).lean();
  return JSON.parse(JSON.stringify(events));
}

export async function createEvent(name: string, date: string, stations: { name: string; time: string }[], customFields: any[] = []) {
  try {
    await dbConnect();
    const shareId = generateShareId();
    const newEvent = await EventModel.create({ name, date, stations, shareId, customFields });
    return { success: true, id: newEvent._id.toString(), shareId };
  } catch (error) {
    console.error("Failed to create event:", error);
    return { success: false, error: "Failed to create event" };
  }
}

export async function updateEvent(id: string, name: string, date: string, stations: { name: string; time: string }[], customFields: any[] = []) {
  try {
    await dbConnect();
    await EventModel.findByIdAndUpdate(id, { name, date, stations, customFields });
    return { success: true };
  } catch (error) {
    console.error("Failed to update event:", error);
    return { success: false, error: "Failed to update event" };
  }
}

export async function deleteEvent(id: string) {
  try {
    await dbConnect();
    await EventModel.findByIdAndDelete(id);
    // Optionally cascade delete selections for this event
    await Selection.deleteMany({ eventId: id });
    return { success: true };
  } catch (error) {
    console.error("Failed to delete event:", error);
    return { success: false, error: "Failed to delete event" };
  }
}

export async function getEventById(id: string) {
  await dbConnect();
  const event = await EventModel.findById(id).lean();
  return JSON.parse(JSON.stringify(event));
}

export async function updateEventFields(id: string, customFields: any[]) {
  try {
    await dbConnect();
    await EventModel.findByIdAndUpdate(id, { customFields });
    return { success: true };
  } catch (error) {
    console.error("Failed to update event fields:", error);
    return { success: false, error: "Failed to update event fields" };
  }
}

// ----------------------------------------------------
// FORMS
// ----------------------------------------------------

export async function getForms() {
  try {
    await dbConnect();
    const forms = await FormModel.find({}).sort({ createdAt: -1 }).lean();
    return JSON.parse(JSON.stringify(forms));
  } catch (error) {
    console.error("Failed to get forms:", error);
    return [];
  }
}

export async function getFormByShareId(shareId: string) {
  try {
    await dbConnect();
    const form = await FormModel.findOne({ shareId }).lean();
    return JSON.parse(JSON.stringify(form));
  } catch (error) {
    console.error("Failed to get form by shareId:", error);
    return null;
  }
}

export async function createForm(name: string, description: string, fields: any[], isRegistrationForm: boolean = false, registrationEventId: string | null = null, isPaymentEnabled: boolean = false, paymentAmount: number = 0) {
  try {
    await dbConnect();
    const shareId = Math.random().toString(36).substring(2, 10);
    const form = await FormModel.create({ name, description, shareId, fields, isRegistrationForm, registrationEventId: registrationEventId ?? undefined, isPaymentEnabled, paymentAmount });
    return { success: true, shareId: form.shareId };
  } catch (error) {
    console.error("Failed to create form:", error);
    return { success: false, error: "Failed to create form" };
  }
}

export async function updateForm(id: string, name: string, description: string, fields: any[], isRegistrationForm: boolean = false, registrationEventId: string | null = null, isPaymentEnabled: boolean = false, paymentAmount: number = 0) {
  try {
    await dbConnect();
    await FormModel.findByIdAndUpdate(id, { name, description, fields, isRegistrationForm, registrationEventId: registrationEventId ?? undefined, isPaymentEnabled, paymentAmount });
    return { success: true };
  } catch (error) {
    console.error("Failed to update form:", error);
    return { success: false, error: "Failed to update form" };
  }
}

export async function deleteForm(id: string) {
  try {
    await dbConnect();
    await FormModel.findByIdAndDelete(id);
    await FormResponseModel.deleteMany({ formId: id });
    return { success: true };
  } catch (error) {
    console.error("Failed to delete form:", error);
    return { success: false, error: "Failed to delete form" };
  }
}

export async function submitFormResponse(formId: string, responses: { label: string; value: string }[], paymentStatus?: 'pending' | 'success' | 'failed' | 'not_required', transactionId?: string) {
  try {
    await dbConnect();
    const response = await FormResponseModel.create({ formId, responses, paymentStatus, transactionId });
    return { success: true, responseId: response._id.toString() };
  } catch (error) {
    console.error("Failed to submit form response:", error);
    return { success: false, error: "Failed to submit form response" };
  }
}

export async function getFormResponses(formId: string) {
  try {
    await dbConnect();
    const responses = await FormResponseModel.find({ formId }).sort({ createdAt: -1 }).lean();
    return JSON.parse(JSON.stringify(responses));
  } catch (error) {
    console.error("Failed to get form responses:", error);
    return [];
  }
}

// --- SELECTIONS ---
export async function saveStationSelection(passengerName: string, phone: string, station: string, eventId: string) {
  try {
    await dbConnect();
    
    const normalizedPhone = phone.replace(/\D/g, '');

    // Check for duplicates!
    const existing = await Selection.findOne({ passengerName, normalizedPhone, station, eventId });
    if (existing) {
      return { success: false, error: "You have already registered for this station on this event with these details!", ticketToken: existing.ticketToken };
    }

    const tokenChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const randStr = Array.from({ length: 6 }, () => tokenChars[crypto.randomInt(0, tokenChars.length)]).join('');
    const ticketToken = `EVT-${randStr}`;

    const newSelection = await Selection.create({ passengerName, phone, normalizedPhone, station, eventId, ticketToken });
    return { success: true, id: newSelection._id.toString(), ticketToken };
  } catch (error) {
    console.error("Failed to save selection:", error);
    return { success: false, error: "Failed to save selection" };
  }
}

export async function getSelectionsByEvent(eventId: string) {
  try {
    await dbConnect();
    const selections = await Selection.find({ eventId }).sort({ createdAt: -1 }).lean();
    return JSON.parse(JSON.stringify(selections));
  } catch (error) {
    console.error("Failed to fetch selections:", error);
    return [];
  }
}

export async function togglePassengerArrival(selectionId: string, arrived: boolean) {
  try {
    await dbConnect();
    await Selection.findByIdAndUpdate(selectionId, { arrived });
    return { success: true };
  } catch (error) {
    console.error("Failed to toggle arrival:", error);
    return { success: false, error: "Failed to toggle arrival" };
  }
}

export async function checkTicketByPhone(phone: string, eventId: string) {
  try {
    await dbConnect();
    
    // Strip non-digits from input
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 5) return { success: false, error: "Please enter a valid phone number." };
    
    // Create a flexible regex that matches the sequence of digits, ignoring spaces/symbols in the DB string.
    // We anchor it to the end ($) so "8591250180" matches "+91 85912 50180" correctly.
    const regexPattern = cleanPhone.split('').join('\\D*') + '\\D*$';
    const phoneRegex = new RegExp(regexPattern);

    // Find the selection for this phone number and event.
    // We check both the new highly-indexed normalizedPhone field, and fallback to regex for older tickets.
    const selection = await Selection.findOne({ 
      $or: [
        { normalizedPhone: cleanPhone },
        { phone: { $regex: phoneRegex } }
      ],
      eventId 
    }).sort({ createdAt: -1 }).lean();
    
    if (!selection) return { success: false, error: "No booking found for this phone number." };
    
    // Get the Event to show the details
    const event = await EventModel.findById(selection.eventId).lean();
    if (!event) return { success: false, error: "Booking found, but event details are missing." };

    return { 
      success: true, 
      ticket: JSON.parse(JSON.stringify({
        passengerName: selection.passengerName,
        phone: selection.phone,
        station: selection.station,
        ticketToken: selection.ticketToken,
        eventName: event.name,
        eventDate: event.date,
        stations: event.stations
      }))
    };
  } catch (error) {
    console.error("Failed to lookup ticket:", error);
    return { success: false, error: "Failed to look up ticket" };
  }
}

// ----------------------------------------------------
// ACCOUNTS & REVENUE
// ----------------------------------------------------

export async function getAccountsData() {
  try {
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    
    if (!key_id || !key_secret) {
      return { success: false, error: "Razorpay API keys are not configured." };
    }

    const razorpay = new Razorpay({ key_id, key_secret });

    // Fetch payments starting from the beginning of this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const fromTimestamp = Math.floor(startOfMonth.getTime() / 1000);

    const paymentsRes = await razorpay.payments.all({
      from: fromTimestamp,
      count: 100, // Fetch up to 100 recent payments this month
    });

    const payments = paymentsRes.items || [];
    
    // Fetch recent settlements
    const settlementsRes = await razorpay.settlements.all({
      count: 10
    });
    const settlements = settlementsRes.items || [];
    
    let todayGross = 0;
    let todayNet = 0;
    let monthlyGross = 0;
    let monthlyNet = 0;
    const eventWiseRevenue: Record<string, { eventName: string, revenue: number, transactionsCount: number }> = {};

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    for (const p of payments) {
      if (p.status !== 'captured') continue;

      const amount = (p.amount as number) / 100; // Gross in INR
      // Razorpay fee is in paise. If not present, default to 0 for estimation.
      const fee = p.fee ? (p.fee as number) / 100 : amount * 0.02; // ~2% fallback estimate
      const netAmount = amount - fee;

      const createdAt = new Date((p.created_at as number) * 1000);

      monthlyGross += amount;
      monthlyNet += netAmount;
      if (createdAt >= startOfToday) {
        todayGross += amount;
        todayNet += netAmount;
      }

      // Group by the formName we passed in notes
      const formName = p.notes?.formName || "Unknown Form/Event";
      
      if (!eventWiseRevenue[formName]) {
        eventWiseRevenue[formName] = { eventName: formName as string, revenue: 0, transactionsCount: 0 };
      }
      eventWiseRevenue[formName].revenue += amount; // We'll show gross in the event breakdown for simplicity
      eventWiseRevenue[formName].transactionsCount += 1;
    }

    const pastSettlements = settlements.map(s => ({
      id: s.id,
      amount: (s.amount as number) / 100,
      fees: (s.fees as number) / 100,
      tax: (s.tax as number) / 100,
      status: s.status,
      utr: s.utr,
      createdAt: new Date((s.created_at as number) * 1000).toISOString()
    }));

    return {
      success: true,
      todayGross,
      todayNet,
      monthlyGross,
      monthlyNet,
      eventWise: Object.values(eventWiseRevenue).sort((a, b) => b.revenue - a.revenue),
      pastSettlements
    };
  } catch (error) {
    console.error("Failed to get accounts data from Razorpay:", error);
    return { success: false, error: "Failed to fetch data from Razorpay" };
  }
}

