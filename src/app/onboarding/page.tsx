"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/AdminSidebar";
import { getTreks, getSelectionsByTrek } from "@/app/actions";

export default function OnboardingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [treks, setTreks] = useState<any[]>([]);
  const [selectedTrekId, setSelectedTrekId] = useState<string>("");
  const [selections, setSelections] = useState<any[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  
  // Sorting State
  const [sortField, setSortField] = useState<"name" | "station" | "time">("time");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const fetchTreks = async () => {
    const data = await getTreks();
    setTreks(data);
    
    if (data.length > 0) {
      setSelectedTrekId(data[0]._id);
      return data[0]._id;
    }
    return null;
  };

  useEffect(() => {
    const initialize = async () => {
      if (status !== "authenticated") return;
      setIsInitialLoading(true);
      const firstId = await fetchTreks();
      if (firstId) {
        await fetchSelections(firstId);
      }
      setIsInitialLoading(false);
    };
    initialize();
  }, [status]);

  useEffect(() => {
    if (selectedTrekId && !isInitialLoading) {
      fetchSelections(selectedTrekId);
    } else if (!selectedTrekId && !isInitialLoading) {
      setSelections([]);
    }
  }, [selectedTrekId]);

  const fetchSelections = async (id: string) => {
    const data = await getSelectionsByTrek(id);
    setSelections(data);
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
    const activeTrek = treks.find(t => t._id === selectedTrekId);
    
    return [...selections].sort((a, b) => {
      let aRank = 9999;
      let bRank = 9999;
      if (activeTrek && activeTrek.stations) {
        const aIdx = activeTrek.stations.findIndex((s: any) => s.name === a.station);
        const bIdx = activeTrek.stations.findIndex((s: any) => s.name === b.station);
        if (aIdx !== -1) aRank = aIdx;
        if (bIdx !== -1) bRank = bIdx;
      }
      
      if (aRank !== bRank) return aRank - bRank;
      
      let aVal, bVal;
      if (sortField === "name") {
        aVal = (a.passengerName || "").toLowerCase();
        bVal = (b.passengerName || "").toLowerCase();
      } else if (sortField === "station") {
        aVal = (a.station || "").toLowerCase();
        bVal = (b.station || "").toLowerCase();
      } else {
        aVal = new Date(a.createdAt).getTime();
        bVal = new Date(b.createdAt).getTime();
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

  const formatTrekDate = (dateStr: string) => {
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

  const sortedSelections = getSortedSelections();

  return (
    <div className="flex w-full min-h-[calc(100vh-64px)] relative overflow-hidden bg-black/20">
      <AdminSidebar activeTab="onboarding" title="Onboarding List" />

      <div className="flex-1 flex flex-col w-full h-[calc(100vh-64px)] overflow-y-auto">
        <div className="p-4 md:p-8 w-full max-w-6xl mx-auto pb-24 pt-20 md:pt-8">
          <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-amber-500"></div>
            
            <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between items-center bg-black/20 p-4 rounded-2xl border border-white/5">
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
                    <option key={t._id} value={t._id} className="text-black">{t.name} ({formatTrekDate(t.date)})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex md:hidden items-center gap-3 w-full mb-4 bg-black/20 p-3 rounded-2xl border border-white/5">
              <span className="text-sm text-gray-400 font-medium whitespace-nowrap">Sort by:</span>
              <select
                value={`${sortField}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortField(field as "name" | "station" | "time");
                  setSortOrder(order as "asc" | "desc");
                }}
                className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-sm appearance-none"
              >
                <option value="time-desc" className="text-black">Time (Latest to Oldest)</option>
                <option value="time-asc" className="text-black">Time (Oldest to Latest)</option>
                <option value="name-asc" className="text-black">Alphabetical (A-Z)</option>
                <option value="name-desc" className="text-black">Alphabetical (Z-A)</option>
              </select>
            </div>

            <div className="block md:hidden space-y-4">
              {sortedSelections.length === 0 ? (
                <div className="py-12 text-center text-gray-400 font-medium bg-black/20 rounded-2xl border border-white/10">
                  No passengers have boarded this trek yet.
                </div>
              ) : (
                sortedSelections.map((sel) => (
                  <div key={sel._id} className="bg-black/20 border border-white/10 p-4 rounded-2xl flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-bold text-white">{sel.passengerName}</h3>
                      <span className="bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/30 px-3 py-1 rounded-full text-xs font-semibold text-orange-200">
                        {sel.station}
                      </span>
                    </div>
                    <div className="text-gray-400 font-medium text-sm flex justify-between items-center">
                      <span className="text-gray-300">{sel.phone}</span>
                      <span className="text-gray-500 text-xs">{new Date(sel.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="hidden md:block overflow-x-auto rounded-2xl border border-white/10 bg-black/20 custom-scrollbar">
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
        </div>
      </div>
    </div>
  );
}
