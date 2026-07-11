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
        <div className="bg-gradient-to-br from-gray-900 to-black text-white p-6 relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-black tracking-tight">{ticket.trekName}</h2>
              <p className="text-gray-400 font-medium text-sm mt-1">{ticket.trekDate}</p>
            </div>
            <div className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
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
        <div className="p-6 bg-white">
          <div className="space-y-5">
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
      

    </div>
  );
}
