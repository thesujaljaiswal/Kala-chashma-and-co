"use client";

import { useState, useEffect } from "react";
import { saveStationSelection, getTreks } from "@/app/actions";
import TicketCard, { TicketData } from "./TicketCard";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";

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

      // Trigger Confetti matching logo colors
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#E86A28', '#1E4E8C', '#C69C6D']
      });

    } else {
      setErrorMsg(result.error || "An error occurred.");
    }
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return "";
    const [hours, minutes] = timeStr.split(":");
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${minutes} ${ampm}`;
  };

  const isTrekLocked = Boolean(urlTrekShareId); 

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-[#FAF9F6]">
        <div className="w-12 h-12 border-4 border-[#E86A28] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (urlTrekShareId && !selectedTrek) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4 bg-[#FAF9F6]">
        <main className="max-w-md w-full bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-8 border border-red-200 text-center">
           <h2 className="text-2xl font-bold text-gray-900 mb-4">Invalid Invite Link</h2>
           <p className="text-gray-600">We couldn't find the trek associated with this link. It may have been deleted or the link is broken.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4 bg-[#FAF9F6] relative overflow-hidden">
      
      {/* Animated Background SVG Mandala */}
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        className="fixed inset-0 z-0 pointer-events-none opacity-10 flex justify-center items-center"
      >
        <svg viewBox="0 0 100 100" className="w-[150vw] h-[150vw] md:w-[80vw] md:h-[80vw] text-[#E86A28]" fill="none" stroke="currentColor" strokeWidth="0.5">
          {[...Array(12)].map((_, i) => (
            <g key={i} transform={`rotate(${i * 30} 50 50)`}>
              <path d="M50 10 Q60 30 50 50 Q40 30 50 10" />
              <circle cx="50" cy="15" r="2" fill="#1E4E8C" stroke="none" />
              <path d="M50 20 Q70 40 50 60 Q30 40 50 20" />
            </g>
          ))}
          <circle cx="50" cy="50" r="40" stroke="#1E4E8C" />
          <circle cx="50" cy="50" r="45" strokeDasharray="2 4" stroke="#C69C6D" />
        </svg>
      </motion.div>

      {/* Floating Animated Orbs */}
      <motion.div
        animate={{ y: [0, -20, 0], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="fixed top-[10%] left-[10%] w-[40vw] h-[40vw] bg-[#1E4E8C]/10 blur-[100px] rounded-full pointer-events-none"
      />
      <motion.div
        animate={{ y: [0, 20, 0], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        className="fixed bottom-[10%] right-[10%] w-[50vw] h-[50vw] bg-[#E86A28]/10 blur-[120px] rounded-full pointer-events-none"
      />

      <motion.main 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="max-w-md w-full bg-white/80 backdrop-blur-2xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-8 border border-white/50 relative z-10"
      >
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#1E4E8C] via-[#C69C6D] to-[#E86A28]"></div>
        
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black mb-3 text-gray-900 tracking-tight">
            Journey Planner
          </h1>
          <p className="text-gray-500 font-medium">
            {isTrekLocked && selectedTrek ? `Complete onboarding for ${selectedTrek.name}` : "Select a trek and boarding station."}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm font-bold text-center animate-shake">
            {errorMsg}
          </div>
        )}

        {saved && ticketData ? (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", bounce: 0.4 }}
          >
            <TicketCard ticket={ticketData} />
            <button 
              onClick={() => {
                setSaved(false);
                setTicketData(null);
                setPassengerName("");
                setPhone("");
                setBoarding("");
              }}
              className="mt-6 w-full text-center text-gray-400 hover:text-[#1E4E8C] transition-colors text-sm font-bold underline"
            >
              Book another passenger
            </button>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
          
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
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
              className="w-full bg-white/90 border border-gray-200 rounded-2xl px-5 py-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1E4E8C]/20 focus:border-[#1E4E8C] transition-all placeholder-gray-400 font-medium text-lg shadow-sm"
              placeholder="e.g. John Doe"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
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
              className="w-full bg-white/90 border border-gray-200 rounded-2xl px-5 py-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1E4E8C]/20 focus:border-[#1E4E8C] transition-all placeholder-gray-400 font-medium text-lg shadow-sm"
              placeholder="e.g. +91 9876543210"
            />
          </div>

          {!isTrekLocked && (
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
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
                  className="w-full bg-white/90 border border-gray-200 rounded-2xl px-5 py-4 text-gray-900 appearance-none focus:outline-none focus:ring-2 focus:ring-[#E86A28]/20 focus:border-[#E86A28] transition-all cursor-pointer shadow-sm disabled:opacity-50 font-medium text-lg"
                >
                  <option value="" disabled>
                    {treks.length === 0 ? "No treks available" : "Choose a trek"}
                  </option>
                  {treks.map((trek) => (
                    <option key={trek._id} value={trek._id}>
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
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="space-y-4 pt-4 border-t border-gray-100"
            >
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                Choose Boarding Station
              </label>
              
              <div className="space-y-3 relative before:absolute before:inset-y-6 before:left-[23px] before:w-[2px] before:bg-gray-200">
                {availableStations.map((station: any, index: number) => {
                  const isSelected = boarding === station.name;
                  return (
                    <motion.div 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      key={index} 
                      className={`relative flex items-center gap-5 p-4 rounded-2xl cursor-pointer transition-all duration-300 ${
                        isSelected ? 'bg-gradient-to-r from-orange-50 to-white border border-[#E86A28]/50 shadow-md' : 'bg-white border border-gray-100 hover:border-gray-300 shadow-sm'
                      }`}
                      onClick={() => {
                        if (!isSaving) {
                          setBoarding(station.name);
                          setSaved(false);
                        }
                      }}
                    >
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 z-10 transition-colors shadow-sm border-2 ${
                        isSelected ? 'bg-[#E86A28] border-[#C69C6D] text-white' : 'bg-white border-gray-200 text-gray-400'
                      }`}>
                        {isSelected ? (
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                        ) : (
                          <span className="font-bold text-lg">{index + 1}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className={`font-bold text-lg leading-none mb-1 ${isSelected ? 'text-[#1E4E8C]' : 'text-gray-700'}`}>
                          {station.name}
                        </div>
                        <div className={`text-sm font-medium flex items-center gap-1.5 ${isSelected ? 'text-[#E86A28]' : 'text-gray-500'}`}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                          Reach by {formatTime(station.time)}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
          
          <button
            type="submit"
            disabled={!boarding || !passengerName || !phone || !selectedTrekId || isSaving}
            className="w-full mt-8 bg-gradient-to-r from-[#1E4E8C] to-[#E86A28] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-lg py-4 px-4 rounded-2xl shadow-[0_8px_20px_rgba(232,106,40,0.3)] transform transition-all duration-300 active:scale-[0.98] flex justify-center items-center"
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
      </motion.main>
    </div>
  );
}
