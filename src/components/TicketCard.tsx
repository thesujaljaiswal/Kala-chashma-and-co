"use client";
import React, { useState } from "react";
import { toPng } from "html-to-image";

export interface TicketData {
  passengerName: string;
  phone: string;
  station: string;
  ticketToken?: string;
  trekName: string;
  trekDate: string;
  stations: any[];
}

export default function TicketCard({ ticket }: { ticket: TicketData }) {
  const stationObj = ticket.stations?.find(s => s.name === ticket.station);
  
  const formatTime = (timeStr: string) => {
    if (!timeStr) return "";
    const [hours, minutes] = timeStr.split(":");
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${minutes} ${ampm}`;
  };

  const formatTrekDate = (dateStr: string) => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  };

  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    const card = document.getElementById("ticket-card");
    if (!card) return;
    
    setIsDownloading(true);
    try {
      const dataUrl = await toPng(card, {
        pixelRatio: 2,
        backgroundColor: 'transparent',
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `Ticket_${ticket.passengerName.replace(/\s+/g, '_')}_${ticket.ticketToken || 'Pass'}.png`;
      a.click();
    } catch (e) {
      console.error("Failed to capture ticket", e);
    }
    setIsDownloading(false);
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div 
        id="ticket-card"
        className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl relative border-2 border-gray-200"
      >
        {/* Ticket Header */}
        <div className="bg-gradient-to-br from-[#1E4E8C] to-[#E86A28] text-white p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl z-0"></div>
          
          {/* Background Topographic & Mandala Art */}
          <div className="absolute inset-0 pointer-events-none z-0">
            {/* Topography Waves */}
            <svg viewBox="0 0 400 150" preserveAspectRatio="none" className="absolute inset-0 w-full h-full opacity-10 text-white" fill="none" stroke="currentColor" strokeWidth="0.5">
               <path d="M-50 100 Q 50 50 150 120 T 350 80 T 450 110" />
               <path d="M-50 80 Q 50 30 150 100 T 350 60 T 450 90" />
               <path d="M-50 60 Q 50 10 150 80 T 350 40 T 450 70" />
               <path d="M-50 40 Q 50 -10 150 60 T 350 20 T 450 50" strokeDasharray="4 4" />
               <path d="M-50 20 Q 50 -30 150 40 T 350 0 T 450 30" strokeDasharray="2 6" />
            </svg>
            
            {/* Corner Mandala */}
            <div className="absolute -top-16 -right-16 w-48 h-48 opacity-[0.12] text-white transform rotate-12">
              <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1" className="w-full h-full">
                {[...Array(16)].map((_, i) => (
                  <g key={i} transform={`rotate(${i * 22.5} 50 50)`}>
                    <path d="M50 5 Q55 25 50 50 Q45 25 50 5" />
                    <circle cx="50" cy="10" r="1.5" fill="currentColor"/>
                  </g>
                ))}
                <circle cx="50" cy="50" r="42" strokeDasharray="1 3" />
                <circle cx="50" cy="50" r="30" strokeDasharray="3 6" />
              </svg>
            </div>
          </div>

          <div className="relative z-10 flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-black tracking-tight drop-shadow-md">{ticket.trekName}</h2>
              <p className="text-gray-100/80 font-medium text-sm mt-1 drop-shadow-sm">{formatTrekDate(ticket.trekDate)}</p>
            </div>
            <div className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-[0_4px_15px_rgba(232,106,40,0.4)] border border-orange-400/50 backdrop-blur-sm">
              CONFIRMED
            </div>
          </div>
        </div>

        {/* Serrated Edge Separator */}
        <div className="relative h-6 bg-white -mt-3 -mb-3 z-20 flex justify-between items-center px-[-8px]">
           <div className="w-6 h-6 bg-gray-100 rounded-full -ml-3 shadow-inner border border-gray-200"></div>
           <div className="w-full border-t-2 border-dashed border-gray-300 mx-4"></div>
           <div className="w-6 h-6 bg-gray-100 rounded-full -mr-3 shadow-inner border border-gray-200"></div>
        </div>

        {/* Ticket Body */}
        <div className="p-6 bg-white relative overflow-hidden">
          {/* Watermark Art */}
          <div className="absolute -bottom-16 -right-16 w-64 h-64 opacity-15 pointer-events-none text-[#E86A28]">
            <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1">
              {[...Array(12)].map((_, i) => (
                <g key={i} transform={`rotate(${i * 30} 50 50)`}>
                  <path d="M50 10 Q60 30 50 50 Q40 30 50 10" />
                  <path d="M50 20 Q70 40 50 60 Q30 40 50 20" />
                </g>
              ))}
              <circle cx="50" cy="50" r="40" />
              <circle cx="50" cy="50" r="45" strokeDasharray="2 4" />
            </svg>
          </div>
          <div className="space-y-5 relative z-10">
            <div>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Passenger</p>
              <p className="text-gray-900 font-bold text-xl">{ticket.passengerName}</p>
              <p className="text-gray-500 text-sm font-medium">{ticket.phone}</p>
            </div>
            
            <div className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <div>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Boarding</p>
                <p className="text-gray-900 font-bold text-lg leading-tight">{ticket.station}</p>
              </div>
              <div className="text-right border-l border-gray-200 pl-4 ml-2">
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Time</p>
                <p className="text-orange-500 font-black text-xl">{stationObj ? formatTime(stationObj.time) : '--:--'}</p>
              </div>
            </div>
            
            <div className="pt-2 flex justify-between items-end">
              <div>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Ticket Token</p>
                <p className="text-gray-900 font-mono font-black text-2xl tracking-widest">{ticket.ticketToken || '-------'}</p>
              </div>
              <div className="opacity-50">
                <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 4v16m8-8H4" />
                  <rect x="4" y="4" width="16" height="16" rx="2" strokeWidth="2" />
                </svg>
              </div>
            </div>
            
            <div className="pt-4 border-t border-dashed border-gray-200">
              <p className="text-gray-900 font-bold text-sm mb-3 flex items-center gap-2">
                <span className="text-orange-500 text-lg">📌</span> Journey Guidelines
              </p>
              <ul className="space-y-2.5 text-xs text-gray-600 font-medium text-left">
                <li className="flex gap-2 items-start"><span className="shrink-0 text-base leading-none">⏰</span> <span className="text-left">Everyone reach your respective railway stations 10–15 mins before the train timing</span></li>
                <li className="flex gap-2 items-start"><span className="shrink-0 text-base leading-none">🚆</span> <span className="text-left">Make sure everyone boards the same train</span></li>
                <li className="flex gap-2 items-start"><span className="shrink-0 text-base leading-none">😎</span> <span className="text-left">Try to occupy the first 2 coaches so we all stay together. If we get the same coaches, even better</span></li>
                <li className="flex gap-2 items-start"><span className="shrink-0 text-base leading-none">💧</span> <span className="text-left">Don’t forget to carry your water bottles and some snacks if you feel hungry during the journey 🍪</span></li>
              </ul>
              <div className="mt-4 bg-gradient-to-r from-orange-50 to-amber-50 p-3 rounded-xl border border-orange-100/50 shadow-inner">
                <p className="text-orange-800 text-xs font-bold leading-relaxed text-center">
                  Let’s keep the energy high, stay together, and make this trek a memorable one! 🥾✨
                </p>
              </div>
            </div>
            
            <div className="pt-3 mt-1 border-t border-gray-100 flex items-center justify-between">
              <div className="text-[10px] font-black tracking-wide text-gray-800">
                KaalaCHASMA <span className="text-orange-500">&</span> co
              </div>
              <div className="flex items-center gap-1 text-[10px] font-bold text-orange-500">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                @kaalachasma.co
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-6 flex flex-col sm:flex-row gap-3 w-full max-w-sm">
        <button 
          onClick={handleDownload}
          disabled={isDownloading}
          className="flex-1 bg-white hover:bg-gray-100 disabled:bg-gray-200 text-gray-900 font-bold py-3 px-6 rounded-2xl shadow-lg transition-transform transform active:scale-95 flex items-center justify-center gap-2 border border-gray-200"
        >
          {isDownloading ? (
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
          )}
          {isDownloading ? 'Saving...' : 'Download Ticket PNG'}
        </button>
      </div>
      
      <p className="text-gray-400 text-sm mt-4 font-medium text-center max-w-xs">
        Tip: You can also just screenshot this ticket!
      </p>
      
      <a href="https://www.instagram.com/kaalachasma.co/" target="_blank" rel="noopener noreferrer" className="mt-3 text-orange-500 hover:text-orange-600 text-sm font-bold flex items-center justify-center gap-2 transition-colors pb-4">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
        @kaalachasma.co
      </a>
    </div>
  );
}
