"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/AdminSidebar";
import { getEvents, getAttendanceList, markAttendance, toggleAttendanceStatus } from "@/app/actions";
import { Html5Qrcode } from "html5-qrcode";

export default function EventAttendancePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [attendees, setAttendees] = useState<any[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [cameraType, setCameraType] = useState<"environment" | "user">("environment");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const transitionLock = useRef(Promise.resolve());
  const [toastMessage, setToastMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const fetchEvents = async () => {
    const data = await getEvents();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const filteredData = data.filter((event: any) => {
      const eventDate = new Date(event.date);
      return eventDate >= today;
    });

    setEvents(filteredData);
    if (filteredData.length > 0) {
      setSelectedEventId(filteredData[0]._id);
      return filteredData[0]._id;
    }
    return null;
  };

  useEffect(() => {
    const initialize = async () => {
      if (status !== "authenticated") return;
      setIsInitialLoading(true);
      const firstId = await fetchEvents();
      if (firstId) {
        await fetchAttendees(firstId);
      }
      setIsInitialLoading(false);
    };
    initialize();
  }, [status]);

  useEffect(() => {
    if (selectedEventId && !isInitialLoading) {
      fetchAttendees(selectedEventId);
    } else if (!selectedEventId && !isInitialLoading) {
      setAttendees([]);
    }
  }, [selectedEventId]);

  const fetchAttendees = async (id: string) => {
    const data = await getAttendanceList(id);
    setAttendees(data);
  };

  const handleManualToggle = async (ticketId: string, currentStatus: boolean) => {
    if (!selectedEventId) return;
    const newStatus = !currentStatus;
    
    setAttendees(prev => prev.map(a => a.ticketId === ticketId ? { ...a, isPresent: newStatus } : a));
    
    const res = await toggleAttendanceStatus(ticketId, selectedEventId, newStatus);
    if (!res.success) {
      setAttendees(prev => prev.map(a => a.ticketId === ticketId ? { ...a, isPresent: currentStatus } : a));
      showToast(res.message || "Failed to toggle attendance", "error");
    }
  };

  const showToast = (text: string, type: 'success' | 'error') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Scanner Logic
  useEffect(() => {
    if (isScannerOpen) {
      transitionLock.current = transitionLock.current.then(() => startScanner());
    } else {
      transitionLock.current = transitionLock.current.then(() => stopScanner());
    }
    
    return () => {
      // It's tricky to queue a stop on unmount without potentially hanging,
      // but we do want to stop if it's currently open.
      if (isScannerOpen) {
         transitionLock.current = transitionLock.current.then(() => stopScanner());
      }
    };
  }, [isScannerOpen, cameraType, selectedEventId]);

  const startScanner = async () => {
    if (scannerRef.current) {
      await stopScanner();
    }
    const scanner = new Html5Qrcode("reader");
    scannerRef.current = scanner;

    try {
      await scanner.start(
        { facingMode: cameraType },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        async (decodedText) => {
          handleScan(decodedText);
        },
        (error) => {
          // ignore scan errors
        }
      );
    } catch (err) {
      console.error("Error starting scanner", err);
      showToast("Could not start camera. Check permissions.", "error");
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.getState() !== 1) {
          await scannerRef.current.stop();
        }
      } catch (err) {
        console.error("Failed to stop scanner", err);
      }
      try {
        scannerRef.current.clear();
      } catch (e) {
        // ignore clear error
      }
    }
    scannerRef.current = null;

    // Forceful hardware camera release
    try {
      const videos = document.querySelectorAll("video");
      videos.forEach(video => {
        if (video.srcObject) {
          const stream = video.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
          video.srcObject = null;
        }
      });
    } catch (err) {
      console.error("Manual camera release failed", err);
    }
  };

  const [scanOverlay, setScanOverlay] = useState<{ status: 'success' | 'already' | 'error', message: string } | null>(null);

  const lastScannedRef = useRef<{ text: string, time: number }>({ text: "", time: 0 });

  const handleScan = async (ticketId: string) => {
    const now = Date.now();
    // Reduce debounce to 1500ms since we want rapid scanning
    if (lastScannedRef.current.text === ticketId && now - lastScannedRef.current.time < 500) {
      return;
    }
    lastScannedRef.current = { text: ticketId, time: now };

    if (!selectedEventId) {
      showToast("No event selected", "error");
      return;
    }

    // Quick client-side check if already present
    const existingAttendee = attendees.find(a => a.ticketId === ticketId);
    if (existingAttendee && existingAttendee.isPresent) {
      setScanOverlay({ status: 'already', message: 'Already Marked Present' });
      setTimeout(() => setScanOverlay(null), 400); // 0.5s duration
      return;
    }

    const res = await markAttendance(ticketId, selectedEventId);
    if (res.success) {
      setScanOverlay({ status: 'success', message: 'Successfully Marked Present!' });
      setTimeout(() => setScanOverlay(null), 500); // 0.5s duration
      setAttendees(prev => prev.map(a => a.ticketId === ticketId ? { ...a, isPresent: true } : a));
    } else if (res.alreadyPresent) {
      setScanOverlay({ status: 'already', message: 'Already Marked Present' });
      setTimeout(() => setScanOverlay(null), 500); // 0.5s duration
    } else {
      setScanOverlay({ status: 'error', message: res.message || "Failed to mark attendance" });
      setTimeout(() => setScanOverlay(null), 500); // 0.5s duration
    }
  };

  if (status === "loading" || isInitialLoading) {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-[calc(100vh-64px)] bg-black/20 gap-4">
        <div className="text-gray-400 font-medium text-sm animate-pulse mt-2">Loading...</div>
      </div>
    );
  }

  if (!session?.user) return null;

  return (
    <div className="flex w-full min-h-[calc(100vh-64px)] relative overflow-hidden bg-black/20">
      <AdminSidebar activeTab="attendance" title="Event Attendance" />

      <div className="flex-1 flex flex-col w-full h-[calc(100vh-64px)] overflow-y-auto">
        <div className="p-3 sm:p-4 md:p-8 w-full max-w-6xl mx-auto pb-24 pt-20 md:pt-8">
          <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 to-emerald-600"></div>
            
            <div className="mb-8 flex flex-col md:flex-row gap-4 justify-between items-center bg-black/20 p-4 rounded-2xl border border-white/5">
              <h2 className="text-xl font-bold text-white">Event Attendance</h2>
              <div className="flex items-center gap-3 w-full md:w-auto">
                <span className="text-sm text-gray-400 font-medium">Event:</span>
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-64 font-medium appearance-none"
                >
                  <option value="" className="text-black">Select an Event</option>
                  {events.map(t => (
                    <option key={t._id} value={t._id} className="text-black">{t.name} ({t.date})</option>
                  ))}
                </select>
              </div>
            </div>

            {selectedEventId && (
              <>
                {/* Overall Event Status */}
                <div className="mb-8 bg-black/20 p-6 rounded-2xl border border-white/5">
                  <h3 className="text-lg font-bold text-white mb-4">Overall Event Status</h3>
                  <div className="flex flex-col md:flex-row gap-6 items-center">
                    <div className="flex-1 w-full flex gap-2 sm:gap-4 text-center">
                      <div className="flex-1 bg-white/5 p-4 rounded-xl border border-white/10">
                        <div className="text-gray-400 text-sm mb-1">Total</div>
                        <div className="text-3xl font-bold text-white">{attendees.length}</div>
                      </div>
                      <div className="flex-1 bg-white/5 p-4 rounded-xl border border-white/10">
                        <div className="text-gray-400 text-sm mb-1">Present</div>
                        <div className="text-3xl font-bold text-green-400">{attendees.filter(a => a.isPresent).length}</div>
                      </div>
                      <div className="flex-1 bg-white/5 p-4 rounded-xl border border-white/10">
                        <div className="text-gray-400 text-sm mb-1">Remaining</div>
                        <div className="text-3xl font-bold text-orange-400">{attendees.length - attendees.filter(a => a.isPresent).length}</div>
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
                            strokeDashoffset={attendees.length > 0 ? 251.2 - (251.2 * (attendees.filter(a => a.isPresent).length / attendees.length)) : 251.2}
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-2xl font-bold text-white">
                            {attendees.length > 0 ? Math.round((attendees.filter(a => a.isPresent).length / attendees.length) * 100) : 0}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Scanner Section */}
                <div className="bg-black/20 p-6 rounded-2xl border border-white/5">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-white">QR Code Scanner</h3>
                    <div className="flex gap-2">
                      {isScannerOpen && (
                         <button 
                         onClick={() => setCameraType(prev => prev === "environment" ? "user" : "environment")}
                         className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
                       >
                         Flip Camera
                       </button>
                      )}
                      <button 
                        onClick={() => setIsScannerOpen(!isScannerOpen)}
                        className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-colors ${
                          isScannerOpen 
                          ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                          : 'bg-teal-500 hover:bg-teal-600 text-white'
                        }`}
                      >
                        {isScannerOpen ? 'Close Scanner' : 'Open Scanner'}
                      </button>
                    </div>
                  </div>
                  
                  {isScannerOpen ? (
                    <div className="w-full max-w-md mx-auto overflow-hidden rounded-xl border-2 border-white/10 bg-black relative">
                      <div id="reader" className="w-full"></div>
                      
                      {scanOverlay && (
                        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                           {scanOverlay.status === 'success' && (
                              <svg className="w-24 h-24 text-green-500 mb-4 drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                           )}
                           {scanOverlay.status === 'already' && (
                              <svg className="w-24 h-24 text-orange-500 mb-4 drop-shadow-[0_0_15px_rgba(249,115,22,0.5)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                           )}
                           {scanOverlay.status === 'error' && (
                              <svg className="w-24 h-24 text-red-500 mb-4 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                           )}
                           <h3 className={`text-2xl font-black text-center px-4 tracking-wide ${scanOverlay.status === 'success' ? 'text-green-400' : scanOverlay.status === 'already' ? 'text-orange-400' : 'text-red-400'}`}>
                             {scanOverlay.message}
                           </h3>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-48 w-full border-2 border-dashed border-white/20 rounded-xl flex items-center justify-center text-gray-500 flex-col gap-2">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path></svg>
                      <span>Scanner closed</span>
                    </div>
                  )}

                  {/* Toast Message Display Below Scanner */}
                  {toastMessage && (
                    <div className={`mt-4 p-3 rounded-xl text-center font-bold text-sm ${
                      toastMessage.type === 'success' 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                      {toastMessage.text}
                    </div>
                  )}
                </div>

                {/* Attendees Section */}
                <div className="bg-black/20 p-6 rounded-2xl border border-white/5 flex flex-col max-h-[600px]">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-white">Attendee List</h3>
                    <div className="text-sm font-medium">
                      <span className="text-green-400">{attendees.filter(a => a.isPresent).length}</span>
                      <span className="text-gray-400 mx-1">/</span>
                      <span className="text-white">{attendees.length}</span>
                    </div>
                  </div>
                  
                  <div className="overflow-y-auto flex-1 custom-scrollbar space-y-2">
                    {attendees.length === 0 ? (
                      <div className="text-center text-gray-500 py-8">No attendees found.</div>
                    ) : (
                      attendees.map(a => (
                        <div key={a._id} className="flex justify-between items-center bg-white/5 border border-white/5 p-3 rounded-xl hover:bg-white/10 transition-colors">
                          <div className="flex flex-col">
                            <span className="text-white font-semibold text-sm">{a.passengerName}</span>
                            <span className="text-gray-400 text-xs">{a.phone}</span>
                            <span className="text-gray-500 text-[10px] font-mono mt-1">{a.ticketId}</span>
                          </div>
                          <button 
                            onClick={() => handleManualToggle(a.ticketId, a.isPresent)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer ${a.isPresent ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30'}`}
                          >
                            {a.isPresent ? 'Present' : 'Absent'}
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
