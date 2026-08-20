import { motion, AnimatePresence } from "framer-motion";
import { ThemeProps } from "../ThemeProps";

export default function FightClubTheme({
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#050505] relative overflow-hidden font-mono text-gray-300">
      
      {/* Background concrete texture effect */}
      <div className="fixed inset-0 z-0 opacity-30 pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22/%3E%3C/svg%3E")', mixBlendMode: 'overlay' }}></div>
      <div className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#1a1a1a]/50 via-[#050505]/90 to-black pointer-events-none"></div>

      {/* Paper Street Soap SVG Graphic */}
      <div className="fixed -bottom-32 -right-20 z-[1] opacity-30 pointer-events-none rotate-[-15deg] blur-[1px]">
        <svg width="400" height="250" viewBox="0 0 400 250" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="20" y="20" width="360" height="210" rx="20" fill="#e63946" stroke="#991b1b" strokeWidth="6"/>
          <path d="M40 50 Q 200 70 360 50" stroke="#991b1b" strokeWidth="3" fill="none" opacity="0.4"/>
          <path d="M40 200 Q 200 180 360 200" stroke="#991b1b" strokeWidth="3" fill="none" opacity="0.4"/>
          <text x="200" y="130" fontFamily="Impact, sans-serif" fontSize="48" fontWeight="bold" fill="#ffb3c1" textAnchor="middle" letterSpacing="1">PAPER STREET</text>
          <text x="200" y="175" fontFamily="Impact, sans-serif" fontSize="32" fontWeight="bold" fill="#ffb3c1" textAnchor="middle" letterSpacing="4">SOAP CO.</text>
        </svg>
      </div>

      <motion.main 
        initial={{ opacity: 0, rotate: -1, scale: 0.98 }}
        animate={{ opacity: 1, rotate: 0, scale: 1 }}
        transition={{ duration: 0.3, type: "spring", bounce: 0.4 }}
        className="w-full max-w-xl bg-[#0f0e0e] border-2 border-[#2b2b2b] shadow-[10px_10px_0px_#000] p-6 sm:p-10 relative z-10 my-8"
      >
        {/* Gritty Tape Corners */}
        <div className="absolute -top-4 -left-6 w-24 h-8 bg-yellow-900/60 rotate-[-15deg] backdrop-blur-md shadow-md opacity-80 border-t border-yellow-700/30"></div>
        <div className="absolute -bottom-4 -right-6 w-24 h-8 bg-yellow-900/60 rotate-[-25deg] backdrop-blur-md shadow-md opacity-80 border-t border-yellow-700/30"></div>

        {/* Ink / Blood Splatter */}
        <div className="absolute -top-1 right-8 opacity-70 pointer-events-none">
          <svg width="30" height="70" viewBox="0 0 30 70" fill="#991b1b">
            <path d="M10,0 C10,20 20,25 20,40 C20,50 15,60 15,70 C15,60 25,45 25,30 C25,10 20,0 10,0 Z" />
            <circle cx="26" cy="55" r="3" />
            <circle cx="12" cy="45" r="1.5" />
          </svg>
        </div>

        {isSuccess ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="text-[#e63946] font-black text-4xl sm:text-5xl mb-6 tracking-tighter uppercase drop-shadow-[2px_2px_0px_#000]" style={{ fontFamily: 'Impact, sans-serif' }}>
              I AM JACK'S<br/>COMPLETE LACK<br/>OF SURPRISE.
            </div>
            <div className="border-t-2 border-dashed border-[#2b2b2b] pt-8 mt-8">
              <p className="text-gray-400 font-bold leading-relaxed uppercase tracking-wider text-sm">
                You are not your job. You are not how much money you have in the bank. You are not the car you drive.
              </p>
              <p className="text-white text-lg font-black mt-6 uppercase tracking-widest bg-[#e63946] text-black inline-block px-4 py-2">
                YOUR RESPONSE IS LOGGED IN PROJECT MAYHEM.
              </p>
              {form.isPaymentEnabled && form.paymentAmount > 0 && (
                <p className="text-[#e63946] font-bold mt-4 uppercase text-xs tracking-widest border border-[#e63946] inline-block p-2">
                  [ TICKET TRANSMISSION PENDING PAYMENT VERIFICATION ]
                </p>
              )}
            </div>
          </motion.div>
        ) : (
          <>
            <div className="mb-10 text-center border-b-2 border-[#2b2b2b] pb-8 relative">
              <p className="text-[#e63946] text-xs font-black uppercase tracking-[0.3em] mb-3">Homework Assignment</p>
              <h1 className="text-4xl sm:text-5xl font-black mb-6 text-white uppercase tracking-tighter" style={{ fontFamily: 'Impact, sans-serif' }}>
                {form.name}
              </h1>
              {form.description && (
                <div className="bg-black/50 border-l-4 border-[#e63946] p-4 text-left">
                  <p className="text-gray-400 whitespace-pre-wrap text-sm uppercase tracking-wide leading-relaxed">{form.description}</p>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-8" noValidate>
              
              <AnimatePresence>
                {errorMsg && (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    exit={{ opacity: 0 }}
                    className="bg-black text-[#e63946] px-4 py-3 border-2 border-[#e63946] text-sm font-black uppercase tracking-wider shadow-[4px_4px_0px_#e63946]"
                  >
                    I AM JACK'S ERROR MESSAGE: {errorMsg}
                  </motion.div>
                )}
              </AnimatePresence>

              {form.fields.map((field: any, idx: number) => (
                <div 
                  key={idx} 
                  id={`field-${field.label.replace(/\s+/g, '-')}`}
                  className={`space-y-3 transition-all ${errorField === field.label ? 'ring-2 ring-[#e63946] bg-[#e63946]/10 p-4 -mx-4' : ''}`}
                >
                  <label className="block text-sm font-bold text-gray-300 uppercase tracking-widest">
                    {field.label} {field.required && <span className="text-[#e63946] font-black">*</span>}
                  </label>
                  {field.type === 'dropdown' ? (
                    <div className="relative">
                      <select
                        required={field.required}
                        value={responses[field.label] || ""}
                        onChange={(e) => setResponses({ ...responses, [field.label]: e.target.value })}
                        disabled={isSubmitting}
                        className="w-full bg-[#111] border-b-2 border-[#333] border-t-0 border-x-0 rounded-none px-4 py-3 text-white appearance-none focus:outline-none focus:border-[#e63946] focus:bg-[#1a1a1a] transition-all cursor-pointer disabled:opacity-50 text-base font-mono uppercase"
                      >
                        <option value="" disabled>-- MAKE A CHOICE --</option>
                        {field.options?.map((opt: string, i: number) => (
                          <option key={i} value={opt}>{opt}</option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-[#e63946] font-bold">
                        ▼
                      </div>
                    </div>
                  ) : field.type === 'radio' ? (
                    <div className="space-y-3 bg-[#111] p-4 border border-[#2b2b2b]">
                      {field.options?.map((opt: string, i: number) => (
                        <label key={i} className="flex items-center gap-4 cursor-pointer group">
                          <input
                            type="radio"
                            name={field.label}
                            value={opt}
                            required={field.required}
                            checked={responses[field.label] === opt}
                            onChange={(e) => setResponses({ ...responses, [field.label]: e.target.value })}
                            disabled={isSubmitting}
                            className="w-5 h-5 text-[#e63946] bg-black border-[#444] focus:ring-[#e63946] focus:ring-offset-black cursor-pointer disabled:opacity-50"
                          />
                          <span className="text-gray-400 group-hover:text-white font-bold uppercase text-sm tracking-widest transition-colors">{opt}</span>
                        </label>
                      ))}
                    </div>
                  ) : field.type === 'checkbox' ? (
                    <div className="space-y-3 bg-[#111] p-4 border border-[#2b2b2b]">
                      {field.options?.map((opt: string, i: number) => {
                        const currentVal = responses[field.label] || "";
                        const selectedArr = currentVal ? currentVal.split(", ") : [];
                        const isChecked = selectedArr.includes(opt);
                        return (
                          <label key={i} className="flex items-center gap-4 cursor-pointer group">
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
                              className="w-5 h-5 text-[#e63946] bg-black border-[#444] rounded-none focus:ring-[#e63946] focus:ring-offset-black cursor-pointer disabled:opacity-50"
                            />
                            <span className="text-gray-400 group-hover:text-white font-bold uppercase text-sm tracking-widest transition-colors">{opt}</span>
                          </label>
                        );
                      })}
                    </div>
                  ) : field.type === 'undertaking' ? (
                    <div className="bg-[#111] p-4 border border-[#2b2b2b] text-sm">
                      {responses[field.label] === "Accepted" ? (
                        <div className="flex items-center gap-3 text-[#e63946] font-black uppercase tracking-widest bg-[#e63946]/10 p-3">
                          <span className="text-xl">✓</span>
                          <span>THE FIRST RULE IS ACCEPTED</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentUndertakingField(field.label);
                            setShowUndertakingModal(true);
                          }}
                          disabled={isSubmitting}
                          className="text-white bg-black hover:bg-[#e63946] hover:text-black border-2 border-white hover:border-[#e63946] p-4 w-full font-black uppercase tracking-[0.2em] disabled:opacity-50 transition-all"
                        >
                          READ THE RULES
                        </button>
                      )}
                    </div>
                  ) : field.type === 'file' ? (
                    <div className="bg-[#111] p-4 border border-[#2b2b2b]">
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
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-6 file:border-0 file:text-sm file:font-black file:uppercase file:bg-white file:text-black hover:file:bg-[#e63946] hover:file:text-white transition-all cursor-pointer"
                      />
                      {responses[field.label] && responses[field.label].startsWith('data:image') && (
                        <div className="mt-4 border-2 border-[#e63946] w-32 h-32 relative opacity-80 grayscale contrast-125 hover:grayscale-0 hover:opacity-100 transition-all shadow-[4px_4px_0px_#e63946]">
                          <img src={responses[field.label]} alt="Preview" className="w-full h-full object-cover" />
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
                      className="w-full bg-[#111] border-b-2 border-[#333] border-t-0 border-x-0 rounded-none px-4 py-4 text-white focus:outline-none focus:border-[#e63946] focus:bg-[#1a1a1a] transition-all placeholder-gray-700 font-mono text-base uppercase font-bold"
                      placeholder={field.type === 'email' ? 'TYLER.DURDEN@PAPERSTREET.COM' : field.type === 'number' ? '0000' : 'INPUT RAW DATA...'}
                    />
                  )}
                </div>
              ))}

              {form.isPaymentEnabled && form.paymentAmount > 0 && (
                <div className="bg-[#111] p-6 border-2 border-[#e63946] space-y-4 mt-8 relative shadow-[4px_4px_0px_#e63946]">
                  <h3 className="text-xl font-black text-white uppercase tracking-widest">The Toll</h3>
                  <p className="text-gray-400 text-sm uppercase tracking-wide">The things you own end up owning you. Relinquish <span className="font-black text-[#e63946] text-base">₹{form.paymentAmount}</span> via the node below.</p>
                  
                  <div className="w-48 h-48 bg-white border-4 border-black p-2 mx-auto mix-blend-screen opacity-90 grayscale contrast-150">
                    <img src="/payment QR.jpeg" alt="Payment QR Code" className="w-full h-full object-cover" />
                  </div>
                  
                  <div className="pt-4 text-center">
                    <a 
                      href={`upi://pay?pa=musabansariofficial212005@oksbi&pn=Rtr.%20Musab%20Ansari&aid=uGICAgKDGwvbnHg&am=${form.paymentAmount}&cu=INR`}
                      className="inline-block bg-white text-black hover:bg-[#e63946] hover:text-white px-8 py-3 uppercase font-black text-sm tracking-widest transition-colors border-2 border-black"
                    >
                      INITIALIZE TRANSFER
                    </a>
                  </div>

                  <div className="pt-6 border-t border-[#333]">
                    <label className="flex items-center justify-center gap-4 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={paymentConfirmed} 
                        onChange={(e) => setPaymentConfirmed(e.target.checked)} 
                        className="w-6 h-6 bg-black border-gray-600 text-[#e63946] focus:ring-[#e63946] focus:ring-offset-black rounded-none cursor-pointer"
                      />
                      <span className="text-sm font-black text-gray-300 group-hover:text-white uppercase tracking-[0.1em]">I HAVE PAID THE TOLL [₹{form.paymentAmount}]</span>
                    </label>
                  </div>
                </div>
              )}

              <div className="pt-8 mt-12">
                <button
                  type="submit"
                  disabled={isSubmitting || (form.isPaymentEnabled && form.paymentAmount > 0 && !paymentConfirmed)}
                  className="w-full bg-black hover:bg-[#e63946] text-white hover:text-black font-black py-5 px-8 border-2 border-white hover:border-[#e63946] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg sm:text-xl uppercase tracking-[0.2em] shadow-[6px_6px_0px_#fff] hover:shadow-[0px_0px_0px_#000] hover:translate-x-[6px] hover:translate-y-[6px]"
                >
                  {isSubmitting ? "I AM JACK'S PROCESSING THREAD..." : form.isPaymentEnabled && form.paymentAmount > 0 ? "PAY & HIT ME" : "I WANT YOU TO HIT ME AS HARD AS YOU CAN"}
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0f0e0e] border-4 border-[#e63946] p-6 sm:p-8 max-w-lg w-full shadow-[10px_10px_0px_#e63946] relative"
            >
              <h3 className="text-3xl font-black text-white mb-6 uppercase tracking-tighter" style={{ fontFamily: 'Impact, sans-serif' }}>THE RULES OF FIGHT CLUB</h3>
              <div className="bg-black border border-[#333] p-6 mb-8 h-[350px] overflow-y-auto text-sm text-gray-400 space-y-5 font-mono scrollbar-thin scrollbar-thumb-[#e63946] scrollbar-track-black">
                <p className="text-[#e63946] font-bold uppercase tracking-widest border-b border-[#e63946] pb-2 inline-block">
                  First rule: You accept these conditions.
                </p>
                <ol className="list-decimal pl-5 space-y-5 marker:text-[#e63946] marker:font-bold">
                  <li><strong className="text-white">Accuracy of Information:</strong> I am not my lies. I declare all information is true to the best of my knowledge.</li>
                  <li><strong className="text-white">Data Privacy:</strong> I relinquish my data to Project Mayhem for evaluation. It does not belong to me anymore.</li>
                  <li><strong className="text-white">Compliance:</strong> I agree to abide by all the rules. If I am told to jump, I ask how high.</li>
                  <li><strong className="text-white">Liability Waiver:</strong> This is my life, and it's ending one minute at a time. I release the organizers from any claims or damages.</li>
                </ol>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-end">
                <button
                  type="button"
                  onClick={() => setShowUndertakingModal(false)}
                  className="py-4 px-8 text-white font-black uppercase tracking-[0.2em] transition-colors border-2 border-white hover:bg-white hover:text-black"
                >
                  WALK AWAY
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (currentUndertakingField) {
                      setResponses({ ...responses, [currentUndertakingField]: "Accepted" });
                    }
                    setShowUndertakingModal(false);
                  }}
                  className="py-4 px-8 bg-[#e63946] text-black font-black uppercase tracking-[0.2em] transition-colors border-2 border-[#e63946] hover:bg-black hover:text-[#e63946]"
                >
                  I ACCEPT
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
