"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import AdminDashboard from "@/components/AdminDashboard";
import TicketCard, { TicketData } from "@/components/TicketCard";
import { checkTicketByPhone, getTreks } from "./actions";

export default function Page() {
  const { data: session, status } = useSession();
  const [lookupPhone, setLookupPhone] = useState("");
  const [lookupTrekId, setLookupTrekId] = useState("");
  const [treks, setTreks] = useState<any[]>([]);
  const [ticketData, setTicketData] = useState<TicketData | null>(null);
  const [lookupError, setLookupError] = useState("");
  const [isLookingUp, setIsLookingUp] = useState(false);

  useEffect(() => {
    getTreks().then(data => {
      setTreks(data);
    });
  }, []);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupPhone || !lookupTrekId) return;
    setIsLookingUp(true);
    setLookupError("");
    setTicketData(null);
    
    const res = await checkTicketByPhone(lookupPhone, lookupTrekId);
    setIsLookingUp(false);
    
    if (res.success && res.ticket) {
      setTicketData(res.ticket as TicketData);
    } else {
      setLookupError(res.error || "Ticket not found");
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <svg className="animate-spin h-10 w-10 text-orange-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  // Admin View
  if (session?.user) {
    return <AdminDashboard />;
  }

  // Public Landing Page (Banner only)
  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
      <main className="max-w-2xl w-full bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-12 border border-white/20 relative overflow-hidden text-center">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-500 via-rose-600 to-amber-500"></div>
        
        <h1 className="text-5xl md:text-7xl font-black mb-6 text-white drop-shadow-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
          KALA CHASHMA & CO.
        </h1>
        
        <p className="text-xl text-gray-300 font-medium">
          Curating unforgettable journey experiences.
        </p>
        
        {ticketData ? (
          <div className="mt-12 animate-fadeIn max-w-sm mx-auto">
             <div className="mb-4 text-left">
               <button 
                 onClick={() => setTicketData(null)}
                 className="text-gray-400 hover:text-white transition-colors text-sm font-medium flex items-center gap-1"
               >
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                 Back
               </button>
             </div>
             <TicketCard ticket={ticketData} />
          </div>
        ) : (
          <div className="mt-12 max-w-sm mx-auto bg-black/20 p-6 rounded-2xl border border-white/10">
            <h3 className="text-xl font-bold text-white mb-2">Retrieve Ticket</h3>
            <p className="text-gray-400 text-sm mb-4">Enter your registered phone number to download your boarding pass.</p>
            
            {lookupError && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm font-medium text-center">
                {lookupError}
              </div>
            )}

            <form onSubmit={handleLookup} className="space-y-4 text-left">
              <input
                type="tel"
                required
                value={lookupPhone}
                onChange={(e) => setLookupPhone(e.target.value)}
                disabled={isLookingUp}
                className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all placeholder-gray-500"
                placeholder="e.g. +91 9876543210"
              />
              <div className="relative">
                <select
                  required
                  value={lookupTrekId}
                  onChange={(e) => setLookupTrekId(e.target.value)}
                  disabled={isLookingUp || treks.length === 0}
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all cursor-pointer"
                >
                  <option value="" disabled className="text-black">Select a trek...</option>
                  {treks.map(t => (
                    <option key={t._id} value={t._id} className="text-black">{t.name} ({t.date})</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
              <button
                type="submit"
                disabled={!lookupPhone || !lookupTrekId || isLookingUp}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-colors flex justify-center items-center"
              >
                {isLookingUp ? 'Searching...' : 'Find My Ticket'}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
