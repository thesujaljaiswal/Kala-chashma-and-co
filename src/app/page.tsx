"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import TicketCard, { TicketData } from "@/components/TicketCard";
import { checkTicketByPhone, getEvents } from "./actions";
import { motion } from "framer-motion";

export default function Page() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [lookupPhone, setLookupPhone] = useState("");
  const [lookupEventId, setLookupEventId] = useState("");
  const [events, setEvents] = useState<any[]>([]);
  const [ticketData, setTicketData] = useState<TicketData | null>(null);
  const [lookupError, setLookupError] = useState("");
  const [isLookingUp, setIsLookingUp] = useState(false);

  useEffect(() => {
    getEvents().then(data => setEvents(data));
  }, []);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupPhone || !lookupEventId) return;
    setIsLookingUp(true);
    setLookupError("");
    setTicketData(null);
    
    const res = await checkTicketByPhone(lookupPhone, lookupEventId);
    setIsLookingUp(false);
    
    if (res.success && res.ticket) {
      setTicketData(res.ticket as TicketData);
    } else {
      setLookupError(res.error || "Ticket not found");
    }
  };

  const formatEventDate = (dateStr: string) => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">
        <div className="w-12 h-12 border-4 border-[#E86A28] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-[#FAF9F6] text-gray-900 selection:bg-[#E86A28] selection:text-white font-sans overflow-hidden relative">
      
      {/* Background Mandala Elements - Light Theme */}
      <div className="fixed inset-0 z-0 pointer-events-none flex justify-center items-center overflow-hidden mix-blend-multiply">
        {/* Giant Rotating Mandala */}
        <motion.svg 
          animate={{ rotate: 360 }}
          transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
          viewBox="0 0 100 100" 
          className="absolute w-[120vw] h-[120vw] md:w-[70vw] md:h-[70vw] text-[#C69C6D]/20" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="0.3"
        >
          {[...Array(24)].map((_, i) => (
            <g key={i} transform={`rotate(${i * 15} 50 50)`}>
              <path d="M50 10 Q60 30 50 50 Q40 30 50 10" />
              <circle cx="50" cy="15" r="1.5" />
              <path d="M50 20 Q70 40 50 60 Q30 40 50 20" />
              <path d="M50 30 L60 50 L50 70 L40 50 Z" />
              <circle cx="50" cy="50" r="10" strokeDasharray="1 2" />
            </g>
          ))}
          <circle cx="50" cy="50" r="40" />
          <circle cx="50" cy="50" r="45" strokeDasharray="2 4" />
          <circle cx="50" cy="50" r="30" stroke="#1E4E8C" strokeWidth="0.1" strokeOpacity="0.3" />
        </motion.svg>
      </div>

      {/* Subtle Light Glows */}
      <div className="fixed inset-0 z-0 pointer-events-none mix-blend-multiply">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#E86A28]/10 blur-[100px] rounded-full animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#1E4E8C]/10 blur-[120px] rounded-full animate-pulse-slow delay-1000"></div>
      </div>

      <main className="relative z-10 w-full max-w-7xl mx-auto px-6 pt-14 pb-32 flex flex-col gap-32">
        
        {/* HERO SECTION */}
        <section className="flex flex-col lg:flex-row items-center justify-between gap-16 min-h-[80vh]">
          <div className="flex-1 space-y-8 animate-slideUpFade">
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[1.1]">
              <span className="block text-gray-900">
                KALA CHASHMA
              </span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#E86A28] via-[#C69C6D] to-[#1E4E8C]">
                & CO.
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 font-medium max-w-xl leading-relaxed">
              We curate high-energy expeditions, legendary parties, and unforgettable friendships rooted in rich Indian heritage.
            </p>

            <a href="https://www.instagram.com/kaalachasma.co/" target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-3 px-8 py-4 bg-white/80 hover:bg-white border border-gray-200 backdrop-blur-lg shadow-lg rounded-2xl transition-all duration-300 font-bold text-lg hover:scale-105 text-[#1E4E8C]">
              <svg className="w-6 h-6 text-[#E86A28] group-hover:text-[#C69C6D] transition-colors" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              @kaalachasma.co
            </a>
          </div>

          {/* TICKET RETRIEVAL COMPONENT */}
          <div className="flex-1 w-full max-w-md relative animate-slideUpFade" style={{ animationDelay: '0.2s' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-[#E86A28] to-[#1E4E8C] rounded-3xl blur-2xl opacity-10 animate-pulse-slow"></div>
            <div className="relative bg-white/70 backdrop-blur-2xl border border-white/50 p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
              {ticketData ? (
                <div className="animate-fadeIn">
                  <button 
                    onClick={() => setTicketData(null)}
                    className="mb-6 text-gray-500 hover:text-gray-900 transition-colors text-sm font-bold flex items-center gap-2 bg-gray-100/80 px-4 py-2 rounded-full w-fit"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                    Back to Search
                  </button>
                  <TicketCard ticket={ticketData} />
                </div>
              ) : (
                <>
                  <div className="mb-8">
                    <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">Your Boarding Pass 🎫</h3>
                    <p className="text-gray-600 font-medium">Enter your number to retrieve your ticket.</p>
                  </div>
                  
                  {lookupError && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm font-bold text-center animate-shake">
                      {lookupError}
                    </div>
                  )}

                  <form onSubmit={handleLookup} className="space-y-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Phone Number</label>
                      <input
                        type="tel"
                        required
                        value={lookupPhone}
                        onChange={(e) => setLookupPhone(e.target.value)}
                        disabled={isLookingUp}
                        className="w-full bg-white/80 border border-gray-200 rounded-2xl px-5 py-4 text-gray-900 focus:outline-none focus:border-[#E86A28] focus:ring-2 focus:ring-[#E86A28]/20 transition-all font-medium text-lg placeholder-gray-400 shadow-sm"
                        placeholder="+91 98765 43210"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Select Event</label>
                      <div className="relative">
                        <select
                          required
                          value={lookupEventId}
                          onChange={(e) => setLookupEventId(e.target.value)}
                          disabled={isLookingUp || events.length === 0}
                          className="w-full bg-white/80 border border-gray-200 rounded-2xl px-5 py-4 text-gray-900 appearance-none focus:outline-none focus:border-[#1E4E8C] focus:ring-2 focus:ring-[#1E4E8C]/20 transition-all font-medium text-lg cursor-pointer shadow-sm"
                        >
                          <option value="" disabled>Choose your adventure...</option>
                          {events.map(t => (
                            <option key={t._id} value={t._id}>{t.name} ({formatEventDate(t.date)})</option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-5 pointer-events-none text-gray-400">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={!lookupPhone || !lookupEventId || isLookingUp}
                      className="w-full bg-gradient-to-r from-[#1E4E8C] to-[#E86A28] hover:opacity-90 disabled:opacity-50 text-white font-black py-4 px-6 rounded-2xl shadow-[0_8px_20px_rgba(232,106,40,0.3)] transition-all duration-300 hover:scale-[1.02] active:scale-95 flex justify-center items-center text-lg mt-4"
                    >
                      {isLookingUp ? (
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        'Retrieve Ticket'
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </section>

        {/* CLIPART GRID: AESTHETICS & HERITAGE (LIGHT THEME) */}
        <section className="space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-6xl font-black text-gray-900">
              The Essence
            </h2>
            <p className="text-gray-600 text-lg md:text-xl max-w-2xl mx-auto font-medium">
              Vibrant graphics. Indian heritage. Pure energy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Heritage Card */}
            <div className="group relative bg-white/80 overflow-hidden border border-gray-100 shadow-md rounded-[2.5rem] p-10 flex flex-col items-center text-center transition-all duration-500 hover:-translate-y-3 hover:shadow-[0_20px_40px_rgba(232,106,40,0.15)] backdrop-blur-xl">
              {/* Background Art */}
              <div className="absolute -left-16 -top-16 w-48 h-48 bg-gradient-to-br from-[#E86A28]/20 to-transparent rounded-full blur-[40px] group-hover:bg-[#E86A28]/40 group-hover:scale-150 transition-all duration-700 pointer-events-none"></div>
              
              <div className="absolute inset-0 opacity-[0.02] pointer-events-none group-hover:opacity-[0.1] group-hover:scale-150 group-hover:rotate-[30deg] transition-all duration-1000 ease-out text-[#E86A28] flex items-center justify-center">
                <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1" className="w-[150%] h-[150%]">
                  <path d="M50 10 Q60 30 50 50 Q40 30 50 10" />
                  <path d="M50 20 Q70 40 50 60 Q30 40 50 20" />
                  <circle cx="50" cy="50" r="40" strokeDasharray="4 8" />
                </svg>
              </div>

              <div className="w-32 h-32 mb-8 text-[#E86A28] relative z-10 group-hover:scale-125 group-hover:-rotate-6 transition-transform duration-500 drop-shadow-xl group-hover:drop-shadow-[0_0_20px_rgba(232,106,40,0.5)]">
                <svg viewBox="0 0 100 100" fill="currentColor" className="w-full h-full">
                  <path d="M20 90 L20 40 Q20 20 50 20 Q80 20 80 40 L80 90 L60 90 L60 50 Q60 40 50 40 Q40 40 40 50 L40 90 Z" />
                  <circle cx="50" cy="15" r="5" fill="#C69C6D"/>
                  <rect x="25" y="50" width="10" height="20" fill="#1E4E8C" />
                  <rect x="65" y="50" width="10" height="20" fill="#1E4E8C" />
                </svg>
              </div>
              <h3 className="text-3xl font-black text-gray-900 mb-3 relative z-10 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-[#E86A28] group-hover:to-[#C69C6D] transition-colors">Heritage</h3>
              <p className="text-gray-500 font-medium text-sm leading-relaxed relative z-10 group-hover:text-gray-700 transition-colors">Deeply rooted in Indian culture, representing unity and history.</p>
            </div>

            {/* Exploration Card */}
            <div className="group relative bg-white/80 overflow-hidden border border-gray-100 shadow-md rounded-[2.5rem] p-10 flex flex-col items-center text-center transition-all duration-500 hover:-translate-y-3 hover:shadow-[0_20px_40px_rgba(30,78,140,0.15)] backdrop-blur-xl mt-4 md:mt-12">
              {/* Background Art */}
              <div className="absolute -right-16 -bottom-16 w-48 h-48 bg-gradient-to-tl from-[#1E4E8C]/20 to-transparent rounded-full blur-[40px] group-hover:bg-[#1E4E8C]/40 group-hover:scale-150 transition-all duration-700 pointer-events-none"></div>

              <div className="absolute inset-0 opacity-[0.02] pointer-events-none group-hover:opacity-[0.1] group-hover:scale-[2] group-hover:-translate-y-10 transition-all duration-1000 ease-out text-[#1E4E8C] flex items-center justify-center">
                 <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2" className="w-[150%] h-[150%]">
                    <path d="M10 90 L50 20 L90 90 Z" />
                    <path d="M30 90 L50 50 L70 90 Z" strokeDasharray="2 4" />
                 </svg>
              </div>

              <div className="w-32 h-32 mb-8 text-[#1E4E8C] relative z-10 group-hover:scale-125 group-hover:translate-y-[-10px] transition-transform duration-500 drop-shadow-xl group-hover:drop-shadow-[0_0_20px_rgba(30,78,140,0.5)]">
                <svg viewBox="0 0 100 100" fill="currentColor" className="w-full h-full">
                  <path d="M10 90 L40 40 L60 60 L80 20 L95 90 Z" />
                  <path d="M40 40 L50 55 L35 60 Z" fill="#C69C6D" opacity="0.8"/>
                  <path d="M80 20 L85 45 L70 40 Z" fill="#C69C6D" opacity="0.8"/>
                  <circle cx="70" cy="20" r="8" fill="#E86A28" />
                </svg>
              </div>
              <h3 className="text-3xl font-black text-gray-900 mb-3 relative z-10 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-[#1E4E8C] group-hover:to-[#417bc9] transition-colors">Exploration</h3>
              <p className="text-gray-500 font-medium text-sm leading-relaxed relative z-10 group-hover:text-gray-700 transition-colors">Conquer the peaks and find yourself amidst nature's giants.</p>
            </div>

            {/* The Party Card */}
            <div className="group relative bg-white/80 overflow-hidden border border-gray-100 shadow-md rounded-[2.5rem] p-10 flex flex-col items-center text-center transition-all duration-500 hover:-translate-y-3 hover:shadow-[0_20px_40px_rgba(198,156,109,0.15)] backdrop-blur-xl">
              {/* Background Art */}
              <div className="absolute left-1/2 -top-16 w-48 h-48 -translate-x-1/2 bg-gradient-to-b from-[#C69C6D]/20 to-transparent rounded-full blur-[40px] group-hover:bg-[#C69C6D]/40 group-hover:scale-150 transition-all duration-700 pointer-events-none"></div>

              <div className="absolute inset-0 opacity-[0.02] pointer-events-none group-hover:opacity-[0.15] group-hover:scale-[1.5] group-hover:rotate-[180deg] transition-all duration-[1.5s] ease-in-out text-[#C69C6D] flex items-center justify-center">
                 <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-[150%] h-[150%]">
                    <circle cx="50" cy="50" r="30" strokeDasharray="4 8" />
                    <circle cx="50" cy="50" r="40" strokeDasharray="2 10" />
                    <circle cx="50" cy="50" r="45" strokeDasharray="10 20" />
                 </svg>
              </div>

              <div className="w-32 h-32 mb-8 text-[#C69C6D] relative z-10 group-hover:scale-125 group-hover:rotate-180 transition-transform duration-[1s] ease-in-out drop-shadow-xl group-hover:drop-shadow-[0_0_20px_rgba(198,156,109,0.5)]">
                <svg viewBox="0 0 100 100" fill="currentColor" className="w-full h-full">
                  <path d="M50 10 L60 40 L90 50 L60 60 L50 90 L40 60 L10 50 L40 40 Z" />
                  <circle cx="50" cy="50" r="15" fill="#1E4E8C" />
                  <circle cx="50" cy="50" r="10" fill="#E86A28" />
                </svg>
              </div>
              <h3 className="text-3xl font-black text-gray-900 mb-3 relative z-10 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-[#C69C6D] group-hover:to-[#E86A28] transition-colors">The Party</h3>
              <p className="text-gray-500 font-medium text-sm leading-relaxed relative z-10 group-hover:text-gray-700 transition-colors">Electric energy, unforgettable nights, and connections that last.</p>
            </div>

          </div>
        </section>

        {/* FOUNDERS SECTION */}
        <section className="py-20 border-t border-gray-200 relative">
          
          <div className="text-center mb-16 space-y-4 relative z-10">
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight">The Minds Behind the Madness</h2>
            <p className="text-gray-500 text-lg font-medium">Founded by the trio who wanted more than just a regular trip.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
            {[
              { name: "Harsh Goswami", image: "/harsh.png", role: "Co-Founder" },
              { name: "Musab Ansari", image: "/musab.png", role: "Co-Founder" },
              { name: "Riddhiman Shetty", image: "/Riddhiman.png", role: "Co-Founder" }
            ].map((founder, i) => (
              <div key={i} className="bg-white/80 relative overflow-hidden border border-gray-100 shadow-md rounded-[2.5rem] p-8 backdrop-blur-xl text-center transition-all duration-500 group hover:-translate-y-3 hover:shadow-[0_20px_40px_rgba(30,78,140,0.1)]">
                
                {/* Background Madness / Art */}
                <div className="absolute -right-16 -top-16 w-48 h-48 bg-gradient-to-br from-[#E86A28]/20 to-transparent rounded-full blur-[40px] group-hover:bg-[#E86A28]/30 group-hover:scale-150 transition-all duration-700 pointer-events-none"></div>
                <div className="absolute -left-16 -bottom-16 w-48 h-48 bg-gradient-to-tr from-[#1E4E8C]/20 to-transparent rounded-full blur-[40px] group-hover:bg-[#1E4E8C]/30 group-hover:scale-150 transition-all duration-700 pointer-events-none"></div>
                
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none group-hover:opacity-[0.15] group-hover:rotate-90 group-hover:scale-125 transition-all duration-1000 ease-out text-[#1E4E8C] flex items-center justify-center">
                  <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.5" className="w-[200%] h-[200%]">
                    {[...Array(12)].map((_, j) => (
                      <g key={j} transform={`rotate(${j * 30} 50 50)`}>
                        <path d="M50 10 Q60 30 50 50 Q40 30 50 10" />
                        <circle cx="50" cy="15" r="2" fill="currentColor" />
                      </g>
                    ))}
                    <circle cx="50" cy="50" r="40" strokeDasharray="2 4" stroke="#E86A28" />
                  </svg>
                </div>

                <div className="w-28 h-28 mx-auto bg-gradient-to-br from-[#1E4E8C] to-[#E86A28] rounded-full mb-6 p-1 relative z-10 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-[0_8px_20px_rgba(0,0,0,0.1)] group-hover:shadow-[0_0_30px_rgba(232,106,40,0.3)]">
                  <div className="w-full h-full bg-white rounded-full flex items-center justify-center overflow-hidden">
                    {founder.image ? (
                      <img src={founder.image} alt={founder.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    ) : (
                      <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-[#1E4E8C] to-[#E86A28] group-hover:scale-110 transition-transform duration-500">
                        {founder.name.charAt(0)}
                      </span>
                    )}
                  </div>
                </div>
                
                <h3 className="text-2xl font-black text-gray-900 relative z-10 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-[#1E4E8C] group-hover:to-[#E86A28] transition-colors">{founder.name}</h3>
                <p className="text-xs font-bold text-gray-400 mt-2 tracking-[0.2em] uppercase relative z-10 group-hover:text-[#E86A28] transition-colors">{founder.role}</p>
              </div>
            ))}
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-gray-200 bg-white/80 backdrop-blur-lg relative z-10">
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-gray-500 font-bold text-sm tracking-wider">© {new Date().getFullYear()} KALA CHASHMA & CO.</p>
          <div className="flex gap-4">
            <a href="https://www.instagram.com/kaalachasma.co/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#E86A28] transition-colors">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
