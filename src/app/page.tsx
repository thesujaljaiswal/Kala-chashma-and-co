"use client";

import { useSession } from "next-auth/react";
import AdminDashboard from "@/components/AdminDashboard";

export default function Page() {
  const { data: session, status } = useSession();

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
        
        <div className="mt-12 opacity-50">
          <svg className="w-12 h-12 mx-auto text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
          </svg>
        </div>
      </main>
    </div>
  );
}
