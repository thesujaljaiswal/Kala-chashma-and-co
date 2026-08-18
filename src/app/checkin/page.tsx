"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/AdminSidebar";
import { getEvents, getSelectionsByEvent, togglePassengerArrival } from "@/app/actions";

export default function CheckinPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [selections, setSelections] = useState<any[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [selectedStationName, setSelectedStationName] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const fetchEvents = async () => {
    const data = await getEvents();
    setEvents(data);
    
    if (data.length > 0) {
      setSelectedEventId(data[0]._id);
      return data[0]._id;
    }
    return null;
  };

  useEffect(() => {
    const initialize = async () => {
      if (status !== "authenticated") return;
      setIsInitialLoading(true);
      const firstId = await fetchEvents();
      if (firstId) {
        await fetchSelections(firstId);
      }
      setIsInitialLoading(false);
    };
    initialize();
  }, [status]);

  useEffect(() => {
    if (selectedEventId && !isInitialLoading) {
      fetchSelections(selectedEventId);
    } else if (!selectedEventId && !isInitialLoading) {
      setSelections([]);
    }
  }, [selectedEventId]);

  const fetchSelections = async (id: string) => {
    const data = await getSelectionsByEvent(id);
    setSelections(data);
  };

  const formatEventDate = (dateStr: string) => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  };

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

  return (
    <div className="flex w-full min-h-[calc(100vh-64px)] relative overflow-hidden bg-black/20">
      <AdminSidebar activeTab="checkin" title="Station Check-in" />

      <div className="flex-1 flex flex-col w-full h-[calc(100vh-64px)] overflow-y-auto">
        <div className="p-3 sm:p-4 md:p-8 w-full max-w-6xl mx-auto pb-24 pt-20 md:pt-8">
          <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-500"></div>
            
            <div className="mb-8 flex flex-col md:flex-row gap-4 justify-between items-center bg-black/20 p-4 rounded-2xl border border-white/5">
              <h2 className="text-xl font-bold text-white">Station Check-in</h2>
              <div className="flex items-center gap-3 w-full md:w-auto">
                <span className="text-sm text-gray-400 font-medium">Select Event:</span>
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-64 font-medium appearance-none"
                >
                  <option value="" className="text-black">Select a Event</option>
                  {events.map(t => (
                    <option key={t._id} value={t._id} className="text-black">{t.name} ({formatEventDate(t.date)})</option>
                  ))}
                </select>
              </div>
            </div>

            {selectedEventId && (
              <div className="mb-8 bg-black/20 p-6 rounded-2xl border border-white/5">
                <h3 className="text-lg font-bold text-white mb-4">Overall Event Status</h3>
                <div className="flex flex-col md:flex-row gap-6 items-center">
                  <div className="flex-1 w-full flex gap-2 sm:gap-4 text-center">
                    <div className="flex-1 bg-white/5 p-4 rounded-xl border border-white/10">
                      <div className="text-gray-400 text-sm mb-1">Total</div>
                      <div className="text-3xl font-bold text-white">{selections.length}</div>
                    </div>
                    <div className="flex-1 bg-white/5 p-4 rounded-xl border border-white/10">
                      <div className="text-gray-400 text-sm mb-1">Arrived</div>
                      <div className="text-3xl font-bold text-green-400">{selections.filter(s => s.arrived).length}</div>
                    </div>
                    <div className="flex-1 bg-white/5 p-4 rounded-xl border border-white/10">
                      <div className="text-gray-400 text-sm mb-1">Remaining</div>
                      <div className="text-3xl font-bold text-orange-400">{selections.length - selections.filter(s => s.arrived).length}</div>
                    </div>
                  </div>
                  
                  <div className="w-full md:w-1/3 flex justify-center">
                    <div className="relative w-32 h-32 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" className="stroke-white/10" strokeWidth="8" fill="none" />
                        <circle 
                          cx="50" cy="50" r="40" 
                          className="stroke-green-500 transition-all duration-1000 ease-out" 
                          strokeWidth="8" fill="none" strokeLinecap="round"
                          strokeDasharray="251.2" 
                          strokeDashoffset={selections.length > 0 ? 251.2 - (251.2 * (selections.filter(s => s.arrived).length / selections.length)) : 251.2}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold text-white">
                          {selections.length > 0 ? Math.round((selections.filter(s => s.arrived).length / selections.length) * 100) : 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.find(t => t._id === selectedEventId)?.stations.map((station: any, idx: number) => {
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
                        <div key={sel._id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-white/5 border border-white/10 p-3 sm:p-4 rounded-xl hover:bg-white/10 transition-colors gap-3 sm:gap-2">
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
                                  href={`https://wa.me/${sel.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${sel.passengerName}, hope you would have boarded this train from ${sel.station}. Please confirm with us once you have boarded.`)}`}
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
