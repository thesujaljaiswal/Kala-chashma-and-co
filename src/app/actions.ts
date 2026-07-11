"use server";

import dbConnect from "@/lib/mongodb";
import Selection from "@/models/Selection";
import Trek from "@/models/Trek";

// Helper to generate a random 24 char hex string for the share URL
function generateShareId() {
  const chars = 'abcdef0123456789';
  let result = '';
  for (let i = 0; i < 24; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// --- TREKS ---
export async function getTreks() {
  await dbConnect();
  // Return plain objects to avoid serialization issues
  const treks = await Trek.find({}).sort({ createdAt: -1 }).lean();
  return JSON.parse(JSON.stringify(treks));
}

export async function createTrek(name: string, date: string, stations: { name: string; time: string }[]) {
  try {
    await dbConnect();
    const shareId = generateShareId();
    const newTrek = await Trek.create({ name, date, stations, shareId });
    return { success: true, id: newTrek._id.toString(), shareId };
  } catch (error) {
    console.error("Failed to create trek:", error);
    return { success: false, error: "Failed to create trek" };
  }
}

export async function updateTrek(id: string, name: string, date: string, stations: { name: string; time: string }[]) {
  try {
    await dbConnect();
    await Trek.findByIdAndUpdate(id, { name, date, stations });
    return { success: true };
  } catch (error) {
    console.error("Failed to update trek:", error);
    return { success: false, error: "Failed to update trek" };
  }
}

export async function deleteTrek(id: string) {
  try {
    await dbConnect();
    await Trek.findByIdAndDelete(id);
    // Optionally cascade delete selections for this trek
    await Selection.deleteMany({ trekId: id });
    return { success: true };
  } catch (error) {
    console.error("Failed to delete trek:", error);
    return { success: false, error: "Failed to delete trek" };
  }
}

// --- SELECTIONS ---
export async function saveStationSelection(passengerName: string, phone: string, station: string, trekId: string) {
  try {
    await dbConnect();
    
    // Check for duplicates!
    const existing = await Selection.findOne({ passengerName, phone, station, trekId });
    if (existing) {
      return { success: false, error: "You have already registered for this station on this trek with these details!", ticketToken: existing.ticketToken };
    }

    const tokenChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let randStr = '';
    for (let i = 0; i < 6; i++) {
      randStr += tokenChars.charAt(Math.floor(Math.random() * tokenChars.length));
    }
    const ticketToken = `TRK-${randStr}`;

    const newSelection = await Selection.create({ passengerName, phone, station, trekId, ticketToken });
    return { success: true, id: newSelection._id.toString(), ticketToken };
  } catch (error) {
    console.error("Failed to save selection:", error);
    return { success: false, error: "Failed to save selection" };
  }
}

export async function getSelectionsByTrek(trekId: string) {
  try {
    await dbConnect();
    const selections = await Selection.find({ trekId }).sort({ createdAt: -1 }).lean();
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

export async function checkTicketByPhone(phone: string, trekId: string) {
  try {
    await dbConnect();
    
    // Strip non-digits from input
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 5) return { success: false, error: "Please enter a valid phone number." };
    
    // Create a flexible regex that matches the sequence of digits, ignoring spaces/symbols in the DB string.
    // We anchor it to the end ($) so "8591250180" matches "+91 85912 50180" correctly.
    const regexPattern = cleanPhone.split('').join('\\D*') + '\\D*$';
    const phoneRegex = new RegExp(regexPattern);

    // Find the selection for this phone number and trek using the flexible regex
    const selection = await Selection.findOne({ 
      phone: { $regex: phoneRegex }, 
      trekId 
    }).sort({ createdAt: -1 }).lean();
    
    if (!selection) return { success: false, error: "No booking found for this phone number." };
    
    // Get the Trek to show the details
    const trek = await Trek.findById(selection.trekId).lean();
    if (!trek) return { success: false, error: "Booking found, but trek details are missing." };

    return { 
      success: true, 
      ticket: JSON.parse(JSON.stringify({
        passengerName: selection.passengerName,
        phone: selection.phone,
        station: selection.station,
        ticketToken: selection.ticketToken,
        trekName: trek.name,
        trekDate: trek.date,
        stations: trek.stations
      }))
    };
  } catch (error) {
    console.error("Failed to lookup ticket:", error);
    return { success: false, error: "Failed to look up ticket" };
  }
}
