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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 sm:p-8 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-green-500"></div>
              <p className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-2">Today's Revenue</p>
              <h2 className="text-4xl font-black text-white">₹{data?.todayNet || 0}</h2>
              <p className="text-green-400 text-sm mt-2 font-medium">From verified registrations today</p>
            </div>
            
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 sm:p-8 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
              <p className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-2">This Month's Revenue</p>
              <h2 className="text-4xl font-black text-white">₹{data?.monthlyNet || 0}</h2>
              <p className="text-blue-400 text-sm mt-2 font-medium">Total verified this month</p>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-6 sm:p-8 border-b border-white/10">
              <h2 className="text-2xl font-bold text-white">Event-wise Breakdown</h2>
              <p className="text-gray-400 text-sm mt-1">Revenue from verified users per event/form</p>
            </div>
            
            {(!data?.eventWise || data.eventWise.length === 0) ? (
              <div className="p-12 text-center text-gray-500 font-medium">
                No verified payments found yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-300">
                  <thead className="bg-black/40 text-gray-400 uppercase font-semibold text-xs">
                    <tr>
                      <th className="px-6 py-4">Event / Form Name</th>
                      <th className="px-6 py-4 text-center">Verified Users</th>
                      <th className="px-6 py-4 text-right">Net Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {data.eventWise.map((ev, idx) => (
                      <tr key={idx} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 font-bold text-white">{ev.eventName}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="bg-blue-500/20 text-blue-400 py-1 px-3 rounded-xl font-bold">
                            {ev.transactionsCount}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-green-400">
                          ₹{ev.revenue}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
