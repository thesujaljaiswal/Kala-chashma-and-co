"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/AdminSidebar";
import { getAccountsData } from "@/app/actions";

export default function AccountsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<{
    todayGross: number;
    todayNet: number;
    monthlyGross: number;
    monthlyNet: number;
    eventWise: { eventName: string; revenue: number; transactionsCount: number }[];
    pastSettlements: {
      id: string;
      amount: number;
      fees: number;
      tax: number;
      status: string;
      utr: string | null;
      createdAt: string;
    }[];
  } | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    const fetchData = async () => {
      if (status === "authenticated") {
        const res = await getAccountsData();
        if (res.success) {
          setData({
            todayGross: res.todayGross ?? 0,
            todayNet: res.todayNet ?? 0,
            monthlyGross: res.monthlyGross ?? 0,
            monthlyNet: res.monthlyNet ?? 0,
            eventWise: res.eventWise ?? [],
            pastSettlements: res.pastSettlements ?? []
          });
        }
        setIsLoading(false);
      }
    };
    fetchData();
  }, [status]);

  if (status === "loading" || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-[calc(100vh-64px)] bg-black/20 gap-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '-0.3s' }}></div>
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '-0.15s' }}></div>
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
        </div>
        <div className="text-gray-400 font-medium text-sm animate-pulse mt-2">Loading Accounts...</div>
      </div>
    );
  }

  if (!session?.user) return null;

  return (
    <div className="flex w-full min-h-[calc(100vh-64px)] relative overflow-hidden bg-black/20">
      <AdminSidebar activeTab="accounts" title="Accounts & Revenue" />

      <div className="flex-1 flex flex-col w-full h-[calc(100vh-64px)] overflow-y-auto">
        <div className="p-3 sm:p-4 md:p-8 w-full max-w-6xl mx-auto pb-24 pt-20 md:pt-8">
          
          <div className="mb-8">
            <h1 className="text-3xl font-black text-white">Accounts & Revenue</h1>
            <p className="text-gray-400 text-sm mt-1">Track your earnings and transaction data across all events and forms.</p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden text-center max-w-2xl mx-auto mt-12">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500 to-orange-500"></div>
            
            <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-4">Manual Payment Tracking Enabled</h2>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Automated Razorpay tracking has been disabled for this workspace. You are currently using Manual QR Payments. 
              To track your revenue, please refer to the "Responses" section in the Manage Forms tab and manually verify payments.
            </p>
            
            <button
              onClick={() => router.push('/manage-forms')}
              className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 px-8 rounded-xl transition-colors inline-flex items-center gap-2"
            >
              Go to Manage Forms
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
