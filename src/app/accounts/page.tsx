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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {/* Today's Revenue Card */}
            <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20 rounded-3xl p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
              <h3 className="text-green-400 font-bold uppercase tracking-wider text-sm mb-2">Today's Transactions</h3>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-4xl sm:text-5xl font-black text-white">₹{data?.todayGross.toLocaleString('en-IN', { maximumFractionDigits: 2 }) || 0}</span>
                <span className="text-gray-400 font-medium mb-1">Gross</span>
              </div>
              <div className="text-sm font-semibold text-emerald-300 bg-emerald-500/10 inline-block px-3 py-1 rounded-lg">
                ~ ₹{data?.todayNet.toLocaleString('en-IN', { maximumFractionDigits: 2 }) || 0} Estimated Settlement
              </div>
            </div>

            {/* Monthly Revenue Card */}
            <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/5 border border-blue-500/20 rounded-3xl p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
              <h3 className="text-blue-400 font-bold uppercase tracking-wider text-sm mb-2">Monthly Transactions</h3>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-4xl sm:text-5xl font-black text-white">₹{data?.monthlyGross.toLocaleString('en-IN', { maximumFractionDigits: 2 }) || 0}</span>
                <span className="text-gray-400 font-medium mb-1">Gross</span>
              </div>
              <div className="text-sm font-semibold text-indigo-300 bg-indigo-500/10 inline-block px-3 py-1 rounded-lg">
                ~ ₹{data?.monthlyNet.toLocaleString('en-IN', { maximumFractionDigits: 2 }) || 0} Estimated Settlement
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-500"></div>
            
            <h2 className="text-2xl font-bold text-white mb-6">Revenue by Event / Form</h2>
            
            {(!data?.eventWise || data.eventWise.length === 0) ? (
              <div className="text-gray-400 py-10 text-center bg-black/20 rounded-2xl border border-white/5">
                No revenue data available yet.
              </div>
            ) : (
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left text-sm text-gray-300">
                  <thead className="bg-black/40 text-gray-400 uppercase font-semibold text-xs rounded-xl">
                    <tr>
                      <th className="px-6 py-4 rounded-l-xl">Source</th>
                      <th className="px-6 py-4 text-center">Total Transactions</th>
                      <th className="px-6 py-4 text-right rounded-r-xl">Total Revenue Generated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.eventWise.map((item, idx) => (
                      <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                              {item.eventName.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-white font-semibold text-base">{item.eventName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-center text-gray-400 font-medium text-base">
                          {item.transactionsCount}
                        </td>
                        <td className="px-6 py-5 text-right font-bold text-emerald-400 text-lg">
                          ₹{item.revenue.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden mt-8">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
            
            <h2 className="text-2xl font-bold text-white mb-6">Past Settlements</h2>
            
            {(!data?.pastSettlements || data.pastSettlements.length === 0) ? (
              <div className="text-gray-400 py-10 text-center bg-black/20 rounded-2xl border border-white/5">
                No past settlements found in Razorpay.
              </div>
            ) : (
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left text-sm text-gray-300">
                  <thead className="bg-black/40 text-gray-400 uppercase font-semibold text-xs rounded-xl">
                    <tr>
                      <th className="px-6 py-4 rounded-l-xl">Date</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">UTR Number</th>
                      <th className="px-6 py-4 text-right">Deducted Fees</th>
                      <th className="px-6 py-4 text-right rounded-r-xl">Settled Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.pastSettlements.map((item, idx) => (
                      <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="px-6 py-5 whitespace-nowrap text-white font-medium">
                          {new Date(item.createdAt).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-5">
                          <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${item.status === 'processed' ? 'bg-green-500/20 text-green-400' : item.status === 'failed' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-gray-400 font-mono text-xs">
                          {item.utr || 'Pending'}
                        </td>
                        <td className="px-6 py-5 text-right text-red-400 font-semibold">
                          -₹{item.fees.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-5 text-right font-bold text-white text-lg">
                          ₹{item.amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
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
