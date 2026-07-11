"use client";

import { useState, useEffect } from "react";
import { getTreks, getSelectionsByTrek, createTrek, updateTrek, deleteTrek, togglePassengerArrival } from "@/app/actions";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"onboarding" | "manage" | "checkin">("manage");
  const [treks, setTreks] = useState<any[]>([]);
  const [selectedTrekId, setSelectedTrekId] = useState<string>("");
  const [selections, setSelections] = useState<any[]>([]);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [selectedStationName, setSelectedStationName] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [expandedTreks, setExpandedTreks] = useState<Record<string, boolean>>({});

  const toggleTrek = (id: string) => {
    setExpandedTreks(prev => ({...prev, [id]: !prev[id]}));
  };
  
  // Sorting State
  const [sortField, setSortField] = useState<"name" | "station" | "time">("time");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  
  // Create / Edit Trek Form State
  const [editingTrekId, setEditingTrekId] = useState<string | null>(null);
  const [newTrekName, setNewTrekName] = useState("");
  const [newTrekDate, setNewTrekDate] = useState("");
  const [stations, setStations] = useState([{ name: "", time: "" }]);
  const [isSaving, setIsSaving] = useState(false);
  const [draggedStationIdx, setDraggedStationIdx] = useState<number | null>(null);

  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const fetchTreks = async () => {
    const data = await getTreks();
    setTreks(data);
    if (data.length > 0 && !selectedTrekId) {
      setSelectedTrekId(data[0]._id);
      return data[0]._id;
    }
    return null;
  };

  useEffect(() => {
    const initialize = async () => {
      setIsInitialLoading(true);
      const firstId = await fetchTreks();
      if (firstId) {
        await fetchSelections(firstId);
      }
      setIsInitialLoading(false);
    };
    initialize();
  }, []);

  useEffect(() => {
    if (selectedTrekId && !isInitialLoading) {
      fetchSelections(selectedTrekId);
    } else if (!selectedTrekId && !isInitialLoading) {
      setSelections([]);
    }
  }, [selectedTrekId]);

  const fetchSelections = async (id: string) => {
    const data = await getSelectionsByTrek(id);
    setSelections(data);
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
    setEditingTrekId(null);
    setNewTrekName("");
    setNewTrekDate("");
    setStations([{ name: "", time: "" }]);
  };

  const handleEditInit = (trek: any) => {
    setEditingTrekId(trek._id);
    setNewTrekName(trek.name);
    setNewTrekDate(trek.date);
    setStations(trek.stations.length > 0 ? trek.stations.map((s:any) => ({ name: s.name, time: s.time })) : [{ name: "", time: "" }]);
    // Scroll to top of the form smoothly
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to permanently delete "${name}"? This will also wipe all passenger records for this trek.`)) {
      const result = await deleteTrek(id);
      if (result.success) {
        if (editingTrekId === id) resetForm();
        if (selectedTrekId === id) setSelectedTrekId("");
        fetchTreks();
      } else {
        alert("Failed to delete trek.");
      }
    }
  };

  const handleSubmitTrek = async (e: React.FormEvent) => {
    e.preventDefault();
    const validStations = stations.filter(s => s.name.trim() !== "" && s.time.trim() !== "");
    if (validStations.length === 0) {
      alert("Please add at least one valid boarding station.");
      return;
    }
    
    setIsSaving(true);
    let result;
    if (editingTrekId) {
      result = await updateTrek(editingTrekId, newTrekName, newTrekDate, validStations);
    } else {
      result = await createTrek(newTrekName, newTrekDate, validStations);
    }
    setIsSaving(false);

    if (result.success) {
      resetForm();
      fetchTreks();
    } else {
      alert("Failed to save trek.");
    }
  };

  const copyLink = (trekShareId: string) => {
    const link = `${window.location.origin}/${trekShareId}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(trekShareId);
    setTimeout(() => setCopiedLink(null), 3000);
  };

  const handleSort = (field: "name" | "station" | "time") => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const getSortedSelections = () => {
    const activeTrek = treks.find(t => t._id === selectedTrekId);
    
    return [...selections].sort((a, b) => {
      // 1. Primary Sort by Station Rank (Ascending)
      let aRank = 9999;
      let bRank = 9999;
      if (activeTrek && activeTrek.stations) {
        const aIdx = activeTrek.stations.findIndex((s: any) => s.name === a.station);
        const bIdx = activeTrek.stations.findIndex((s: any) => s.name === b.station);
        if (aIdx !== -1) aRank = aIdx;
        if (bIdx !== -1) bRank = bIdx;
      }
      
      if (aRank !== bRank) {
        return aRank - bRank;
      }
      
      // 2. Secondary Sort by User's sortField and sortOrder
      let aVal, bVal;
      if (sortField === "name") {
        aVal = (a.passengerName || "").toLowerCase();
        bVal = (b.passengerName || "").toLowerCase();
      } else if (sortField === "station") {
        aVal = (a.station || "").toLowerCase();
        bVal = (b.station || "").toLowerCase();
      } else {
        aVal = new Date(a.createdAt).getTime();
        bVal = new Date(b.createdAt).getTime();
      }
      
      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  };

  const renderSortIcon = (field: "name" | "station" | "time") => {
    if (sortField !== field) return <span className="text-gray-600 ml-1 text-xs">↕</span>;
    return sortOrder === "asc" ? <span className="text-orange-400 ml-1 text-xs">↑</span> : <span className="text-orange-400 ml-1 text-xs">↓</span>;
  };

  const sortedSelections = getSortedSelections();

  const formatTrekDate = (dateStr: string) => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  };

  if (isInitialLoading) {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-[calc(100vh-64px)] bg-black/20 gap-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '-0.3s' }}></div>
          <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '-0.15s' }}></div>
          <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce"></div>
        </div>
        <div className="text-gray-400 font-medium text-sm animate-pulse mt-2">Fetching Data...</div>
      </div>
    );
  }

  return (
    <div className="flex w-full min-h-[calc(100vh-64px)] relative overflow-hidden bg-black/20">
      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 border-r border-white/10 transform transition-transform duration-300 md:relative md:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex flex-col h-full p-4">
          <div className="flex items-center justify-between mb-8 mt-2 md:justify-center">
            <h1 className="text-xl font-extrabold text-white text-center drop-shadow-md">Admin Panel</h1>
            <button className="md:hidden text-gray-400 hover:text-white" onClick={() => setIsSidebarOpen(false)}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
          
          <div className="flex flex-col gap-3">
            <button
              onClick={() => { setActiveTab("manage"); setIsSidebarOpen(false); }}
              className={`w-full text-left px-4 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-3 ${
                activeTab === "manage" ? "bg-gradient-to-r from-rose-600 to-red-700 text-white shadow-lg" : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
              Manage Treks
            </button>
            <button
              onClick={() => { setActiveTab("onboarding"); setIsSidebarOpen(false); }}
              className={`w-full text-left px-4 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-3 ${
                activeTab === "onboarding" ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg" : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
              Onboarding List
            </button>
            <button
              onClick={() => { setActiveTab("checkin"); setIsSidebarOpen(false); }}
              className={`w-full text-left px-4 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-3 ${
                activeTab === "checkin" ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg" : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              Check-in
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col w-full h-[calc(100vh-64px)] overflow-y-auto">
        {/* Mobile Header (Hamburger) */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-white/10 bg-gray-900/80 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="text-gray-300 hover:text-white p-1 mr-3"
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            </button>
            <h2 className="text-lg font-bold text-white tracking-wide">
              {activeTab === "manage" && "Manage Treks"}
              {activeTab === "onboarding" && "Onboarding List"}
              {activeTab === "checkin" && "Station Check-in"}
            </h2>
          </div>
        </div>

        <div className="p-4 md:p-8 w-full max-w-6xl mx-auto pb-24">

      {activeTab === "manage" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Create / Edit Trek Section */}
          <div className="lg:col-span-7 bg-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden h-fit">
            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${editingTrekId ? "from-yellow-400 to-orange-500" : "from-rose-600 to-red-700"}`}></div>
            
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">
                {editingTrekId ? "Edit Trek" : "Create New Trek"}
              </h2>
              {editingTrekId && (
                <button
                  onClick={resetForm}
                  className="text-sm bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded-lg transition-colors"
                >
                  Cancel Edit
                </button>
              )}
            </div>
            
            <form onSubmit={handleSubmitTrek} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Trek Name</label>
                  <input
                    type="text"
                    required
                    value={newTrekName}
                    onChange={(e) => setNewTrekName(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-500 transition-all"
                    placeholder="Everest Base Camp"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Date</label>
                  <input
                    type="date"
                    required
                    value={newTrekDate}
                    onChange={(e) => setNewTrekDate(e.target.value)}
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
                      <div className="w-[110px] shrink-0 border-l border-white/10 pl-3">
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
                  editingTrekId ? "bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700" : "bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-700 hover:to-red-800"
                }`}
              >
                {isSaving ? "Processing..." : (editingTrekId ? "Update Trek" : "Publish Trek")}
              </button>
            </form>
          </div>

          {/* Existing Treks List */}
          <div className="lg:col-span-5 space-y-6">
            <h2 className="text-2xl font-bold text-white mb-2">Active Treks</h2>
            <div className="space-y-4 pr-2">
              {treks.length === 0 ? (
                <div className="bg-white/5 border border-white/10 rounded-3xl p-8 text-center text-gray-400">
                  No treks created yet.
                </div>
              ) : (
                treks.map(trek => (
                  <div key={trek._id} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 hover:bg-white/10 transition-colors group">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-white">{trek.name}</h3>
                        <p className="text-orange-300 text-sm font-medium">{formatTrekDate(trek.date)}</p>
                      </div>
                      
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => handleEditInit(trek)}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-yellow-500/10 text-yellow-300 hover:bg-yellow-500/20 border border-yellow-500/30 rounded-xl text-xs font-semibold transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(trek._id, trek.name)}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-red-500/10 text-red-300 hover:bg-red-500/20 border border-red-500/30 rounded-xl text-xs font-semibold transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                          Delete
                        </button>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <button 
                        onClick={() => toggleTrek(trek._id)}
                        className="text-sm font-semibold text-gray-400 hover:text-white transition-colors flex items-center gap-1 mb-2 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/10"
                      >
                        {expandedTreks[trek._id] ? "Hide Stations" : `Show Stations (${trek.stations?.length || 0})`}
                        <svg className={`w-4 h-4 transform transition-transform ${expandedTreks[trek._id] ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </button>
                      
                      {expandedTreks[trek._id] && (
                        <div className="flex flex-wrap gap-2 mt-3 animate-fade-in-up">
                          {trek.stations?.map((s: any, idx: number) => (
                            <span key={idx} className="bg-black/30 px-3 py-1.5 rounded-lg text-xs text-gray-300 border border-white/5 flex items-center gap-2">
                              <span className="text-white font-semibold">{s.name}</span>
                              <span className="text-amber-300">{s.time}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => copyLink(trek.shareId || trek._id)}
                      className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                        copiedLink === (trek.shareId || trek._id)
                          ? "bg-green-500/20 text-green-300 border border-green-500/50" 
                          : "bg-white/10 text-white hover:bg-white/20 border border-white/10"
                      }`}
                    >
                      {copiedLink === (trek.shareId || trek._id) ? (
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
          </div>
        </div>
      )}

      {activeTab === "onboarding" && (
        <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-amber-500"></div>
          
          <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between items-center bg-black/20 p-4 rounded-2xl border border-white/5">
            <h2 className="text-xl font-bold text-white">Passenger Manifest</h2>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <span className="text-sm text-gray-400 font-medium">Filter by Trek:</span>
              <select
                value={selectedTrekId}
                onChange={(e) => setSelectedTrekId(e.target.value)}
                className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-64 font-medium appearance-none"
              >
                <option value="" className="text-black">Select a Trek</option>
                {treks.map(t => (
                  <option key={t._id} value={t._id} className="text-black">{t.name} ({formatTrekDate(t.date)})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex md:hidden items-center gap-3 w-full mb-4 bg-black/20 p-3 rounded-2xl border border-white/5">
            <span className="text-sm text-gray-400 font-medium whitespace-nowrap">Sort by:</span>
            <select
              value={`${sortField}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortField(field as "name" | "station" | "time");
                setSortOrder(order as "asc" | "desc");
              }}
              className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-sm appearance-none"
            >
              <option value="time-desc" className="text-black">Time (Latest to Oldest)</option>
              <option value="time-asc" className="text-black">Time (Oldest to Latest)</option>
              <option value="name-asc" className="text-black">Alphabetical (A-Z)</option>
              <option value="name-desc" className="text-black">Alphabetical (Z-A)</option>
            </select>
          </div>

          <div className="block md:hidden space-y-4">
            {sortedSelections.length === 0 ? (
              <div className="py-12 text-center text-gray-400 font-medium bg-black/20 rounded-2xl border border-white/10">
                No passengers have boarded this trek yet.
              </div>
            ) : (
              sortedSelections.map((sel) => (
                <div key={sel._id} className="bg-black/20 border border-white/10 p-4 rounded-2xl flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-bold text-white">{sel.passengerName}</h3>
                    <span className="bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/30 px-3 py-1 rounded-full text-xs font-semibold text-orange-200">
                      {sel.station}
                    </span>
                  </div>
                  <div className="text-gray-400 font-medium text-sm flex justify-between items-center">
                    <span className="text-gray-300">{sel.phone}</span>
                    <span className="text-gray-500 text-xs">{new Date(sel.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="hidden md:block overflow-x-auto rounded-2xl border border-white/10 bg-black/20 custom-scrollbar">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 select-none">
                  <th className="py-5 px-6 font-semibold text-gray-300 cursor-pointer hover:bg-white/10 transition-colors rounded-tl-xl" onClick={() => handleSort("name")}>
                    Passenger Name {renderSortIcon("name")}
                  </th>
                  <th className="py-5 px-6 font-semibold text-gray-300">Phone</th>
                  <th className="py-5 px-6 font-semibold text-gray-300 cursor-pointer hover:bg-white/10 transition-colors" onClick={() => handleSort("station")}>
                    Boarding Station {renderSortIcon("station")}
                  </th>
                  <th className="py-5 px-6 font-semibold text-gray-300 text-right cursor-pointer hover:bg-white/10 transition-colors rounded-tr-xl" onClick={() => handleSort("time")}>
                    Submitted At {renderSortIcon("time")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedSelections.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-gray-400 font-medium">
                      No passengers have boarded this trek yet.
                    </td>
                  </tr>
                ) : (
                  sortedSelections.map((sel, idx) => (
                    <tr key={sel._id} className={`border-b border-white/5 hover:bg-white/10 transition-colors ${idx % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.02]'}`}>
                      <td className="py-5 px-6 text-white font-bold text-lg">{sel.passengerName}</td>
                      <td className="py-5 px-6 text-gray-300">{sel.phone}</td>
                      <td className="py-5 px-6">
                        <span className="bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/30 px-4 py-1.5 rounded-full text-sm font-semibold text-orange-200 inline-block">
                          {sel.station}
                        </span>
                      </td>
                      <td className="py-5 px-6 text-gray-400 text-sm text-right font-medium">
                        {new Date(sel.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "checkin" && (
        <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-500"></div>
          
          <div className="mb-8 flex flex-col md:flex-row gap-4 justify-between items-center bg-black/20 p-4 rounded-2xl border border-white/5">
            <h2 className="text-xl font-bold text-white">Station Check-in</h2>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <span className="text-sm text-gray-400 font-medium">Select Trek:</span>
              <select
                value={selectedTrekId}
                onChange={(e) => setSelectedTrekId(e.target.value)}
                className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-64 font-medium appearance-none"
              >
                <option value="" className="text-black">Select a Trek</option>
                {treks.map(t => (
                  <option key={t._id} value={t._id} className="text-black">{t.name} ({formatTrekDate(t.date)})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {treks.find(t => t._id === selectedTrekId)?.stations.map((station: any, idx: number) => {
              const stationSelections = selections.filter(s => s.station === station.name);
              const total = stationSelections.length;
              const arrived = stationSelections.filter(s => s.arrived).length;
              const left = total - arrived;
              
              return (
                <div 
                  key={idx} 
                  onClick={() => setSelectedStationName(station.name)}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-6 cursor-pointer transition-colors group relative overflow-hidden"
                >
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-green-400 transition-colors">{station.name}</h3>
                  <div className="flex gap-4 text-sm font-medium">
                    <div className="flex flex-col">
                      <span className="text-gray-400">Total</span>
                      <span className="text-2xl text-white">{total}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-400">Arrived</span>
                      <span className="text-2xl text-green-400">{arrived}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-400">Remaining</span>
                      <span className="text-2xl text-orange-400">{left}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedStationName && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-white/20 rounded-3xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-gray-800">
              <h3 className="text-2xl font-bold text-white">
                {selectedStationName} Check-in
              </h3>
              <button 
                onClick={() => setSelectedStationName(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              <div className="space-y-3">
                {selections.filter(s => s.station === selectedStationName).length === 0 ? (
                  <div className="text-center text-gray-400 py-8">No passengers for this station.</div>
                ) : (
                  selections.filter(s => s.station === selectedStationName).map(sel => (
                    <div key={sel._id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-white/5 border border-white/10 p-4 rounded-xl hover:bg-white/10 transition-colors gap-3 sm:gap-2">
                      <div className="flex-1 min-w-0 w-full">
                        <div className="font-bold text-lg text-white truncate">{sel.passengerName}</div>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-1.5">
                          <span className="text-gray-400 text-sm">{sel.phone}</span>
                          <div className="flex items-center gap-2">
                            <a 
                              href={`tel:${sel.phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-blue-400 hover:text-blue-300 bg-blue-400/10 hover:bg-blue-400/20 px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                              Call
                            </a>
                            <a 
                              href={`https://wa.me/${sel.phone.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-emerald-400 hover:text-emerald-300 bg-emerald-400/10 hover:bg-emerald-400/20 px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors"
                            >
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"></path></svg>
                              WhatsApp
                            </a>
                          </div>
                        </div>
                      </div>
                      <label className="flex items-center justify-between sm:justify-end gap-3 cursor-pointer w-full sm:w-auto pt-3 border-t border-white/10 sm:pt-0 sm:border-0 shrink-0">
                        <span className={`font-semibold ${sel.arrived ? 'text-green-400' : 'text-gray-500'}`}>
                          {sel.arrived ? 'Arrived' : 'Not Arrived'}
                        </span>
                        <input 
                          type="checkbox" 
                          checked={sel.arrived || false}
                          onChange={async (e) => {
                            const newArrived = e.target.checked;
                            setSelections(prev => prev.map(p => p._id === sel._id ? { ...p, arrived: newArrived } : p));
                            await togglePassengerArrival(sel._id, newArrived);
                          }}
                          className="w-6 h-6 rounded border-gray-600 text-green-500 focus:ring-green-500 focus:ring-offset-gray-900"
                        />
                      </label>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
}
