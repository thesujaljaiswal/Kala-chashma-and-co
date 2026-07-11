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

  const formatTrekDate = (dateStr: string) => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
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
        
        <h1 className="text-5xl md:text-5xl font-black mb-6 text-white drop-shadow-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
          KaalaCHASMA & co
        </h1>
        
        <p className="text-xl text-gray-300 font-medium mb-4">
          Curating unforgettable journey experiences.
        </p>
        
        <a href="https://www.instagram.com/kaalachasma.co/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-orange-400 hover:text-orange-300 transition-colors font-medium">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
          @kaalachasma.co
        </a>
        
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
                    <option key={t._id} value={t._id} className="text-black">{t.name} ({formatTrekDate(t.date)})</option>
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
