"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/AdminSidebar";
import { getEvents, createEvent, updateEvent, deleteEvent } from "@/app/actions";

export default function ManageEventsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [events, setEvents] = useState<any[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [expandedEvents, setExpandedEvents] = useState<Record<string, boolean>>({});
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // Form State
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [newEventName, setNewEventName] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
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
    setEvents(data);
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

  const activeEventsList = events.filter(e => !isPastEvent(e.date));
  const pastEventsList = events.filter(e => isPastEvent(e.date));

  if (status === "loading" || isInitialLoading) {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-[calc(100vh-64px)] bg-black/20 gap-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '-0.3s' }}></div>
          <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '-0.15s' }}></div>
          <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce"></div>
        </div>
        <div className="text-gray-400 font-medium text-sm animate-pulse mt-2">Loading...</div>
      </div>
    );
  }

  if (!session?.user) return null;

  const toggleEvent = (id: string) => {
    setExpandedEvents(prev => ({...prev, [id]: !prev[id]}));
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

  const resetForm = () => {
    setEditingEventId(null);
    setNewEventName("");
    setNewEventDate("");
    setStations([{ name: "", time: "" }]);
  };

  const handleEditInit = (event: any) => {
    setEditingEventId(event._id);
    setNewEventName(event.name);
    setNewEventDate(event.date);
    setStations(event.stations.length > 0 ? event.stations.map((s:any) => ({ name: s.name, time: s.time })) : [{ name: "", time: "" }]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to permanently delete "${name}"? This will also wipe all passenger records for this event.`)) {
      const result = await deleteEvent(id);
      if (result.success) {
        if (editingEventId === id) resetForm();
        fetchEvents();
      } else {
        alert("Failed to delete event.");
      }
    }
  };

  const handleSubmitEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    const validStations = stations.filter(s => s.name.trim() !== "" && s.time.trim() !== "");
    if (validStations.length === 0) {
      alert("Please add at least one valid boarding station.");
      return;
    }
    
    setIsSaving(true);
    let result;
    if (editingEventId) {
      // Fetch existing event to preserve customFields
      const existingEvent = events.find(ev => ev._id === editingEventId);
      result = await updateEvent(editingEventId, newEventName, newEventDate, validStations, existingEvent?.customFields);
    } else {
      result = await createEvent(newEventName, newEventDate, validStations, []);
    }
    setIsSaving(false);

    if (result.success) {
      resetForm();
      fetchEvents();
    } else {
      alert("Failed to save event.");
    }
  };

  const copyLink = (eventShareId: string) => {
    const link = `${window.location.origin}/${eventShareId}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(eventShareId);
    setTimeout(() => setCopiedLink(null), 3000);
  };

  const formatEventDate = (dateStr: string) => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  };

  return (
    <div className="flex w-full min-h-[calc(100vh-64px)] relative overflow-hidden bg-black/20">
      <AdminSidebar activeTab="manage" title="Manage Events" />

      <div className="flex-1 flex flex-col w-full h-[calc(100vh-64px)] overflow-y-auto">
        <div className="p-3 sm:p-4 md:p-8 w-full max-w-6xl mx-auto pb-24 pt-20 md:pt-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Create / Edit Event Section */}
            <div className="lg:col-span-7 bg-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl relative overflow-hidden h-fit">
              <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${editingEventId ? "from-yellow-400 to-orange-500" : "from-rose-600 to-red-700"}`}></div>
              
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">
                  {editingEventId ? "Edit Event" : "Create New Event"}
                </h2>
                {editingEventId && (
                  <button
                    onClick={resetForm}
                    className="text-sm bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded-lg transition-colors"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
              
              <form onSubmit={handleSubmitEvent} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Event Name</label>
                    <input
                      type="text"
                      required
                      value={newEventName}
                      onChange={(e) => setNewEventName(e.target.value)}
                      className="w-full bg-black/20 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-500 transition-all"
                      placeholder="Everest Base Camp"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Date</label>
                    <input
                      type="date"
                      required
                      value={newEventDate}
                      onChange={(e) => setNewEventDate(e.target.value)}
                      className="w-full bg-black/20 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    />
                  </div>
                </div>
                
                <div className="pt-6 border-t border-white/10">
                  <label className="block text-sm font-semibold text-gray-300 mb-4 flex items-center justify-between">
                    Boarding Flow (Stations in order)
                    <button
                      type="button"
                      onClick={addStationField}
                      className="text-xs bg-purple-500/20 text-purple-300 hover:bg-purple-500/40 hover:text-white px-3 py-1.5 rounded-full transition-all flex items-center gap-1"
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
                        className={`flex gap-3 items-center bg-black/10 p-2 rounded-2xl border border-white/5 cursor-grab active:cursor-grabbing transition-transform ${draggedStationIdx === index ? 'opacity-40 scale-[0.98]' : ''}`}
                      >
                        <div className="text-gray-500 px-1 shrink-0 hidden md:block">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8h16M4 16h16"></path></svg>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-white/10 text-white font-bold flex items-center justify-center text-xs shrink-0">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <input
                            type="text"
                            required
                            value={station.name}
                            onChange={(e) => handleStationChange(index, "name", e.target.value)}
                            className="w-full bg-transparent border-none px-2 py-2 text-white focus:outline-none placeholder-gray-500 text-sm"
                            placeholder="Station Name"
                          />
                        </div>
                        <div className="w-[90px] sm:w-[110px] shrink-0 border-l border-white/10 pl-2 sm:pl-3">
                          <input
                            type="time"
                            required
                            value={station.time}
                            onChange={(e) => handleStationChange(index, "time", e.target.value)}
                            className="w-full bg-transparent border-none text-white focus:outline-none text-sm"
                          />
                        </div>
                        
                        <div className="flex flex-col gap-1 border-l border-white/10 pl-2 md:hidden">
                          <button
                            type="button"
                            onClick={() => moveStationUp(index)}
                            disabled={index === 0}
                            className="text-gray-500 hover:text-orange-400 disabled:opacity-30 disabled:hover:text-gray-500 transition-colors"
                            title="Move Up"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 15l7-7 7 7"></path></svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => moveStationDown(index)}
                            disabled={index === stations.length - 1}
                            className="text-gray-500 hover:text-orange-400 disabled:opacity-30 disabled:hover:text-gray-500 transition-colors"
                            title="Move Down"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
                          </button>
                        </div>

                        {stations.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeStationField(index)}
                            className="p-1 ml-1 text-gray-500 hover:text-red-400 transition-colors shrink-0 bg-white/5 hover:bg-red-500/10 rounded-lg"
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
                  className={`w-full mt-8 text-white font-bold py-4 px-4 rounded-2xl shadow-lg transition-all transform active:scale-[0.98] disabled:opacity-70 flex justify-center items-center gap-2 ${
                    editingEventId ? "bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700" : "bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-700 hover:to-red-800"
                  }`}
                >
                  {isSaving ? "Processing..." : (editingEventId ? "Update Event" : "Publish Event")}
                </button>
              </form>
            </div>

            {/* Existing Events List */}
            <div className="lg:col-span-5 space-y-6">
              <h2 className="text-2xl font-bold text-white mb-2">Active Events</h2>
              <div className="space-y-4 pr-2">
                {activeEventsList.length === 0 ? (
                  <div className="bg-white/5 border border-white/10 rounded-3xl p-8 text-center text-gray-400">
                    No active events found.
                  </div>
                ) : (
                  activeEventsList.map(event => (
                    <div key={event._id} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-4 sm:p-6 hover:bg-white/10 transition-colors group">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-white">{event.name}</h3>
                          <p className="text-orange-300 text-sm font-medium">{formatEventDate(event.date)}</p>
                        </div>
                        
                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <button
                              onClick={() => handleEditInit(event)}
                              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-yellow-500/10 text-yellow-300 hover:bg-yellow-500/20 border border-yellow-500/30 rounded-xl text-xs font-semibold transition-colors"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(event._id, event.name)}
                              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-red-500/10 text-red-300 hover:bg-red-500/20 border border-red-500/30 rounded-xl text-xs font-semibold transition-colors"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                              Delete
                            </button>
                          </div>
                      </div>
                      
                      <div className="mb-4">
                        <button 
                          onClick={() => toggleEvent(event._id)}
                          className="text-sm font-semibold text-gray-400 hover:text-white transition-colors flex items-center gap-1 mb-2 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/10"
                        >
                          {expandedEvents[event._id] ? "Hide Stations" : `Show Stations (${event.stations?.length || 0})`}
                          <svg className={`w-4 h-4 transform transition-transform ${expandedEvents[event._id] ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </button>
                        
                        {expandedEvents[event._id] && (
                          <div className="flex flex-wrap gap-2 mt-3 animate-fade-in-up">
                            {event.stations?.map((s: any, idx: number) => (
                              <span key={idx} className="bg-black/30 px-3 py-1.5 rounded-lg text-xs text-gray-300 border border-white/5 flex items-center gap-2">
                                <span className="text-white font-semibold">{s.name}</span>
                                <span className="text-amber-300">{s.time}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => copyLink(event.shareId || event._id)}
                        className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                          copiedLink === (event.shareId || event._id)
                            ? "bg-green-500/20 text-green-300 border border-green-500/50" 
                            : "bg-white/10 text-white hover:bg-white/20 border border-white/10"
                        }`}
                      >
                        {copiedLink === (event.shareId || event._id) ? (
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
                  ))
                )}
              </div>

              {pastEventsList.length > 0 && (
                <>
                  <h2 className="text-xl font-bold text-gray-400 mb-2 mt-8">Past Events</h2>
                  <div className="space-y-4 pr-2 opacity-75">
                    {pastEventsList.map(event => (
                      <div key={event._id} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-4 sm:p-6 hover:bg-white/10 transition-colors group grayscale hover:grayscale-0">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                          <div>
                            <h3 className="text-xl font-bold text-white">{event.name} <span className="ml-2 text-xs bg-gray-700 text-white px-2 py-1 rounded-full">Completed</span></h3>
                            <p className="text-orange-300 text-sm font-medium">{formatEventDate(event.date)}</p>
                          </div>
                          
                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <span className="text-xs font-semibold text-gray-500 bg-gray-800/50 px-3 py-2 rounded-xl border border-gray-700">Archived (Read-Only)</span>
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <button 
                            onClick={() => toggleEvent(event._id)}
                            className="text-sm font-semibold text-gray-400 hover:text-white transition-colors flex items-center gap-1 mb-2 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/10"
                          >
                            {expandedEvents[event._id] ? "Hide Stations" : `Show Stations (${event.stations?.length || 0})`}
                            <svg className={`w-4 h-4 transform transition-transform ${expandedEvents[event._id] ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                          </button>
                          
                          {expandedEvents[event._id] && (
                            <div className="flex flex-wrap gap-2 mt-3 animate-fade-in-up">
                              {event.stations?.map((s: any, idx: number) => (
                                <span key={idx} className="bg-black/30 px-3 py-1.5 rounded-lg text-xs text-gray-300 border border-white/5 flex items-center gap-2">
                                  <span className="text-white font-semibold">{s.name}</span>
                                  <span className="text-amber-300">{s.time}</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
