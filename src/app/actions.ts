"use server";

import dbConnect from "@/lib/mongodb";
import Selection from "@/models/Selection";
import EventModel from "@/models/EventModel";
import { FormModel } from "@/models/FormModel";
import { FormResponseModel } from "@/models/FormResponseModel";
import ExpenseModel from "@/models/ExpenseModel";
import crypto from "crypto";
import Razorpay from "razorpay";
import nodemailer from "nodemailer";
import QRCode from "qrcode";

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

export async function createForm(name: string, description: string, fields: any[], isRegistrationForm: boolean = false, registrationEventId: string | null = null, isPaymentEnabled: boolean = false, paymentAmount: number = 0, isEmailTicketEnabled: boolean = false) {
  try {
    await dbConnect();
    const shareId = Math.random().toString(36).substring(2, 10);
    const form = await FormModel.create({ name, description, shareId, fields, isRegistrationForm, registrationEventId: registrationEventId ?? undefined, isPaymentEnabled, paymentAmount, isEmailTicketEnabled });
    return { success: true, shareId: form.shareId };
  } catch (error) {
    console.error("Failed to create form:", error);
    return { success: false, error: "Failed to create form" };
  }
}

export async function updateForm(id: string, name: string, description: string, fields: any[], isRegistrationForm: boolean = false, registrationEventId: string | null = null, isPaymentEnabled: boolean = false, paymentAmount: number = 0, isEmailTicketEnabled: boolean = false) {
  try {
    await dbConnect();
    
    // Migrate old responses when labels change or fieldIds are missing
    for (const field of fields) {
      if (field.id) {
        if (field.originalLabel && field.originalLabel !== field.label) {
          // Label was changed! Update past responses that used the old label.
          await FormResponseModel.updateMany(
            { formId: id, "responses.label": field.originalLabel },
            { $set: { "responses.$.label": field.label, "responses.$.fieldId": field.id } }
          );
        } else if (field.originalLabel === field.label) {
          // Label didn't change, but we should backfill fieldId for old responses just in case
          await FormResponseModel.updateMany(
            { formId: id, "responses.label": field.originalLabel, "responses.fieldId": { $exists: false } },
            { $set: { "responses.$.fieldId": field.id } }
          );
        }
      }
    }

    await FormModel.findByIdAndUpdate(id, { name, description, fields, isRegistrationForm, registrationEventId: registrationEventId ?? undefined, isPaymentEnabled, paymentAmount, isEmailTicketEnabled });
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

export async function submitFormResponse(formId: string, responses: { fieldId?: string; label: string; value: string }[], paymentStatus?: 'pending' | 'success' | 'failed' | 'not_required', transactionId?: string) {
  try {
    await dbConnect();
    const response = await FormResponseModel.create({ formId, responses, paymentStatus, transactionId });
    
    // Only process ticket immediately if payment is not required or already successful
    if (!paymentStatus || paymentStatus === 'not_required' || paymentStatus === 'success') {
      await processEmailTicket(response._id.toString());
    }
    
    return { success: true, responseId: response._id.toString() };
  } catch (error) {
    console.error("Failed to submit form response:", error);
    return { success: false, error: "Failed to submit form response" };
  }
}

export async function processEmailTicket(formResponseId: string) {
  try {
    await dbConnect();
    const response = await FormResponseModel.findById(formResponseId);
    console.log("processEmailTicket: found response", !!response);
    if (!response || response.ticketId) {
      console.log("processEmailTicket: aborting, no response or ticketId already exists", response?.ticketId);
      return { success: false, error: response?.ticketId ? "Ticket was already generated and sent." : "Response not found." };
    }

    const form = await FormModel.findById(response.formId);
    console.log("processEmailTicket: found form", !!form, form?.name, form?.isEmailTicketEnabled);
    if (!form?.isEmailTicketEnabled) {
      console.log("processEmailTicket: aborting, isEmailTicketEnabled is false");
      return { success: false, error: "Email tickets are disabled for this form." };
    }

    // Get Event Details if applicable
    let eventDate = new Date().toLocaleDateString('en-GB');
    if (form.registrationEventId) {
      const EventModel = (await import("@/models/EventModel")).default;
      const eventInfo = await EventModel.findById(form.registrationEventId);
      if (eventInfo) {
        const parts = eventInfo.date.split('-');
        if (parts.length === 3) eventDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    }

    const emailField = form.fields.find(f => f.type === 'email' || f.label.toLowerCase().includes('email'));
    const userEmail = emailField ? response.responses.find(r => r.label === emailField.label)?.value : null;
    
    console.log("processEmailTicket: email field and user email", !!emailField, userEmail);

    const nameField = form.fields.find(f => f.label.toLowerCase().includes('name'));
    const userName = nameField ? response.responses.find(r => r.label === nameField.label)?.value || 'Guest' : 'Guest';

    const phoneField = form.fields.find(f => f.label.toLowerCase().includes('phone') || f.label.toLowerCase().includes('contact') || f.label.toLowerCase().includes('mobile') || f.label.toLowerCase().includes('whatsapp'));
    const userPhone = phoneField ? response.responses.find(r => r.label === phoneField.label)?.value || 'N/A' : 'N/A';

    const isPaid = response.paymentStatus === 'success' && form.isPaymentEnabled && (form.paymentAmount ?? 0) > 0;
    const paymentDetailsHTML = isPaid ? `
    <tr>
      <td style="padding: 10px 40px 25px 40px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top: 1px solid rgba(198, 156, 109, 0.2); border-bottom: 1px solid rgba(198, 156, 109, 0.2); padding: 15px 0;">
          <tr>
            <td width="50%" valign="top">
              <p style="font-size: 9px; color: rgba(217, 179, 130, 0.6); text-transform: uppercase; letter-spacing: 2px; margin: 0 0 4px 0;">Contribution</p>
              <p style="font-size: 14px; font-weight: 300; margin: 0; color: #F5E6D3; letter-spacing: 1px;">₹${form.paymentAmount ?? 0}</p>
            </td>
            <td width="50%" align="right" valign="top">
              <p style="font-size: 9px; color: rgba(217, 179, 130, 0.6); text-transform: uppercase; letter-spacing: 2px; margin: 0 0 4px 0;">Transaction ID</p>
              <p style="font-size: 11px; font-weight: 300; margin: 0; color: #F5E6D3; letter-spacing: 1px; font-family: monospace;">${response.transactionId || 'N/A'}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>` : '';

    let ticketId: string | null = null;
    console.log("processEmailTicket: preparing to send email. Checks:", { userEmail, user: !!process.env.GMAIL_USER, pass: !!process.env.GMAIL_APP_PASSWORD });
    if (userEmail && process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      ticketId = `TKT-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      try {
        const qrCodeDataUrl = await QRCode.toDataURL(ticketId, { margin: 1, scale: 5 });
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD
          }
        });


        const mailOptions = {
          from: `"${form.name}" <${process.env.GMAIL_USER}>`,
          to: userEmail,
          subject: `${form.name} - Registration Ticket [${ticketId}]`,
          priority: 'high' as const,
          attachments: [{
            filename: 'qrcode.png',
            path: qrCodeDataUrl,
            cid: 'qrcode'
          }],
          html: `
<div style="background-color: #FAF9F6; padding: 60px 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
  <table width="100%" align="center" cellpadding="0" cellspacing="0" border="0" style="background-color: #0B1320; border-radius: 16px; color: #F5E6D3; width: 100%; max-width: 440px; margin: 0 auto; box-shadow: 0 25px 50px -12px rgba(11, 19, 32, 0.25); border: 1px solid #C69C6D; overflow: hidden;">
    
    <!-- Top Gold Bar -->
    <tr>
      <td style="height: 6px; background: linear-gradient(90deg, #A67C52, #D9B382, #A67C52);"></td>
    </tr>

    <!-- Header -->
    <tr>
      <td style="padding: 45px 40px; text-align: center; background-image: radial-gradient(circle at center, rgba(198, 156, 109, 0.05) 0%, transparent 70%); border-bottom: 1px solid rgba(198, 156, 109, 0.2);">
        <h1 style="font-family: 'Georgia', 'Times New Roman', serif; font-size: 26px; font-weight: normal; margin: 0; color: #D9B382; letter-spacing: 3px; text-transform: uppercase;">Kaala CHASMA & co</h1>
        <p style="margin: 12px 0 0 0; font-size: 10px; color: rgba(217, 179, 130, 0.7); letter-spacing: 4px; text-transform: uppercase;">Exclusive Admittance</p>
      </td>
    </tr>
    
    <!-- Event Details -->
    <tr>
      <td style="padding: 40px 40px 15px 40px;">
        <p style="font-size: 9px; color: rgba(217, 179, 130, 0.6); text-transform: uppercase; letter-spacing: 2px; margin: 0 0 8px 0;">Event</p>
        <p style="font-family: 'Georgia', 'Times New Roman', serif; font-size: 28px; font-weight: normal; margin: 0; color: #F5E6D3; line-height: 1.3;">${form.name}</p>
      </td>
    </tr>
    
    <tr>
      <td style="padding: 10px 40px 25px 40px;">
        <p style="font-size: 9px; color: rgba(217, 179, 130, 0.6); text-transform: uppercase; letter-spacing: 2px; margin: 0 0 8px 0;">Date & Time</p>
        <p style="font-size: 14px; font-weight: 300; margin: 0; color: #F5E6D3; letter-spacing: 1px;">${eventDate}</p>
      </td>
    </tr>
    
    ${paymentDetailsHTML}
    
    <!-- Attendee Info -->
    <tr>
      <td style="padding: 10px 40px 40px 40px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td valign="top" width="70%">
              <p style="font-size: 9px; color: rgba(217, 179, 130, 0.6); text-transform: uppercase; letter-spacing: 2px; margin: 0 0 8px 0;">Honored Guest</p>
              <p style="font-family: 'Georgia', 'Times New Roman', serif; font-size: 22px; font-weight: normal; margin: 0 0 10px 0; color: #F5E6D3;">${userName}</p>
              ${userPhone !== 'N/A' ? `<p style="font-size: 12px; font-weight: 300; margin: 0; color: rgba(245, 230, 211, 0.8); letter-spacing: 1px;">${userPhone}</p>` : ''}
            </td>
            <td align="right" valign="top" width="30%">
              <div style="border: 1px solid #C69C6D; padding: 15px; border-radius: 8px; text-align: center;">
                <p style="font-size: 9px; color: rgba(217, 179, 130, 0.8); text-transform: uppercase; letter-spacing: 2px; margin: 0 0 6px 0;">Admit</p>
                <p style="font-family: 'Georgia', 'Times New Roman', serif; font-size: 26px; font-weight: normal; margin: 0; color: #D9B382;">1</p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    
    <!-- Tear-away QR section -->
    <tr>
      <td style="padding: 40px; background-color: rgba(0,0,0,0.2); border-top: 1px dashed rgba(198, 156, 109, 0.4);">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td valign="middle">
              <p style="font-size: 9px; color: rgba(217, 179, 130, 0.6); text-transform: uppercase; letter-spacing: 2px; margin: 0 0 8px 0;">Authorization</p>
              <p style="font-family: monospace; font-size: 16px; font-weight: 300; color: #D9B382; letter-spacing: 2px; margin: 0;">${ticketId}</p>
            </td>
            <td align="right" valign="middle">
              <div style="background-color: #F5E6D3; padding: 8px; border-radius: 8px; display: inline-block;">
                <img src="cid:qrcode" alt="QR Code" width="100" height="100" style="display: block; border-radius: 4px;" />
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
  <p style="text-align: center; font-size: 11px; color: #888888; margin-top: 40px; margin-bottom: 0; text-transform: uppercase; letter-spacing: 1px;">Present this pass upon arrival.</p>
</div>
          `
        };

        await new Promise((resolve, reject) => {
          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              console.error("Vercel Nodemailer Error:", error);
              reject(error);
            } else {
              resolve(info);
            }
          });
        });
      } catch (emailError) {
        console.error("Failed to send email ticket:", emailError);
        return { success: false, error: "Failed to send email via SMTP" };
      }
    } else {
      console.error("Missing userEmail or Gmail credentials");
      return { success: false, error: "Missing user email or Gmail credentials" };
    }

    if (ticketId) {
      await FormResponseModel.findByIdAndUpdate(formResponseId, { ticketId, isPresent: false });
    }
    return { success: true };
  } catch (err) {
    console.error("processEmailTicket Error:", err);
    return { success: false };
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

export async function verifyFormPayment(responseId: string) {
  try {
    await dbConnect();
    const response = await FormResponseModel.findByIdAndUpdate(responseId, { paymentStatus: 'success' }, { new: true });
    
    if (response) {
      // Trigger the email ticket processing now that payment is verified
      const ticketResult = await processEmailTicket(response._id.toString());
      if (ticketResult && !ticketResult.success) {
        return { success: false, error: ticketResult.error || "Payment verified but failed to send email ticket. Check server logs." };
      }
      return { success: true };
    }
    
    return { success: false, error: "Response not found" };
  } catch (error) {
    console.error("Failed to verify payment:", error);
    return { success: false, error: "Failed to verify payment" };
  }
}

export async function getAccountsData() {
  try {
    await dbConnect();

    const verifiedResponses = await FormResponseModel.find({ paymentStatus: 'success' }).lean();
    const forms = await FormModel.find().lean();
    const EventModel = (await import("@/models/EventModel")).default;
    const events = await EventModel.find().lean();

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let todayRevenue = 0;
    let monthlyRevenue = 0;

    const eventWiseMap = new Map<string, { eventName: string; revenue: number; expenses: number; transactionsCount: number; eventId?: string }>();

    for (const response of verifiedResponses) {
      const form = forms.find(f => f._id.toString() === response.formId.toString());
      if (!form || !form.isPaymentEnabled || (form.paymentAmount || 0) <= 0) continue;

      const amount = form.paymentAmount || 0;
      const responseDate = new Date(response.createdAt);

      if (responseDate >= startOfToday) {
        todayRevenue += amount;
      }
      if (responseDate >= startOfMonth) {
        monthlyRevenue += amount;
      }

      let groupName = form.name;
      let eventId = undefined;
      if (form.registrationEventId) {
        const event = events.find((e: any) => e._id.toString() === form.registrationEventId);
        if (event) {
          groupName = event.name;
          eventId = event._id.toString();
        }
      }

      if (!eventWiseMap.has(groupName)) {
        eventWiseMap.set(groupName, { eventName: groupName, revenue: 0, expenses: 0, transactionsCount: 0, eventId });
      }
      
      const groupData = eventWiseMap.get(groupName)!;
      groupData.revenue += amount;
      groupData.transactionsCount += 1;
    }

    return {
      success: true,
      todayGross: todayRevenue,
      todayNet: todayRevenue,
      monthlyGross: monthlyRevenue,
      monthlyNet: monthlyRevenue,
      eventWise: Array.from(eventWiseMap.values()).sort((a, b) => b.revenue - a.revenue),
      pastSettlements: []
    };
  } catch (error) {
    console.error("Failed to get accounts data:", error);
    return { success: false, error: "Failed to fetch accounts data" };
  }
}

export async function getAttendanceList(eventId: string) {
  try {
    await dbConnect();
    const forms = await FormModel.find({ registrationEventId: eventId });
    if (!forms || forms.length === 0) return [];

    const formIds = forms.map(f => f._id);
    const responses = await FormResponseModel.find({ formId: { $in: formIds }, paymentStatus: 'success' });
    
    const attendanceList = responses.map(response => {
      const form = forms.find(f => f._id.toString() === response.formId.toString());
      if (!form) return null;
      
      const nameField = form.fields.find((f: any) => f.label.toLowerCase().includes('name'));
      const userName = nameField ? response.responses.find((r: any) => r.label === nameField.label)?.value || 'Guest' : 'Guest';

      const phoneField = form.fields.find((f: any) => f.label.toLowerCase().includes('phone') || f.label.toLowerCase().includes('contact') || f.label.toLowerCase().includes('mobile') || f.label.toLowerCase().includes('whatsapp'));
      const userPhone = phoneField ? response.responses.find((r: any) => r.label === phoneField.label)?.value || 'N/A' : 'N/A';

      return {
        _id: response._id.toString(),
        ticketId: response.ticketId,
        passengerName: userName,
        phone: userPhone,
        isPresent: response.isPresent || false
      };
    }).filter(Boolean);
    
    return attendanceList;
  } catch (error) {
    console.error("Error fetching attendance list:", error);
    return [];
  }
}

export async function markAttendance(ticketId: string, eventId: string) {
  try {
    await dbConnect();
    
    const response = await FormResponseModel.findOne({ ticketId });
    if (!response) {
      return { success: false, message: "Ticket not found" };
    }
    
    const form = await FormModel.findById(response.formId);
    if (!form || form.registrationEventId !== eventId) {
      return { success: false, message: "Ticket belongs to a different event" };
    }
    
    if (response.isPresent) {
      return { success: false, alreadyPresent: true, message: "Attendee already marked present" };
    }
    
    response.isPresent = true;
    await response.save();
    
    return { success: true };
  } catch (error) {
    console.error("Error marking attendance:", error);
    return { success: false, message: "Server error" };
  }
}

export async function toggleAttendanceStatus(ticketId: string, eventId: string, status: boolean) {
  try {
    await dbConnect();
    
    const response = await FormResponseModel.findOne({ ticketId });
    if (!response) {
      return { success: false, message: "Ticket not found" };
    }
    
    const form = await FormModel.findById(response.formId);
    if (!form || form.registrationEventId !== eventId) {
      return { success: false, message: "Ticket belongs to a different event" };
    }
    
    response.isPresent = status;
    await response.save();
    
    return { success: true };
  } catch (error) {
    console.error("Error toggling attendance:", error);
    return { success: false, message: "Server error" };
  }
}


export async function addExpense(description: string, amount: number, eventId?: string, eventName?: string) {
  try {
    await dbConnect();
    await ExpenseModel.create({ description, amount, eventId, eventName });
    return { success: true };
  } catch (error) {
    console.error("Failed to add expense:", error);
    return { success: false, error: "Failed to add expense" };
  }
}

export async function deleteExpense(id: string) {
  try {
    await dbConnect();
    await ExpenseModel.findByIdAndDelete(id);
    return { success: true };
  } catch (error) {
    console.error("Failed to delete expense:", error);
    return { success: false, error: "Failed to delete expense" };
  }
}

export async function getExpenseTrackerEvents() {
  try {
    await dbConnect();
    const EventModel = (await import("@/models/EventModel")).default;
    const events = await EventModel.find().sort({ createdAt: -1 }).lean();
    return {
      success: true,
      events: events.map((e: any) => ({
        id: e._id.toString(),
        name: e.name
      }))
    };
  } catch (error) {
    console.error("Failed to fetch events for expense tracker:", error);
    return { success: false, error: "Failed to fetch events" };
  }
}

export async function getEventFinancials(eventId: string) {
  try {
    await dbConnect();
    
    // Get all forms for this event
    const forms = await FormModel.find({ registrationEventId: eventId }).lean();
    const formIds = forms.map(f => f._id.toString());
    
    // Get verified responses for these forms
    const verifiedResponses = await FormResponseModel.find({ 
      formId: { $in: formIds },
      paymentStatus: 'success' 
    }).lean();
    
    // Calculate total revenue
    let totalRevenue = 0;
    for (const response of verifiedResponses) {
      const form = forms.find(f => f._id.toString() === response.formId.toString());
      if (form && form.isPaymentEnabled && form.paymentAmount) {
        totalRevenue += form.paymentAmount;
      }
    }
    
    // Get expenses for this event
    const expenses = await ExpenseModel.find({ eventId }).sort({ createdAt: -1 }).lean();
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    
    return {
      success: true,
      revenue: totalRevenue,
      expensesTotal: totalExpenses,
      netRemaining: totalRevenue - totalExpenses,
      expensesLog: expenses.map(e => ({
        id: e._id.toString(),
        description: e.description,
        amount: e.amount,
        createdAt: e.createdAt.toISOString()
      }))
    };
  } catch (error) {
    console.error("Failed to get event financials:", error);
    return { success: false, error: "Failed to calculate financials" };
  }
}
