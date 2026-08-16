import Link from "next/link";
import { useState } from "react";

export default function AdminSidebar({ activeTab, title }: { activeTab: "manage" | "stations" | "onboarding" | "checkin" | "attendance" | "forms" | "analytics" | "accounts" | "expense-tracker", title: string }) {
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
          <div className="flex items-center justify-between mb-8 mt-2 md:justify-center shrink-0">
            <h1 className="text-xl font-extrabold text-white text-center drop-shadow-md">Admin Panel</h1>
            <button className="md:hidden text-gray-400 hover:text-white" onClick={() => setIsSidebarOpen(false)}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
          
          <nav className="flex-1 flex flex-col gap-3 overflow-y-auto pr-1 custom-scrollbar">
            <Link
              href="/manage-events"
              onClick={() => setIsSidebarOpen(false)}
              className={`w-full text-left px-4 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-3 ${
                activeTab === "manage" ? "bg-gradient-to-r from-rose-600 to-red-700 text-white shadow-lg" : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
              Manage Events
            </Link>
            <Link
              href="/manage-stations"
              onClick={() => setIsSidebarOpen(false)}
              className={`w-full text-left px-4 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-3 ${
                activeTab === "stations" ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg" : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path></svg>
              Event Stations
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
            <Link
              href="/event-attendance"
              onClick={() => setIsSidebarOpen(false)}
              className={`w-full text-left px-4 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-3 ${
                activeTab === "attendance" ? "bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-lg" : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              Event Attendance
            </Link>
            <Link
              href="/manage-forms"
              onClick={() => setIsSidebarOpen(false)}
              className={`w-full text-left px-4 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-3 ${
                activeTab === "forms" ? "bg-gradient-to-r from-indigo-500 to-blue-500 text-white shadow-lg" : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              Forms
            </Link>
            <Link
              href="/form-analytics"
              onClick={() => setIsSidebarOpen(false)}
              className={`w-full text-left px-4 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-3 ${
                activeTab === "analytics" ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg" : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
              Form Analytics
            </Link>
            <Link
              href="/accounts"
              onClick={() => setIsSidebarOpen(false)}
              className={`w-full text-left px-4 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-3 ${
                activeTab === "accounts" ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg" : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              Accounts
            </Link>
            <Link
              href="/expense-tracker"
              onClick={() => setIsSidebarOpen(false)}
              className={`w-full text-left px-4 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-3 ${
                activeTab === "expense-tracker" ? "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg" : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"></path></svg>
              Expense Tracker
            </Link>
          </nav>
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
