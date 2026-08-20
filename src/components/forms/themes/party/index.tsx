import { motion, AnimatePresence } from "framer-motion";
import { ThemeProps } from "../ThemeProps";

export default function PartyTheme({
  form,
  responses,
  setResponses,
  isSubmitting,
  paymentConfirmed,
  setPaymentConfirmed,
  isSuccess,
  errorMsg,
  errorField,
  handleSubmit,
  showUndertakingModal,
  setShowUndertakingModal,
  currentUndertakingField,
  setCurrentUndertakingField
}: ThemeProps) {
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0a0a0f] relative overflow-hidden font-sans text-gray-200">
      
      {/* Club Lighting / Laser Effects Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Pulsing deep bass background */}
        <motion.div 
          animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(67,56,202,0.15),_rgba(0,0,0,1))]"
        />
        
        {/* Moving Neon Orbs (cyan and purple) */}
        <motion.div 
          animate={{ 
            x: ["-20%", "20%", "-10%", "-20%"],
            y: ["0%", "20%", "-20%", "0%"],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/4 left-1/4 w-[40vw] h-[40vw] bg-fuchsia-600/20 rounded-full blur-[120px] mix-blend-screen"
        />
        <motion.div 
          animate={{ 
            x: ["20%", "-20%", "10%", "20%"],
            y: ["20%", "-10%", "30%", "20%"],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-1/4 right-1/4 w-[50vw] h-[50vw] bg-cyan-600/20 rounded-full blur-[150px] mix-blend-screen"
        />
        
        {/* Subtle Grid overlay for texture */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] opacity-20"></div>
      </div>

      <motion.main 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="w-full max-w-xl bg-[#12121a]/80 backdrop-blur-2xl border border-white/5 shadow-[0_0_40px_rgba(147,51,234,0.15)] rounded-3xl p-6 sm:p-10 relative z-10 my-8"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-fuchsia-500 rounded-t-3xl opacity-80"></div>

        {isSuccess ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 mb-8 shadow-[0_0_30px_rgba(168,85,247,0.4)]">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-4xl font-black text-white mb-4 tracking-tight uppercase">You're On The List</h2>
            <p className="text-gray-400 text-lg">
              Your RSVP has been secured. Get ready.
              {form.isPaymentEnabled && form.paymentAmount > 0 && <br/>}
              {form.isPaymentEnabled && form.paymentAmount > 0 && (
                <span className="text-cyan-400 font-bold mt-4 block">
                  Access pass pending payment verification.
                </span>
              )}
            </p>
          </motion.div>
        ) : (
          <>
            <div className="mb-12 text-center">
              <h1 className="text-4xl sm:text-5xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 tracking-tight uppercase">
                {form.name}
              </h1>
              {form.description ? (
                <p className="text-gray-400 whitespace-pre-wrap text-sm leading-relaxed">{form.description}</p>
              ) : (
                <p className="text-purple-400 font-semibold tracking-widest text-sm uppercase">Guestlist Registration</p>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              
              <AnimatePresence>
                {errorMsg && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: 'auto' }} 
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-red-500/10 text-red-400 px-4 py-3 rounded-xl border border-red-500/20 text-sm font-medium flex items-center gap-3 overflow-hidden"
                  >
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    <span>{errorMsg}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {form.fields.map((field: any, idx: number) => (
                <div 
                  key={idx} 
                  id={`field-${field.label.replace(/\s+/g, '-')}`}
                  className={`space-y-2 transition-all ${errorField === field.label ? 'ring-1 ring-red-500/50 bg-red-500/5 p-4 rounded-2xl -mx-4' : ''}`}
                >
                  <label className="block text-sm font-semibold text-gray-300 tracking-wide">
                    {field.label} {field.required && <span className="text-cyan-500 ml-1">*</span>}
                  </label>
                  {field.type === 'dropdown' ? (
                    <div className="relative">
                      <select
                        required={field.required}
                        value={responses[field.label] || ""}
                        onChange={(e) => setResponses({ ...responses, [field.label]: e.target.value })}
                        disabled={isSubmitting}
                        className="w-full bg-[#1a1a24] border border-white/10 rounded-xl px-4 py-3.5 text-white appearance-none focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all cursor-pointer disabled:opacity-50 text-base"
                      >
                        <option value="" disabled>Select an option</option>
                        {field.options?.map((opt: string, i: number) => (
                          <option key={i} value={opt}>{opt}</option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </div>
                  ) : field.type === 'radio' ? (
                    <div className="space-y-3 pt-2">
                      {field.options?.map((opt: string, i: number) => (
                        <label key={i} className="flex items-center gap-4 cursor-pointer group bg-[#1a1a24] border border-white/5 p-3.5 rounded-xl hover:border-purple-500/50 transition-colors">
                          <input
                            type="radio"
                            name={field.label}
                            value={opt}
                            required={field.required}
                            checked={responses[field.label] === opt}
                            onChange={(e) => setResponses({ ...responses, [field.label]: e.target.value })}
                            disabled={isSubmitting}
                            className="w-5 h-5 text-purple-600 bg-black/50 border-white/20 focus:ring-purple-600 focus:ring-offset-[#12121a] cursor-pointer"
                          />
                          <span className="text-gray-300 group-hover:text-white font-medium transition-colors">{opt}</span>
                        </label>
                      ))}
                    </div>
                  ) : field.type === 'checkbox' ? (
                    <div className="space-y-3 pt-2">
                      {field.options?.map((opt: string, i: number) => {
                        const currentVal = responses[field.label] || "";
                        const selectedArr = currentVal ? currentVal.split(", ") : [];
                        const isChecked = selectedArr.includes(opt);
                        return (
                          <label key={i} className="flex items-center gap-4 cursor-pointer group bg-[#1a1a24] border border-white/5 p-3.5 rounded-xl hover:border-cyan-500/50 transition-colors">
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
                              className="w-5 h-5 text-cyan-500 bg-black/50 border-white/20 rounded focus:ring-cyan-500 focus:ring-offset-[#12121a] cursor-pointer"
                            />
                            <span className="text-gray-300 group-hover:text-white font-medium transition-colors">{opt}</span>
                          </label>
                        );
                      })}
                    </div>
                  ) : field.type === 'undertaking' ? (
                    <div className="pt-2">
                      {responses[field.label] === "Accepted" ? (
                        <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-xl">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          <span className="font-semibold tracking-wide">Terms Accepted</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentUndertakingField(field.label);
                            setShowUndertakingModal(true);
                          }}
                          disabled={isSubmitting}
                          className="w-full bg-[#1a1a24] hover:bg-[#232333] border border-white/10 text-white p-4 rounded-xl font-semibold tracking-wide transition-colors flex items-center justify-between group"
                        >
                          <span>Review Terms & Conditions</span>
                          <svg className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </button>
                      )}
                    </div>
                  ) : field.type === 'file' ? (
                    <div className="pt-2">
                      <input
                        type="file"
                        accept="image/*"
                        required={field.required}
                        disabled={isSubmitting}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setResponses({ ...responses, [field.label]: reader.result as string });
                            };
                            reader.readAsDataURL(file);
                          } else {
                            const newResponses = { ...responses };
                            delete newResponses[field.label];
                            setResponses(newResponses);
                          }
                        }}
                        className="w-full text-sm text-gray-400 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 transition-all cursor-pointer"
                      />
                      {responses[field.label] && responses[field.label].startsWith('data:image') && (
                        <div className="mt-4 rounded-xl overflow-hidden w-32 h-32 border border-white/10 shadow-lg relative group">
                          <img src={responses[field.label]} alt="Preview" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <input
                      type={field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : 'text'}
                      required={field.required}
                      value={responses[field.label] || ""}
                      onChange={(e) => setResponses({ ...responses, [field.label]: e.target.value })}
                      disabled={isSubmitting}
                      className="w-full bg-[#1a1a24] border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder-gray-600 font-medium"
                      placeholder={field.type === 'email' ? 'email@example.com' : field.type === 'number' ? '0' : 'Enter details...'}
                    />
                  )}
                </div>
              ))}

              {form.isPaymentEnabled && form.paymentAmount > 0 && (
                <div className="bg-[#1a1a24] p-6 rounded-2xl border border-white/5 space-y-5 mt-8 shadow-inner relative overflow-hidden">
                  <div className="absolute -right-10 -top-10 w-32 h-32 bg-purple-500/10 blur-[30px] rounded-full"></div>
                  
                  <div className="relative z-10">
                    <h3 className="text-xl font-bold text-white tracking-wide">Cover Charge</h3>
                    <p className="text-gray-400 text-sm mt-1">Amount required for entry: <span className="text-white font-mono bg-white/10 px-2 py-0.5 rounded">₹{form.paymentAmount}</span></p>
                  </div>
                  
                  <div className="w-48 h-48 bg-white rounded-xl p-2 mx-auto shadow-lg relative z-10">
                    <img src="/payment QR.jpeg" alt="Payment QR Code" className="w-full h-full object-cover rounded-lg" />
                  </div>
                  
                  <div className="pt-2 text-center relative z-10">
                    <a 
                      href={`upi://pay?pa=musabansariofficial212005@oksbi&pn=Rtr.%20Musab%20Ansari&aid=uGICAgKDGwvbnHg&am=${form.paymentAmount}&cu=INR`}
                      className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-semibold transition-colors border border-white/10"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                      Pay via UPI App
                    </a>
                  </div>

                  <div className="pt-5 border-t border-white/5 relative z-10">
                    <label className="flex items-center justify-center gap-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={paymentConfirmed} 
                        onChange={(e) => setPaymentConfirmed(e.target.checked)} 
                        className="w-5 h-5 bg-black/50 border-white/20 text-purple-500 focus:ring-purple-500 rounded cursor-pointer"
                      />
                      <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">I have completed the payment of ₹{form.paymentAmount}</span>
                    </label>
                  </div>
                </div>
              )}

              <div className="pt-4 mt-8">
                <button
                  type="submit"
                  disabled={isSubmitting || (form.isPaymentEnabled && form.paymentAmount > 0 && !paymentConfirmed)}
                  className="w-full bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-bold py-4 px-8 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_30px_rgba(147,51,234,0.5)] tracking-wide"
                >
                  {isSubmitting ? "Processing..." : form.isPaymentEnabled && form.paymentAmount > 0 ? "Pay & RSVP" : "Confirm RSVP"}
                </button>
              </div>

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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-[#12121a] rounded-2xl border border-white/10 p-6 sm:p-8 max-w-lg w-full shadow-2xl relative"
            >
              <h3 className="text-2xl font-bold text-white mb-6">Terms & Conditions</h3>
              
              <div className="bg-[#0a0a0f] border border-white/5 rounded-xl p-5 mb-8 h-[300px] overflow-y-auto text-sm text-gray-400 space-y-4 font-medium scrollbar-thin scrollbar-thumb-white/10">
                <ol className="list-decimal pl-4 space-y-4 marker:text-purple-500">
                  <li><strong className="text-gray-200">Accuracy:</strong> All information provided is accurate and true to the best of my knowledge.</li>
                  <li><strong className="text-gray-200">Data Usage:</strong> I consent to my data being used for event organization and evaluation purposes.</li>
                  <li><strong className="text-gray-200">Guidelines:</strong> I agree to abide by all conditions, rules, and dress codes set by the organizers.</li>
                  <li><strong className="text-gray-200">Liability:</strong> I release the organizers, venue, and affiliates from any liabilities, claims, or damages.</li>
                  <li><strong className="text-gray-200">Right of Admission:</strong> The organizers reserve the right of admission. RSVP does not guarantee entry.</li>
                </ol>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowUndertakingModal(false)}
                  className="py-3 px-6 text-gray-400 font-medium hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (currentUndertakingField) {
                      setResponses({ ...responses, [currentUndertakingField]: "Accepted" });
                    }
                    setShowUndertakingModal(false);
                  }}
                  className="py-3 px-6 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors"
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
