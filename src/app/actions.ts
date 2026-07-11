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
      return { success: false, error: "You have already registered for this station on this trek with these details!" };
    }

    const newSelection = await Selection.create({ passengerName, phone, station, trekId });
    return { success: true, id: newSelection._id.toString() };
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
