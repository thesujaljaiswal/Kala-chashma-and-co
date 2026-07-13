import Link from "next/link";
import { useState } from "react";

export default function AdminSidebar({ activeTab, title }: { activeTab: "manage" | "onboarding" | "checkin", title: string }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <>
      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 border-r border-white/10 transform transition-transform duration-300 md:relative md:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex flex-col h-full p-4">
          <div className="flex items-center justify-between mb-8 mt-2 md:justify-center">
            <h1 className="text-xl font-extrabold text-white text-center drop-shadow-md">Admin Panel</h1>
            <button className="md:hidden text-gray-400 hover:text-white" onClick={() => setIsSidebarOpen(false)}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
          
          <div className="flex flex-col gap-3">
            <Link
              href="/manage-treks"
              onClick={() => setIsSidebarOpen(false)}
              className={`w-full text-left px-4 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-3 ${
                activeTab === "manage" ? "bg-gradient-to-r from-rose-600 to-red-700 text-white shadow-lg" : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
              Manage Treks
            </Link>
            <Link
              href="/onboarding"
              onClick={() => setIsSidebarOpen(false)}
              className={`w-full text-left px-4 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-3 ${
                activeTab === "onboarding" ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg" : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
              Onboarding List
            </Link>
            <Link
              href="/checkin"
              onClick={() => setIsSidebarOpen(false)}
              className={`w-full text-left px-4 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-3 ${
                activeTab === "checkin" ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg" : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              Check-in
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Header (Hamburger) - Usually rendered alongside the main content */}
      <div className="md:hidden flex items-center justify-between p-3 sm:p-4 border-b border-white/10 bg-gray-900/80 backdrop-blur-md absolute top-0 left-0 z-30 w-full">
        <div className="flex items-center">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="text-gray-300 hover:text-white p-1 mr-2 sm:mr-3 shrink-0"
          >
            <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
          </button>
          <h2 className="text-base sm:text-lg font-bold text-white tracking-wide truncate">
            {title}
          </h2>
        </div>
      </div>
    </>
  );
}
