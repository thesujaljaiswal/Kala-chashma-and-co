"use client";

import { useState, useEffect, use } from "react";
import { getFormByShareId, submitFormResponse } from "@/app/actions";
import { motion, AnimatePresence } from "framer-motion";

export default function PublicFormPage({ params }: { params: Promise<{ shareId: string }> }) {
  const unwrappedParams = use(params);
  const [form, setForm] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    // Dynamically load Razorpay checkout script
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);
  const [errorField, setErrorField] = useState<string | null>(null);
  const [showUndertakingModal, setShowUndertakingModal] = useState(false);
  const [currentUndertakingField, setCurrentUndertakingField] = useState<string | null>(null);

  useEffect(() => {
    const fetchForm = async () => {
      const data = await getFormByShareId(unwrappedParams.shareId);
      if (data) setForm(data);
      setIsLoading(false);
    };
    fetchForm();
  }, [unwrappedParams.shareId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;

    setErrorField(null);
    setErrorMsg("");

    // Validate required fields and undertakings
    for (const field of form.fields) {
      if (field.required && !responses[field.label]?.trim()) {
        setErrorMsg(`Please answer: ${field.label}`);
        setErrorField(field.label);
        document.getElementById(`field-${field.label.replace(/\s+/g, '-')}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      
      if (field.type === 'undertaking' && responses[field.label] !== 'Accepted') {
        setErrorMsg(`You must accept the undertaking: ${field.label}`);
        setErrorField(field.label);
        document.getElementById(`field-${field.label.replace(/\s+/g, '-')}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
    }

    setIsSubmitting(true);

    const responsesArray = Object.keys(responses).map(label => ({
      label,
      value: responses[label]
    }));

    if (form.isPaymentEnabled && form.paymentAmount > 0) {
      const result = await submitFormResponse(form._id, responsesArray, 'pending');
      if (result.success) {
        try {
          const res = await fetch('/api/payment/initiate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              formResponseId: result.responseId,
              amount: form.paymentAmount,
              formName: form.name
            })
          });
          const data = await res.json();
          if (data.success && data.order_id) {
            
            const options = {
              key: data.key_id, 
              amount: data.amount,
              currency: data.currency,
              name: "Kala Chashma and Co.",
              description: form.name,
              order_id: data.order_id,
              handler: async function (response: any) {
                // Verify payment on our backend
                try {
                  const verifyRes = await fetch('/api/payment/callback', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      razorpay_payment_id: response.razorpay_payment_id,
                      razorpay_order_id: response.razorpay_order_id,
                      razorpay_signature: response.razorpay_signature,
                      formResponseId: result.responseId
                    })
                  });
                  const verifyData = await verifyRes.json();
                  if (verifyData.success) {
                    setIsSuccess(true);
                  } else {
                    setErrorMsg("Payment verification failed. Please contact support.");
                  }
                } catch (e) {
                  setErrorMsg("Error during payment verification.");
                }
              },
              prefill: {
                name: responses["Name"] || responses["Full Name"] || "",
                email: responses["Email"] || "",
                contact: responses["Phone Number"] || responses["Phone"] || ""
              },
              theme: {
                color: "#1E4E8C"
              }
            };
            
            const rzp = new (window as any).Razorpay(options);
            
            rzp.on('payment.failed', function (response: any) {
               setErrorMsg(response.error.description || "Payment failed.");
            });
            
            rzp.open();
            
            setIsSubmitting(false); // Modal handles the rest
          } else {
            setErrorMsg("Payment initiation failed. Please try again.");
            setIsSubmitting(false);
          }
        } catch (err) {
          setErrorMsg("Payment setup error. Please contact support.");
          setIsSubmitting(false);
        }
      } else {
        setErrorMsg("Something went wrong saving your response.");
        setIsSubmitting(false);
      }
    } else {
      const result = await submitFormResponse(form._id, responsesArray);
      setIsSubmitting(false);
      if (result.success) {
        setIsSuccess(true);
      } else {
        setErrorMsg("Something went wrong. Please try again.");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#FAF9F6]">
        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-2">
            <div className="w-4 h-4 bg-[#1E4E8C] rounded-full animate-bounce" style={{ animationDelay: '-0.3s' }}></div>
            <div className="w-4 h-4 bg-[#C69C6D] rounded-full animate-bounce" style={{ animationDelay: '-0.15s' }}></div>
            <div className="w-4 h-4 bg-[#E86A28] rounded-full animate-bounce"></div>
          </div>
          <span className="text-gray-500 font-medium">Loading Form...</span>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#FAF9F6]">
        <main className="max-w-md w-full bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-8 border border-red-200 text-center relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-1.5 bg-red-500"></div>
           <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Form Not Found</h2>
           <p className="text-gray-600 font-medium leading-relaxed">We couldn't find the form associated with this link. It may have been deleted or the link is broken.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#FAF9F6] relative overflow-hidden">
      {/* Background Mandala Elements - Light Theme */}
      <div className="fixed inset-0 z-0 pointer-events-none flex justify-center items-center overflow-hidden mix-blend-multiply">
        {/* Giant Rotating Mandala */}
        <motion.svg 
          animate={{ rotate: 360 }}
          transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
          viewBox="0 0 100 100" 
          className="absolute w-[150vw] h-[150vw] md:w-[90vw] md:h-[90vw] text-[#C69C6D]/15" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="0.3"
        >
          {[...Array(24)].map((_, i) => (
            <g key={i} transform={`rotate(${i * 15} 50 50)`}>
              <path d="M50 10 Q60 30 50 50 Q40 30 50 10" />
              <circle cx="50" cy="15" r="1.5" />
              <path d="M50 20 Q70 40 50 60 Q30 40 50 20" />
              <path d="M50 30 L60 50 L50 70 L40 50 Z" />
              <circle cx="50" cy="50" r="10" strokeDasharray="1 2" />
            </g>
          ))}
          <circle cx="50" cy="50" r="40" />
          <circle cx="50" cy="50" r="45" strokeDasharray="2 4" />
          <circle cx="50" cy="50" r="30" stroke="#1E4E8C" strokeWidth="0.1" strokeOpacity="0.2" />
        </motion.svg>
      </div>

      {/* Subtle Light Glows */}
      <div className="fixed inset-0 z-0 pointer-events-none mix-blend-multiply">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#E86A28]/10 blur-[100px] rounded-full animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#1E4E8C]/10 blur-[120px] rounded-full animate-pulse-slow delay-1000"></div>
      </div>

      <motion.main 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-xl bg-white/80 backdrop-blur-2xl rounded-[2rem] shadow-2xl p-6 sm:p-10 border border-white/50 relative z-10 my-8 overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#1E4E8C] via-[#C69C6D] to-[#E86A28]"></div>
        
        {isSuccess ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <div className="w-24 h-24 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">Response Submitted</h2>
            <p className="text-gray-600 font-medium">Thank you! Your response has been recorded.</p>
          </motion.div>
        ) : (
          <>
            <div className="text-center mb-10">
              <h1 className="text-3xl sm:text-4xl font-black mb-3 text-gray-900 tracking-tight">
                {form.name}
              </h1>
              {form.description ? (
                <p className="text-gray-600 font-medium whitespace-pre-wrap text-left text-sm bg-gray-50 p-4 rounded-xl border border-gray-100">{form.description}</p>
              ) : (
                <p className="text-gray-500 font-medium">Please fill out the form below.</p>
              )}

            </div>

            <form onSubmit={handleSubmit} className="space-y-6 -mx-3 px-3" noValidate>
              
              <AnimatePresence>
                {errorMsg && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0 }}
                    className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-semibold text-center mx-3"
                  >
                    {errorMsg}
                  </motion.div>
                )}
              </AnimatePresence>

              {form.fields.map((field: any, idx: number) => (
                <div 
                  key={idx} 
                  id={`field-${field.label.replace(/\s+/g, '-')}`}
                  className={`space-y-2 p-3 rounded-2xl transition-all duration-300 ${errorField === field.label ? 'ring-2 ring-red-500 bg-red-50/50' : ''}`}
                >
                  <label className="block text-sm font-bold text-gray-700 px-1">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  {field.type === 'dropdown' ? (
                    <div className="relative">
                      <select
                        required={field.required}
                        value={responses[field.label] || ""}
                        onChange={(e) => setResponses({ ...responses, [field.label]: e.target.value })}
                        disabled={isSubmitting}
                        className="w-full bg-white/90 border border-gray-200 rounded-2xl px-5 py-4 text-gray-900 appearance-none focus:outline-none focus:ring-2 focus:ring-[#1E4E8C]/20 focus:border-[#1E4E8C] transition-all cursor-pointer shadow-sm disabled:opacity-50 font-medium text-lg"
                      >
                        <option value="" disabled>Select an option</option>
                        {field.options?.map((opt: string, i: number) => (
                          <option key={i} value={opt}>{opt}</option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center px-5 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  ) : field.type === 'radio' ? (
                    <div className="space-y-3 bg-white/50 p-5 rounded-2xl border border-gray-200">
                      {field.options?.map((opt: string, i: number) => (
                        <label key={i} className="flex items-center gap-3 cursor-pointer group">
                          <input
                            type="radio"
                            name={field.label}
                            value={opt}
                            required={field.required}
                            checked={responses[field.label] === opt}
                            onChange={(e) => setResponses({ ...responses, [field.label]: e.target.value })}
                            disabled={isSubmitting}
                            className="w-5 h-5 text-[#1E4E8C] border-gray-300 focus:ring-[#1E4E8C] transition-colors cursor-pointer disabled:opacity-50"
                          />
                          <span className="text-gray-800 font-medium group-hover:text-black transition-colors">{opt}</span>
                        </label>
                      ))}
                    </div>
                  ) : field.type === 'checkbox' ? (
                    <div className="space-y-3 bg-white/50 p-5 rounded-2xl border border-gray-200">
                      {field.options?.map((opt: string, i: number) => {
                        const currentVal = responses[field.label] || "";
                        const selectedArr = currentVal ? currentVal.split(", ") : [];
                        const isChecked = selectedArr.includes(opt);
                        return (
                          <label key={i} className="flex items-center gap-3 cursor-pointer group">
                            <input
                              type="checkbox"
                              name={field.label}
                              value={opt}
                              checked={isChecked}
                              onChange={(e) => {
                                const arr = [...selectedArr];
                                if (e.target.checked) {
                                  arr.push(opt);
                                } else {
                                  const idx = arr.indexOf(opt);
                                  if (idx > -1) arr.splice(idx, 1);
                                }
                                setResponses({ ...responses, [field.label]: arr.join(", ") });
                              }}
                              disabled={isSubmitting}
                              className="w-5 h-5 text-[#1E4E8C] border-gray-300 rounded focus:ring-[#1E4E8C] transition-colors cursor-pointer disabled:opacity-50"
                            />
                            <span className="text-gray-800 font-medium group-hover:text-black transition-colors">{opt}</span>
                          </label>
                        );
                      })}
                    </div>
                  ) : field.type === 'undertaking' ? (
                    <div className="bg-white/50 p-6 rounded-2xl border border-gray-200 text-center">
                      {responses[field.label] === "Accepted" ? (
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                          </div>
                          <span className="text-green-700 font-bold">Undertaking Accepted</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentUndertakingField(field.label);
                            setShowUndertakingModal(true);
                          }}
                          disabled={isSubmitting}
                          className="px-6 py-3 bg-[#1E4E8C]/10 hover:bg-[#1E4E8C]/20 text-[#1E4E8C] font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mx-auto"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                          Click here to Review and Accept Undertaking
                        </button>
                      )}
                    </div>
                  ) : (
                    <input
                      type={field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : 'text'}
                      required={field.required}
                      value={responses[field.label] || ""}
                      onChange={(e) => setResponses({ ...responses, [field.label]: e.target.value })}
                      disabled={isSubmitting}
                      className="w-full bg-white/90 border border-gray-200 rounded-2xl px-5 py-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1E4E8C]/20 focus:border-[#1E4E8C] transition-all placeholder-gray-400 font-medium text-lg shadow-sm"
                      placeholder={field.type === 'email' ? 'your@email.com' : field.type === 'number' ? field.label : 'Your answer'}
                    />
                  )}
                </div>
              ))}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-[#1E4E8C] to-[#0A2A5C] hover:from-[#153A6E] hover:to-[#071D40] text-white font-bold py-4 px-6 rounded-2xl shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100 flex items-center justify-center gap-2 text-lg mt-8"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Processing...
                  </>
                ) : (
                  form.isPaymentEnabled && form.paymentAmount > 0 ? `Pay ₹${form.paymentAmount} & Submit` : "Submit Response"
                )}
              </button>

            </form>
          </>
        )}
      </motion.main>

      <AnimatePresence>
        {showUndertakingModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl overflow-hidden"
            >
              <h3 className="text-2xl font-black text-gray-900 mb-4">General Declaration & Undertaking</h3>
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 mb-6 h-[400px] overflow-y-auto custom-scrollbar">
                <p className="text-gray-800 font-bold text-sm leading-relaxed mb-4">
                  By clicking "I Accept" below, you legally acknowledge, affirm, and agree to the following terms and conditions:
                </p>
                <ol className="list-decimal pl-5 space-y-4 text-gray-700 text-sm leading-relaxed">
                  <li>
                    <strong className="text-gray-900">Accuracy of Information:</strong> I hereby declare and affirm that all the information, documents, and statements provided by me in this submission are true, accurate, and complete to the best of my knowledge and belief. I understand that the organizers reserve the right to verify the authenticity of the information provided at any stage.
                  </li>
                  <li>
                    <strong className="text-gray-900">Consequences of Misrepresentation:</strong> I acknowledge that any false, misleading, or intentionally inaccurate information may lead to the immediate rejection of this submission, cancellation of my participation, and potential legal or disciplinary action as deemed appropriate by the organizing committee.
                  </li>
                  <li>
                    <strong className="text-gray-900">Data Privacy and Consent:</strong> I explicitly grant consent to the organizers and their affiliated partners to collect, store, process, and utilize my personal data provided herein for the purposes of evaluation, communication, and administration. I understand that my data will be handled in accordance with applicable data protection regulations.
                  </li>
                  <li>
                    <strong className="text-gray-900">Compliance with Rules:</strong> I agree to abide by all the rules, regulations, terms, and conditions set forth by the organizers. I understand that the organizers reserve the right to modify these rules at their sole discretion, and I agree to be bound by any such amendments.
                  </li>
                  <li>
                    <strong className="text-gray-900">Liability Waiver:</strong> I hereby release, discharge, and hold harmless the organizers, their employees, agents, and representatives from any and all claims, liabilities, damages, or expenses arising out of my participation or submission.
                  </li>
                  <li>
                    <strong className="text-gray-900">Finality of Decisions:</strong> I acknowledge that all decisions made by the organizing committee or evaluation panel regarding this submission are final, binding, and not subject to appeal.
                  </li>
                </ol>
                <p className="text-gray-800 font-semibold text-sm leading-relaxed mt-6 bg-blue-50 p-4 rounded-xl border border-blue-100">
                  By electronically accepting this undertaking, I confirm that I have read, understood, and agreed to all the terms and conditions outlined above. This electronic acceptance shall bear the same legal validity and enforceability as a physical signature.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowUndertakingModal(false)}
                  className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
                >
                  Decline
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (currentUndertakingField) {
                      setResponses({ ...responses, [currentUndertakingField]: "Accepted" });
                    }
                    setShowUndertakingModal(false);
                  }}
                  className="flex-1 py-3 px-4 bg-[#1E4E8C] hover:bg-[#153A6E] text-white font-bold rounded-xl transition-colors shadow-lg"
                >
                  I Accept
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
