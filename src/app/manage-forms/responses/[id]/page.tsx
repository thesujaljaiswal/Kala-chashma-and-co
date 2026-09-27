"use client";

import { useState, useEffect, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/AdminSidebar";
import { getFormResponses, verifyFormPayment, getFormById } from "@/app/actions";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export default function FormResponsesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();

  const [form, setForm] = useState<any>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedResponse, setSelectedResponse] = useState<any>(null);
  const [selectedPaymentDetails, setSelectedPaymentDetails] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchData();
    }
  }, [status, id]);

  const fetchData = async () => {
    setIsLoading(true);
    const [formData, responsesData] = await Promise.all([
      getFormById(id),
      getFormResponses(id)
    ]);
    setForm(formData);
    setResponses(responsesData);
    setIsLoading(false);
  };

  const handleVerifyPayment = async (responseId: string) => {
    setIsVerifying(true);
    const res = await verifyFormPayment(responseId);
    if (res.success) {
      if (selectedPaymentDetails) {
        setSelectedPaymentDetails({ ...selectedPaymentDetails, paymentStatus: 'success' });
      }
      if (selectedResponse && selectedResponse._id === responseId) {
        setSelectedResponse({ ...selectedResponse, paymentStatus: 'success' });
      }
      const updated = await getFormResponses(id);
      setResponses(updated);
      alert("Payment verified and ticket sent successfully!");
    } else {
      alert(res.error ? `Failed: ${res.error}` : "Failed to verify payment");
    }
    setIsVerifying(false);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const truncateText = (text: any, maxLength: number = 30) => {
    if (!text) return "-";
    const str = String(text);
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength) + "...";
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-[calc(100vh-64px)] bg-black/20 gap-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '-0.3s' }}></div>
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '-0.15s' }}></div>
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
        </div>
        <div className="text-gray-400 font-medium text-sm animate-pulse mt-2">Loading Responses...</div>
      </div>
    );
  }

  if (!session?.user) return null;
  if (!form) return (
    <div className="flex w-full min-h-[calc(100vh-64px)] relative overflow-hidden bg-black/20 text-white justify-center items-center">
      Form not found.
    </div>
  );

  return (
    <div className="flex w-full min-h-[calc(100vh-64px)] relative overflow-hidden bg-black/20">
      <AdminSidebar activeTab="forms" title="Manage Forms" />

      <div className="flex-1 flex flex-col w-full h-[calc(100vh-64px)] overflow-y-auto">
        <div className="p-3 sm:p-4 md:p-8 w-full max-w-7xl mx-auto pb-24 pt-20 md:pt-8">
          
          <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500"></div>
            
            <div className="flex justify-between items-center mb-6">
              <div>
                <Link href="/manage-forms" className="text-gray-400 hover:text-white flex items-center gap-1 mb-2 text-sm font-semibold inline-flex">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                  Back to Forms
                </Link>
                <h2 className="text-2xl font-bold text-white">Responses for {form.name}</h2>
              </div>
              <div className="text-indigo-400 font-bold bg-indigo-500/10 px-4 py-2 rounded-xl">
                {responses.length} Submissions
              </div>
            </div>

            {responses.length === 0 ? (
              <div className="text-gray-400 py-10 text-center bg-black/20 rounded-2xl border border-white/5">No responses yet.</div>
            ) : (
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left text-sm text-gray-300">
                  <thead className="bg-black/40 text-gray-400 uppercase font-semibold text-xs rounded-xl">
                    <tr>
                      <th className="px-4 py-3 rounded-l-xl">Submitted</th>
                      {form.fields.map((f: any, i: number) => (
                        <th key={i} className={`px-4 py-3 ${(!form.isPaymentEnabled && i === form.fields.length - 1) ? 'rounded-r-xl' : ''}`}>
                          {f.label}
                        </th>
                      ))}
                      {form.isPaymentEnabled && (
                        <th className="px-4 py-3 rounded-r-xl">Payment</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {responses.map((res: any, idx: number) => (
                      <tr 
                        key={idx} 
                        className="border-b border-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                        onClick={() => setSelectedResponse(res)}
                      >
                        <td className="px-4 py-4 whitespace-nowrap text-gray-500">{formatDate(res.createdAt)}</td>
                        {form.fields.map((f: any, i: number) => {
                          const answer = res.responses.find((r: any) => (f.id && r.fieldId === f.id) || r.label === f.label)?.value || "-";
                          return (
                            <td key={i} className="px-4 py-4 text-white font-medium max-w-xs">
                              {answer.startsWith('http') ? (
                                <span className="text-blue-400 font-semibold flex items-center gap-1">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                                  View Image
                                </span>
                              ) : (
                                truncateText(answer, 30)
                              )}
                            </td>
                          );
                        })}
                        {form.isPaymentEnabled && (
                          <td className="px-4 py-4">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${res.paymentStatus === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                              {res.paymentStatus || 'Pending'}
                            </span>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Response Details Modal */}
      <AnimatePresence>
        {selectedResponse && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedResponse(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="flex justify-between items-center p-6 border-b border-white/10 bg-black/20">
                <h3 className="text-xl font-bold text-white">Submission Details</h3>
                <button
                  onClick={() => setSelectedResponse(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
                <div className="text-sm text-gray-400 pb-4 border-b border-white/10">
                  <span className="font-semibold text-gray-300">Submitted at:</span> {formatDate(selectedResponse.createdAt)}
                </div>

                <div className="space-y-4">
                  {form.fields.map((f: any, i: number) => {
                    const answer = selectedResponse.responses.find((r: any) => (f.id && r.fieldId === f.id) || r.label === f.label)?.value || "-";
                    return (
                      <div key={i} className="bg-black/30 p-4 rounded-xl border border-white/5">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{f.label}</h4>
                        {answer.startsWith('http') ? (
                          <div className="mt-2">
                            <img src={answer} alt="Uploaded Image" className="max-w-full max-h-64 object-contain rounded-lg border border-white/10 cursor-pointer" onClick={() => setPreviewImage(answer)} />
                          </div>
                        ) : (
                          <p className="text-white text-sm whitespace-pre-wrap">{answer}</p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {form.isPaymentEnabled && (
                  <div className="bg-indigo-900/20 p-5 rounded-xl border border-indigo-500/20">
                    <h4 className="text-sm font-bold text-indigo-400 uppercase tracking-wider mb-3">Payment Information</h4>
                    <div className="space-y-2 text-sm">
                      <p><span className="text-gray-400">Status:</span> <span className={`font-semibold ${selectedResponse.paymentStatus === 'success' ? 'text-green-400' : 'text-yellow-400'}`}>{selectedResponse.paymentStatus || 'Pending'}</span></p>
                      <p><span className="text-gray-400">Transaction ID:</span> <span className="text-white font-mono">{selectedResponse.transactionId || "N/A"}</span></p>
                      <p><span className="text-gray-400">Amount:</span> <span className="text-white">₹{form.paymentAmount || 0}</span></p>
                    </div>
                    {selectedResponse.paymentStatus !== 'success' && (
                      <button
                        onClick={() => handleVerifyPayment(selectedResponse._id)}
                        disabled={isVerifying}
                        className="mt-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-2 px-4 rounded-xl w-full transition-colors"
                      >
                        {isVerifying ? "Verifying..." : "Mark as Paid & Send Ticket"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Preview Modal */}
      <AnimatePresence>
        {previewImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
            onClick={() => setPreviewImage(null)}
          >
            <div className="relative max-w-full max-h-full">
              <button
                onClick={() => setPreviewImage(null)}
                className="absolute -top-12 right-0 text-white/70 hover:text-white bg-white/10 p-2 rounded-full backdrop-blur-md transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
              <img 
                src={previewImage} 
                alt="Preview" 
                className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg border border-white/20 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
