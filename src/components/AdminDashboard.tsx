"use client";

import { useState, useEffect } from "react";
import { getTreks, getSelectionsByTrek, createTrek, updateTrek, deleteTrek } from "@/app/actions";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"onboarding" | "manage">("manage");
  const [treks, setTreks] = useState<any[]>([]);
  const [selectedTrekId, setSelectedTrekId] = useState<string>("");
  const [selections, setSelections] = useState<any[]>([]);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  
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

  useEffect(() => {
    fetchTreks();
  }, []);

  useEffect(() => {
    if (selectedTrekId) {
      fetchSelections(selectedTrekId);
    } else {
      setSelections([]);
    }
  }, [selectedTrekId]);

  const fetchTreks = async () => {
    const data = await getTreks();
    setTreks(data);
    if (data.length > 0 && !selectedTrekId) {
      setSelectedTrekId(data[0]._id);
    }
  };

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
    return [...selections].sort((a, b) => {
      let aVal, bVal;
      if (sortField === "name") {
        aVal = (a.passengerName || "").toLowerCase();
        bVal = (b.passengerName || "").toLowerCase();
      } else if (sortField === "station") {
        aVal = (a.station || "").toLowerCase();
        bVal = (b.station || "").toLowerCase();
      } else {
        const aTime = new Date(a.createdAt).getTime();
        const bTime = new Date(b.createdAt).getTime();
        return sortOrder === "asc" ? aTime - bTime : bTime - aTime;
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

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <h1 className="text-3xl font-extrabold text-white mb-4 md:mb-0 drop-shadow-md">Admin Dashboard</h1>
        
        <div className="flex space-x-2 bg-white/10 p-1.5 rounded-2xl border border-white/10 shadow-xl backdrop-blur-sm">
          <button
            onClick={() => setActiveTab("manage")}
            className={`px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
              activeTab === "manage" ? "bg-gradient-to-r from-rose-600 to-red-700 text-white shadow-lg" : "text-gray-300 hover:text-white hover:bg-white/5"
            }`}
          >
            Manage Treks
          </button>
          <button
            onClick={() => setActiveTab("onboarding")}
            className={`px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
              activeTab === "onboarding" ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg" : "text-gray-300 hover:text-white hover:bg-white/5"
            }`}
          >
            Onboarding List
          </button>
        </div>
      </div>

      {activeTab === "manage" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Create / Edit Trek Section */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl relative overflow-hidden h-fit">
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
                      <div className="w-1/3 border-l border-white/10 pl-3">
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
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-2">Active Treks</h2>
            <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
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
                        <p className="text-orange-300 text-sm font-medium">{trek.date}</p>
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
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {trek.stations.map((s: any, idx: number) => (
                        <span key={idx} className="bg-black/30 px-3 py-1.5 rounded-lg text-xs text-gray-300 border border-white/5 flex items-center gap-2">
                          <span className="text-white font-semibold">{s.name}</span>
                          <span className="text-amber-300">{s.time}</span>
                        </span>
                      ))}
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
          
          <div className="mb-8 flex flex-col md:flex-row gap-4 justify-between items-center bg-black/20 p-4 rounded-2xl border border-white/5">
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
                  <option key={t._id} value={t._id} className="text-black">{t.name} ({t.date})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/20 custom-scrollbar">
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
    </div>
  );
}
