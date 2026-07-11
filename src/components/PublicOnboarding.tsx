"use client";

import { useState, useEffect } from "react";
import { saveStationSelection, getTreks } from "@/app/actions";
import TicketCard, { TicketData } from "./TicketCard";

export default function PublicOnboarding({ urlTrekShareId }: { urlTrekShareId?: string }) {
  const [treks, setTreks] = useState<any[]>([]);
  const [selectedTrekId, setSelectedTrekId] = useState<string>("");
  const [passengerName, setPassengerName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [boarding, setBoarding] = useState<string>("");
  
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [ticketData, setTicketData] = useState<TicketData | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTreks();
  }, []);

  const fetchTreks = async () => {
    const data = await getTreks();
    setTreks(data);
    
    // Auto-select if a shareId is passed
    if (urlTrekShareId) {
      const trek = data.find((t: any) => t.shareId === urlTrekShareId || t._id === urlTrekShareId);
      if (trek) {
        setSelectedTrekId(trek._id);
      } else {
        // If they have a shareId in the URL but it's invalid, we should error out.
        setErrorMsg("Invalid or expired invite link. Please contact the admin.");
      }
    }
    setIsLoading(false);
  };

  const selectedTrek = treks.find(t => t._id === selectedTrekId);
  const availableStations = selectedTrek ? selectedTrek.stations : [];
  const selectedStationObj = availableStations.find((s: any) => s.name === boarding);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!boarding || !passengerName || !phone || !selectedTrekId) return;
    
    setIsSaving(true);
    setSaved(false);
    setErrorMsg("");
    
    const result = await saveStationSelection(passengerName, phone, boarding, selectedTrekId);
    
    setIsSaving(false);
    if (result.success && selectedTrek && selectedStationObj) {
      setTicketData({
        passengerName,
        phone,
        station: boarding,
        ticketToken: result.ticketToken,
        trekName: selectedTrek.name,
        trekDate: selectedTrek.date,
        stations: selectedTrek.stations
      });
      setSaved(true);
    } else {
      setErrorMsg(result.error || "An error occurred.");
    }
  };

  const handleShare = async () => {
    if (navigator.share && selectedTrek && selectedStationObj) {
      const [hours, minutes] = selectedStationObj.time.split(":");
      const h = parseInt(hours);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const formattedTime = `${h % 12 || 12}:${minutes} ${ampm}`;

      try {
        await navigator.share({
          title: 'My Boarding Info',
          text: `Hey! I'm boarding the ${selectedTrek.name} trek from ${boarding} at ${formattedTime}. My name is ${passengerName}.`,
          url: window.location.href, 
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      alert("Sharing is not supported on this browser.");
    }
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return "";
    const [hours, minutes] = timeStr.split(":");
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${minutes} ${ampm}`;
  };

  const isTrekLocked = Boolean(urlTrekShareId); // ALWAYS true if URL has an ID

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <svg className="animate-spin h-10 w-10 text-orange-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  // If a specific link was used but trek not found, show a dead-end
  if (urlTrekShareId && !selectedTrek) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
        <main className="max-w-md w-full bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-red-500/30 text-center">
           <h2 className="text-2xl font-bold text-white mb-4">Invalid Invite Link</h2>
           <p className="text-gray-300">We couldn't find the trek associated with this link. It may have been deleted or the link is broken.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
      <main className="max-w-md w-full bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-orange-500 via-rose-600 to-amber-500"></div>
        
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black mb-3 text-white drop-shadow-sm tracking-tight">
            Journey Planner
          </h1>
          <p className="text-gray-300 font-medium">
            {isTrekLocked && selectedTrek ? `Complete onboarding for ${selectedTrek.name}` : "Select a trek and boarding station."}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm font-medium text-center">
            {errorMsg}
          </div>
        )}

        {saved && ticketData ? (
          <div className="animate-fadeIn">
            <TicketCard ticket={ticketData} />
            <button 
              onClick={() => {
                setSaved(false);
                setTicketData(null);
                setPassengerName("");
                setPhone("");
                setBoarding("");
              }}
              className="mt-6 w-full text-center text-gray-400 hover:text-white transition-colors text-sm font-medium underline"
            >
              Book another passenger
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
          
          <div>
            <label className="block text-sm font-bold text-gray-200 mb-2 uppercase tracking-wide">
              Passenger Name
            </label>
            <input
              type="text"
              required
              value={passengerName}
              onChange={(e) => {
                setPassengerName(e.target.value);
                setSaved(false);
              }}
              disabled={isSaving}
              className="w-full bg-black/20 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder-gray-500 font-medium text-lg"
              placeholder="e.g. John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-200 mb-2 uppercase tracking-wide">
              Phone Number
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setSaved(false);
              }}
              disabled={isSaving}
              className="w-full bg-black/20 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder-gray-500 font-medium text-lg"
              placeholder="e.g. +91 9876543210"
            />
          </div>

          {!isTrekLocked && (
            <div>
              <label className="block text-sm font-bold text-gray-200 mb-2 uppercase tracking-wide">
                Select Trek
              </label>
              <div className="relative">
                <select
                  required
                  value={selectedTrekId}
                  onChange={(e) => {
                    setSelectedTrekId(e.target.value);
                    setBoarding(""); 
                    setSaved(false);
                  }}
                  disabled={isSaving || treks.length === 0}
                  className="w-full bg-black/20 border border-white/10 rounded-2xl px-5 py-4 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer hover:bg-black/30 disabled:opacity-50 font-medium text-lg"
                >
                  <option value="" disabled className="text-gray-900">
                    {treks.length === 0 ? "No treks available" : "Choose a trek"}
                  </option>
                  {treks.map((trek) => (
                    <option key={trek._id} value={trek._id} className="text-gray-900">
                      {trek.name} ({trek.date})
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-5 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          )}

          {selectedTrekId && availableStations.length > 0 && (
            <div className="animate-fadeIn space-y-4 pt-4 border-t border-white/10">
              <label className="block text-sm font-bold text-gray-200 uppercase tracking-wide">
                Choose Boarding Station
              </label>
              
              <div className="space-y-0 relative before:absolute before:inset-y-6 before:left-[19px] before:w-[2px] before:bg-white/10">
                {availableStations.map((station: any, index: number) => {
                  const isSelected = boarding === station.name;
                  return (
                    <div 
                      key={index} 
                      className={`relative flex items-center gap-5 p-4 rounded-2xl cursor-pointer transition-all duration-300 ${
                        isSelected ? 'bg-gradient-to-r from-orange-500/30 to-rose-500/10 border border-orange-500/50 shadow-lg transform scale-[1.02]' : 'hover:bg-white/5 border border-transparent'
                      }`}
                      onClick={() => {
                        if (!isSaving) {
                          setBoarding(station.name);
                          setSaved(false);
                        }
                      }}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 transition-colors shadow-lg border-2 ${
                        isSelected ? 'bg-orange-500 border-orange-300 text-white' : 'bg-gray-800 border-gray-600 text-gray-400'
                      }`}>
                        {isSelected ? (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                        ) : (
                          <span className="font-bold text-sm">{index + 1}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className={`font-bold text-lg leading-none mb-1 ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                          {station.name}
                        </div>
                        <div className={`text-sm font-medium flex items-center gap-1.5 ${isSelected ? 'text-orange-300' : 'text-gray-500'}`}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                          Reach by {formatTime(station.time)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          <button
            type="submit"
            disabled={!boarding || !passengerName || !phone || !selectedTrekId || isSaving}
            className="w-full mt-8 bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-500 hover:to-red-600 disabled:from-gray-700 disabled:to-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-bold text-lg py-4 px-4 rounded-2xl shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_25px_rgba(249,115,22,0.5)] transform transition-all duration-300 active:scale-[0.98] flex justify-center items-center"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              "Confirm Boarding"
            )}
          </button>

          </form>
        )}
      </main>
    </div>
  );
}
