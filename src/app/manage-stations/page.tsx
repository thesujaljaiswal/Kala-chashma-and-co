"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/AdminSidebar";
import { getEvents, updateEvent } from "@/app/actions";

export default function ManageStationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [events, setEvents] = useState<any[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [stations, setStations] = useState([{ name: "", time: "" }]);
  const [isSaving, setIsSaving] = useState(false);
  const [draggedStationIdx, setDraggedStationIdx] = useState<number | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    const initialize = async () => {
      if (status !== "authenticated") return;
      setIsInitialLoading(true);
      await fetchEvents();
      setIsInitialLoading(false);
    };
    initialize();
  }, [status]);

  const fetchEvents = async () => {
    const data = await getEvents();
    // Filter out past events
    const active = data.filter((e: any) => !isPastEvent(e.date));
    setEvents(active);

    if (active.length > 0) {
      const latestEvent = active[0];
      setSelectedEventId(latestEvent._id);
      if (latestEvent.stations && latestEvent.stations.length > 0) {
        setStations(latestEvent.stations.map((s:any) => ({ name: s.name, time: s.time })));
      } else {
        setStations([{ name: "", time: "" }]);
      }
    }
  };

  const isPastEvent = (dateStr: string) => {
    if (!dateStr) return false;
    const parts = dateStr.split("-");
    if (parts.length !== 3) return false;
    const eventDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    const today = new Date();
    today.setHours(0,0,0,0);
    return eventDate < today;
  };

  const handleEventSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const eventId = e.target.value;
    setSelectedEventId(eventId);
    if (eventId) {
      const selectedEvent = events.find((ev) => ev._id === eventId);
      if (selectedEvent && selectedEvent.stations && selectedEvent.stations.length > 0) {
        setStations(selectedEvent.stations.map((s:any) => ({ name: s.name, time: s.time })));
      } else {
        setStations([{ name: "", time: "" }]);
      }
    } else {
      setStations([{ name: "", time: "" }]);
    }
  };

  const handleStationChange = (index: number, field: "name" | "time", value: string) => {
    const updated = [...stations];
    updated[index][field] = value;
    setStations(updated);
  };

  const addStationField = () => {
    setStations([...stations, { name: "", time: "" }]);
  };

  const removeStationField = (index: number) => {
    const updated = stations.filter((_, i) => i !== index);
    setStations(updated);
  };

  const moveStationUp = (index: number) => {
    if (index === 0) return;
    const updated = [...stations];
    const temp = updated[index - 1];
    updated[index - 1] = updated[index];
    updated[index] = temp;
    setStations(updated);
  };

  const moveStationDown = (index: number) => {
    if (index === stations.length - 1) return;
    const updated = [...stations];
    const temp = updated[index + 1];
    updated[index + 1] = updated[index];
    updated[index] = temp;
    setStations(updated);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedStationIdx(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (draggedStationIdx === null || draggedStationIdx === index) return;
    const updated = [...stations];
    const temp = updated[draggedStationIdx];
    updated[draggedStationIdx] = updated[index];
    updated[index] = temp;
    setStations(updated);
    setDraggedStationIdx(index);
  };

  const handleDragEnd = () => {
    setDraggedStationIdx(null);
  };

  const handleSaveStations = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId) return;

    const validStations = stations.filter(s => s.name.trim() !== "" && s.time.trim() !== "");
    if (validStations.length === 0) {
      alert("Please add at least one valid boarding station.");
      return;
    }
    
    setIsSaving(true);
    const existingEvent = events.find(ev => ev._id === selectedEventId);
    if (!existingEvent) {
      setIsSaving(false);
      return;
    }

    const result = await updateEvent(
      selectedEventId, 
      existingEvent.name, 
      existingEvent.date, 
      validStations, 
      existingEvent.customFields
    );
    
    setIsSaving(false);

    if (result.success) {
      alert("Stations updated successfully!");
      fetchEvents();
    } else {
      alert("Failed to update stations.");
    }
  };

  const formatEventDate = (dateStr: string) => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  };

  const copyLink = (eventShareId: string) => {
    const link = `${window.location.origin}/${eventShareId}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(eventShareId);
    setTimeout(() => setCopiedLink(null), 3000);
  };

  if (status === "loading" || isInitialLoading) {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-[calc(100vh-64px)] bg-black/20 gap-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '-0.3s' }}></div>
          <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '-0.15s' }}></div>
          <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce"></div>
        </div>
        <div className="text-gray-400 font-medium text-sm animate-pulse mt-2">Loading Stations...</div>
      </div>
    );
  }

  if (!session?.user) return null;

  return (
    <div className="flex w-full min-h-[calc(100vh-64px)] relative overflow-hidden bg-black/20">
      <AdminSidebar activeTab="stations" title="Event Stations" />

      <div className="flex-1 flex flex-col w-full h-[calc(100vh-64px)] overflow-y-auto">
        <div className="p-3 sm:p-4 md:p-8 w-full max-w-4xl mx-auto pb-24 pt-20 md:pt-8">
          
          <div className="mb-8">
            <h1 className="text-3xl font-black text-white">Event Stations</h1>
            <p className="text-gray-400 text-sm mt-1">Configure the boarding flow and times for your upcoming events.</p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden h-fit">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
            
            <div className="mb-8 border-b border-white/10 pb-8">
              <label className="block text-sm font-semibold text-gray-300 mb-2">Select Active Event</label>
              <select
                value={selectedEventId}
                onChange={handleEventSelect}
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
              >
                <option value="" disabled className="bg-gray-800 text-gray-400">Choose an event...</option>
                {events.map((evt) => (
                  <option key={evt._id} value={evt._id} className="bg-gray-800 text-white">
                    {evt.name} ({formatEventDate(evt.date)})
                  </option>
                ))}
              </select>
              
              {selectedEventId && (
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      const evt = events.find(e => e._id === selectedEventId);
                      if (evt) copyLink(evt.shareId || evt._id);
                    }}
                    className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                      copiedLink === (events.find(e => e._id === selectedEventId)?.shareId || selectedEventId)
                        ? "bg-green-500/20 text-green-300 border border-green-500/50" 
                        : "bg-white/10 text-white hover:bg-white/20 border border-white/10"
                    }`}
                  >
                    {copiedLink === (events.find(e => e._id === selectedEventId)?.shareId || selectedEventId) ? (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                        Copied to Clipboard!
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
                        Copy Passenger Invite Link
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {selectedEventId ? (
              <form onSubmit={handleSaveStations}>
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-300 mb-4 flex items-center justify-between">
                    Boarding Flow (Stations in order)
                    <button
                      type="button"
                      onClick={addStationField}
                      className="text-xs bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/40 hover:text-white px-3 py-1.5 rounded-full transition-all flex items-center gap-1"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                      Add Station
                    </button>
                  </label>
                  
                  <div className="space-y-3">
                    {stations.map((station, index) => (
                      <div 
                        key={index} 
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragEnd={handleDragEnd}
                        className={`flex gap-3 items-center bg-black/20 p-3 rounded-2xl border border-white/10 cursor-grab active:cursor-grabbing transition-transform hover:border-white/20 ${draggedStationIdx === index ? 'opacity-40 scale-[0.98]' : ''}`}
                      >
                        <div className="text-gray-500 px-1 shrink-0 hidden md:block cursor-move">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8h16M4 16h16"></path></svg>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-300 font-bold flex items-center justify-center text-xs shrink-0">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <input
                            type="text"
                            required
                            value={station.name}
                            onChange={(e) => handleStationChange(index, "name", e.target.value)}
                            className="w-full bg-transparent border-none px-2 py-2 text-white focus:outline-none placeholder-gray-500 text-sm font-medium"
                            placeholder="Station Name"
                          />
                        </div>
                        <div className="w-[100px] sm:w-[130px] shrink-0 border-l border-white/10 pl-3">
                          <input
                            type="time"
                            required
                            value={station.time}
                            onChange={(e) => handleStationChange(index, "time", e.target.value)}
                            className="w-full bg-transparent border-none text-white focus:outline-none text-sm font-medium"
                          />
                        </div>
                        
                        <div className="flex flex-col gap-1 border-l border-white/10 pl-2 md:hidden">
                          <button
                            type="button"
                            onClick={() => moveStationUp(index)}
                            disabled={index === 0}
                            className="text-gray-500 hover:text-indigo-400 disabled:opacity-30 disabled:hover:text-gray-500 transition-colors"
                            title="Move Up"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 15l7-7 7 7"></path></svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => moveStationDown(index)}
                            disabled={index === stations.length - 1}
                            className="text-gray-500 hover:text-indigo-400 disabled:opacity-30 disabled:hover:text-gray-500 transition-colors"
                            title="Move Down"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
                          </button>
                        </div>

                        {stations.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeStationField(index)}
                            className="p-2 ml-1 text-gray-500 hover:text-red-400 transition-colors shrink-0 bg-white/5 hover:bg-red-500/10 rounded-xl"
                            title="Delete Station"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full mt-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold py-4 px-4 rounded-2xl shadow-lg transition-all transform active:scale-[0.98] disabled:opacity-70 flex justify-center items-center gap-2"
                >
                  {isSaving ? "Saving Stations..." : "Save Stations"}
                </button>
              </form>
            ) : (
              <div className="py-12 text-center border-2 border-dashed border-white/10 rounded-2xl">
                <p className="text-gray-500 font-medium">Please select an event to manage its stations.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
