"use server";

import dbConnect from "@/lib/mongodb";
import Selection from "@/models/Selection";
import EventModel from "@/models/EventModel";
import crypto from "crypto";

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

export async function createEvent(name: string, date: string, stations: { name: string; time: string }[]) {
  try {
    await dbConnect();
    const shareId = generateShareId();
    const newEvent = await EventModel.create({ name, date, stations, shareId });
    return { success: true, id: newEvent._id.toString(), shareId };
  } catch (error) {
    console.error("Failed to create event:", error);
    return { success: false, error: "Failed to create event" };
  }
}

export async function updateEvent(id: string, name: string, date: string, stations: { name: string; time: string }[]) {
  try {
    await dbConnect();
    await EventModel.findByIdAndUpdate(id, { name, date, stations });
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
