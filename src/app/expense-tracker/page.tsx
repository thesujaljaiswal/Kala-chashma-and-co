"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/AdminSidebar";
import { getExpenseTrackerEvents, getEventFinancials, addExpense, deleteExpense } from "@/app/actions";

export default function ExpenseTrackerPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState<{ id: string; name: string }[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [financials, setFinancials] = useState<any>(null);

  const [expenseDescription, setExpenseDescription] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    const fetchEvents = async () => {
      if (status === "authenticated") {
        const res = await getExpenseTrackerEvents();
        if (res.success && res.events) {
          setEvents(res.events);
          if (res.events.length > 0) {
            setSelectedEventId(res.events[0].id);
          }
        }
        setIsLoading(false);
      }
    };
    fetchEvents();
  }, [status]);

  const fetchFinancials = async (eventId: string) => {
    if (!eventId) return;
    const res = await getEventFinancials(eventId);
    if (res.success) {
      setFinancials(res);
    }
  };

  useEffect(() => {
    if (selectedEventId) {
      fetchFinancials(selectedEventId);
    }
  }, [selectedEventId]);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseDescription || !expenseAmount || !selectedEventId) return;
    
    setIsSubmitting(true);
    const eventName = events.find(e => e.id === selectedEventId)?.name;
    const res = await addExpense(expenseDescription, parseFloat(expenseAmount), selectedEventId, eventName);
    
    if (res.success) {
      setExpenseDescription("");
      setExpenseAmount("");
      await fetchFinancials(selectedEventId);
    } else {
      alert("Failed to add expense");
    }
    setIsSubmitting(false);
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;
    const res = await deleteExpense(id);
    if (res.success) {
      await fetchFinancials(selectedEventId);
    } else {
      alert("Failed to delete expense");
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-[calc(100vh-64px)] bg-black/20 gap-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '-0.3s' }}></div>
          <div className="w-3 h-3 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '-0.15s' }}></div>
          <div className="w-3 h-3 bg-red-500 rounded-full animate-bounce"></div>
        </div>
        <div className="text-gray-400 font-medium text-sm animate-pulse mt-2">Loading Expense Tracker...</div>
      </div>
    );
  }

  if (!session?.user) return null;

  return (
    <div className="flex w-full min-h-[calc(100vh-64px)] relative overflow-hidden bg-black/20">
      <AdminSidebar activeTab="expense-tracker" title="Expense Tracker" />

      <div className="flex-1 flex flex-col w-full h-[calc(100vh-64px)] overflow-y-auto">
        <div className="p-3 sm:p-4 md:p-8 w-full max-w-6xl mx-auto pb-24 pt-20 md:pt-8">
          
          <div className="mb-8 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
            <div>
              <h1 className="text-3xl font-black text-white">Expense Tracker</h1>
              <p className="text-gray-400 text-sm mt-1">Track event-specific expenses and calculate true net profit.</p>
            </div>
            <div className="w-full md:w-64">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Select Event</label>
              <select 
                value={selectedEventId}
                onChange={e => setSelectedEventId(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors appearance-none"
              >
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>{ev.name}</option>
                ))}
                {events.length === 0 && <option value="">No events found</option>}
              </select>
            </div>
          </div>

          {financials && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 sm:p-8 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
                  <p className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-2">Total Revenue</p>
                  <h2 className="text-4xl font-black text-white">₹{financials.revenue || 0}</h2>
                  <p className="text-blue-400 text-sm mt-2 font-medium">From verified registrations</p>
                </div>

                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 sm:p-8 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
                  <p className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-2">Total Expenses</p>
                  <h2 className="text-4xl font-black text-white">₹{financials.expensesTotal || 0}</h2>
                  <p className="text-red-400 text-sm mt-2 font-medium">All logged expenses</p>
                </div>

                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 sm:p-8 relative overflow-hidden group bg-green-500/5">
                  <div className="absolute top-0 left-0 w-full h-1 bg-green-500"></div>
                  <p className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-2">Net Remaining</p>
                  <h2 className="text-4xl font-black text-green-400">
                    {financials.netRemaining < 0 ? '-' : ''}₹{Math.abs(financials.netRemaining)}
                  </h2>
                  <p className="text-green-500/80 text-sm mt-2 font-medium">Revenue minus expenses</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                    <div className="p-6 sm:p-8 border-b border-white/10">
                      <h2 className="text-2xl font-bold text-white">Expense Log</h2>
                      <p className="text-gray-400 text-sm mt-1">All expenses recorded for this event</p>
                    </div>
                    
                    {(!financials.expensesLog || financials.expensesLog.length === 0) ? (
                      <div className="p-12 text-center text-gray-500 font-medium">
                        No expenses logged for this event yet.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-300">
                          <thead className="bg-black/40 text-gray-400 uppercase font-semibold text-xs">
                            <tr>
                              <th className="px-6 py-4">Date</th>
                              <th className="px-6 py-4">Description</th>
                              <th className="px-6 py-4 text-right">Amount</th>
                              <th className="px-6 py-4 text-center">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {financials.expensesLog.map((exp: any) => (
                              <tr key={exp.id} className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                  {new Date(exp.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 font-medium text-white">{exp.description}</td>
                                <td className="px-6 py-4 text-right font-bold text-red-400">
                                  -₹{exp.amount}
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <button 
                                    onClick={() => handleDeleteExpense(exp.id)}
                                    className="text-gray-500 hover:text-red-500 transition-colors"
                                  >
                                    <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl">
                    <h2 className="text-xl font-bold text-white mb-6">Log New Expense</h2>
                    <form onSubmit={handleAddExpense} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Description</label>
                        <input 
                          type="text" 
                          required
                          value={expenseDescription}
                          onChange={e => setExpenseDescription(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors"
                          placeholder="e.g. Venue Booking"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Amount (₹)</label>
                        <input 
                          type="number" 
                          required
                          min="1"
                          value={expenseAmount}
                          onChange={e => setExpenseAmount(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors"
                          placeholder="e.g. 5000"
                        />
                      </div>
                      <button 
                        type="submit" 
                        disabled={isSubmitting || !selectedEventId}
                        className="w-full bg-red-500 text-white font-bold rounded-xl py-3 mt-2 hover:bg-red-600 transition-colors disabled:opacity-50 disabled:hover:bg-red-500"
                      >
                        {isSubmitting ? "Adding..." : "Add Expense"}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
