"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/AdminSidebar";
import { getForms, createForm, updateForm, deleteForm, getFormResponses, getEvents, verifyFormPayment } from "@/app/actions";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function ManageFormsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [forms, setForms] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingForm, setEditingForm] = useState<any>(null);
  
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [customFields, setCustomFields] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [draggedFieldIdx, setDraggedFieldIdx] = useState<number | null>(null);

  const [isRegistrationForm, setIsRegistrationForm] = useState(false);
  const [registrationEventId, setRegistrationEventId] = useState("");
  const [isPaymentEnabled, setIsPaymentEnabled] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number | "">("");
  const [isEmailTicketEnabled, setIsEmailTicketEnabled] = useState(false);

  const [viewResponsesFor, setViewResponsesFor] = useState<any>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [isLoadingResponses, setIsLoadingResponses] = useState(false);
  const [selectedPaymentDetails, setSelectedPaymentDetails] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const fetchFormsAndEvents = async () => {
    setIsLoading(true);
    const [formsData, eventsData] = await Promise.all([getForms(), getEvents()]);
    
    // Filter out past events for the dropdown
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const activeEvents = eventsData.filter((e: any) => {
      if (!e.date) return false;
      const parts = e.date.split("-");
      if (parts.length !== 3) return false;
      const eventDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      return eventDate >= today;
    });

    setForms(formsData);
    setEvents(activeEvents);
    setIsLoading(false);
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchFormsAndEvents();
    }
  }, [status]);

  if (status === "loading" || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-[calc(100vh-64px)] bg-black/20 gap-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '-0.3s' }}></div>
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '-0.15s' }}></div>
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
        </div>
        <div className="text-gray-400 font-medium text-sm animate-pulse mt-2">Loading Forms...</div>
      </div>
    );
  }

  if (!session?.user) return null;

  const handleOpenBuilder = (form: any = null) => {
    if (form) {
      setEditingForm(form);
      setFormName(form.name);
      setFormDescription(form.description || "");
      setCustomFields(form.fields || []);
      setIsRegistrationForm(form.isRegistrationForm || false);
      setRegistrationEventId(form.registrationEventId || "");
      setIsPaymentEnabled(form.isPaymentEnabled || false);
      setPaymentAmount(form.paymentAmount || "");
      setIsEmailTicketEnabled(form.isEmailTicketEnabled || false);
    } else {
      setEditingForm(null);
      setFormName("");
      setFormDescription("");
      setCustomFields([]);
      setIsRegistrationForm(false);
      setRegistrationEventId("");
      setIsPaymentEnabled(false);
      setPaymentAmount("");
      setIsEmailTicketEnabled(false);
    }
    setIsBuilderOpen(true);
  };

  const addCustomField = () => {
    setCustomFields([...customFields, { label: "", type: "text", options: [], required: false }]);
  };

  const handleTypeChange = (index: number, newType: string) => {
    const updated = [...customFields];
    updated[index].type = newType;
    if ((newType === "dropdown" || newType === "radio" || newType === "checkbox") && (!updated[index].options || updated[index].options.length === 0)) {
      updated[index].options = [""];
    }
    if (newType === "undertaking" && !updated[index].label) {
      updated[index].label = "Undertaking Form";
    }
    setCustomFields(updated);
  };

  const updateCustomField = (index: number, key: string, value: any) => {
    const updated = [...customFields];
    updated[index][key] = value;
    setCustomFields(updated);
  };

  const removeCustomField = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  const moveCustomField = (index: number, direction: number) => {
    if (index + direction < 0 || index + direction >= customFields.length) return;
    const updated = [...customFields];
    const temp = updated[index];
    updated[index] = updated[index + direction];
    updated[index + direction] = temp;
    setCustomFields(updated);
  };

  const handleFieldDragStart = (e: React.DragEvent, index: number) => {
    setDraggedFieldIdx(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleFieldDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedFieldIdx === null || draggedFieldIdx === index) return;
    const updated = [...customFields];
    const temp = updated[draggedFieldIdx];
    updated[draggedFieldIdx] = updated[index];
    updated[index] = temp;
    setCustomFields(updated);
    setDraggedFieldIdx(index);
  };

  const handleFieldDragEnd = () => {
    setDraggedFieldIdx(null);
  };

  const handleSaveForm = async () => {
    if (!formName.trim()) return alert("Form name is required");
    const validFields = customFields.filter(f => f.label.trim() !== "");
    
    setIsSaving(true);
    let success = false;
    const amount = Number(paymentAmount) || 0;
    if (editingForm) {
      const res = await updateForm(editingForm._id, formName, formDescription, validFields, isRegistrationForm, registrationEventId, isPaymentEnabled, amount, isEmailTicketEnabled);
      success = res.success;
    } else {
      const res = await createForm(formName, formDescription, validFields, isRegistrationForm, registrationEventId, isPaymentEnabled, amount, isEmailTicketEnabled);
      success = res.success;
    }
    
    setIsSaving(false);
    if (success) {
      setIsBuilderOpen(false);
      fetchFormsAndEvents();
    } else {
      alert("Failed to save form.");
    }
  };

  const handleDeleteForm = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete the form "${name}"? This will also delete all responses.`)) {
      const res = await deleteForm(id);
      if (res.success) {
        fetchFormsAndEvents();
      }
    }
  };

  const handleViewResponses = async (form: any) => {
    setViewResponsesFor(form);
    setIsLoadingResponses(true);
    const res = await getFormResponses(form._id);
    setResponses(res);
    setIsLoadingResponses(false);
  };

  const handleVerifyPayment = async (responseId: string) => {
    setIsVerifying(true);
    const res = await verifyFormPayment(responseId);
    if (res.success) {
      setSelectedPaymentDetails({ ...selectedPaymentDetails, paymentStatus: 'success' });
      const updated = await getFormResponses(viewResponsesFor._id);
      setResponses(updated);
      alert("Payment verified and ticket sent successfully!");
    } else {
      alert(res.error ? `Failed: ${res.error}` : "Failed to verify payment");
    }
    setIsVerifying(false);
  };

  const copyToClipboard = (shareId: string) => {
    const url = `${window.location.origin}/f/${shareId}`;
    navigator.clipboard.writeText(url);
    alert("Share link copied to clipboard!");
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <div className="flex w-full min-h-[calc(100vh-64px)] relative overflow-hidden bg-black/20">
      <AdminSidebar activeTab="forms" title="Manage Forms" />

      <div className="flex-1 flex flex-col w-full h-[calc(100vh-64px)] overflow-y-auto">
        <div className="p-3 sm:p-4 md:p-8 w-full max-w-6xl mx-auto pb-24 pt-20 md:pt-8">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-black text-white">Standalone Forms</h1>
              <p className="text-gray-400 text-sm mt-1">Create separate questionnaires or feedback forms to share with people.</p>
            </div>
            
            {!isBuilderOpen && !viewResponsesFor && (
              <button
                onClick={() => handleOpenBuilder()}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-2xl shadow-lg transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                Create Form
              </button>
            )}
          </div>

          {!isBuilderOpen && !viewResponsesFor && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {forms.length === 0 ? (
                <div className="col-span-full bg-white/5 border border-white/10 rounded-3xl p-12 text-center">
                  <p className="text-gray-400 font-medium">No forms created yet. Click "Create Form" to start.</p>
                </div>
              ) : (
                forms.map(form => (
                  <div key={form._id} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 hover:bg-white/10 transition-colors group relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                    
                    <h3 className="text-xl font-bold text-white mb-2">{form.name}</h3>
                    <p className="text-sm text-gray-400 mb-6">{form.fields?.length || 0} Questions • Created {formatDate(form.createdAt)}</p>
                    
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => copyToClipboard(form.shareId)}
                        className="flex-1 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold py-2 px-3 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                        Copy Link
                      </button>
                      <button
                        onClick={() => handleViewResponses(form)}
                        className="flex-1 bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 border border-indigo-500/30 text-sm font-semibold py-2 px-3 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                        Responses
                      </button>
                    </div>
                    
                    <div className="flex gap-2 mt-2 pt-2 border-t border-white/5">
                      <button
                        onClick={() => handleOpenBuilder(form)}
                        className="flex-1 text-gray-400 hover:text-yellow-400 text-xs font-semibold py-1.5 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteForm(form._id, form.name)}
                        className="flex-1 text-gray-400 hover:text-red-400 text-xs font-semibold py-1.5 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {viewResponsesFor && (
            <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500"></div>
              
              <div className="flex justify-between items-center mb-6">
                <div>
                  <button onClick={() => setViewResponsesFor(null)} className="text-gray-400 hover:text-white flex items-center gap-1 mb-2 text-sm font-semibold">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                    Back to Forms
                  </button>
                  <h2 className="text-2xl font-bold text-white">Responses for {viewResponsesFor.name}</h2>
                </div>
                <div className="text-indigo-400 font-bold bg-indigo-500/10 px-4 py-2 rounded-xl">
                  {responses.length} Submissions
                </div>
              </div>

              {isLoadingResponses ? (
                <div className="text-gray-400 py-10 text-center">Loading responses...</div>
              ) : responses.length === 0 ? (
                <div className="text-gray-400 py-10 text-center bg-black/20 rounded-2xl border border-white/5">No responses yet.</div>
              ) : (
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left text-sm text-gray-300">
                    <thead className="bg-black/40 text-gray-400 uppercase font-semibold text-xs rounded-xl">
                      <tr>
                        <th className="px-4 py-3 rounded-l-xl">Submitted</th>
                        {viewResponsesFor.fields.map((f: any, i: number) => (
                          <th key={i} className={`px-4 py-3 ${(!viewResponsesFor.isPaymentEnabled && i === viewResponsesFor.fields.length - 1) ? 'rounded-r-xl' : ''}`}>{f.label}</th>
                        ))}
                        {viewResponsesFor.isPaymentEnabled && (
                          <th className="px-4 py-3 rounded-r-xl">Payment Details</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {responses.map((res: any, idx: number) => (
                        <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="px-4 py-4 whitespace-nowrap text-gray-500">{formatDate(res.createdAt)}</td>
                          {viewResponsesFor.fields.map((f: any, i: number) => {
                            const answer = res.responses.find((r: any) => r.label === f.label)?.value || "-";
                            return (
                              <td key={i} className="px-4 py-4 text-white font-medium">{answer}</td>
                            );
                          })}
                          {viewResponsesFor.isPaymentEnabled && (
                            <td className="px-4 py-4">
                              <button
                                onClick={() => setSelectedPaymentDetails(res)}
                                className="bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 border border-indigo-500/30 text-xs font-semibold py-1.5 px-3 rounded-xl transition-colors whitespace-nowrap"
                              >
                                View Details
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {isBuilderOpen && (
            <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
              
              <div className="mb-6 border-b border-white/10 pb-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">Form Name (Unique Name)</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-bold placeholder-gray-600 transition-all"
                    placeholder="e.g. Feedback Form - Aug 2026"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">Form Description (Optional)</label>
                  <textarea
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm placeholder-gray-600 transition-all min-h-[100px] resize-y"
                    placeholder="Add some instructions or a welcome message for your users..."
                  />
                </div>
                
                <div className="flex items-center gap-3 py-2">
                  <input
                    type="checkbox"
                    id="isRegistrationForm"
                    checked={isRegistrationForm}
                    onChange={(e) => setIsRegistrationForm(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-600 bg-black/40 text-blue-500 focus:ring-blue-500"
                  />
                  <label htmlFor="isRegistrationForm" className="text-white font-bold cursor-pointer">
                    This is an event registration form
                  </label>
                </div>

                {isRegistrationForm && (
                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">Select Event</label>
                    <select
                      value={registrationEventId}
                      onChange={(e) => setRegistrationEventId(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm appearance-none"
                    >
                      <option value="" className="bg-gray-800">Select an event...</option>
                      {events.map((evt) => (
                        <option key={evt._id} value={evt._id} className="bg-gray-800">{evt.name} - {formatDate(evt.date)}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">Form Questions</h2>
                  <p className="text-sm text-gray-400">Add fields that the user needs to fill out.</p>
                </div>
              </div>

              <div className="space-y-4 min-h-[300px]">
                {customFields.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-white/10 rounded-2xl">
                    <p className="text-gray-500 font-medium">No questions added yet.</p>
                    <p className="text-sm text-gray-600 mt-1">Click the buttons above to add fields.</p>
                    <p className="text-xs text-orange-400 mt-4 px-4 text-center">Note: Don't forget to add a "Name" or "Phone Number" field if you need to know who is submitting this form!</p>
                  </div>
                )}
                {customFields.map((field, index) => (
                  <div 
                    key={index}
                    draggable
                    onDragStart={(e) => handleFieldDragStart(e, index)}
                    onDragOver={(e) => handleFieldDragOver(e, index)}
                    onDragEnd={handleFieldDragEnd}
                    className={`bg-black/30 p-4 sm:p-5 rounded-2xl border border-white/10 space-y-4 cursor-grab active:cursor-grabbing transition-transform ${draggedFieldIdx === index ? 'opacity-40 scale-[0.98]' : ''} hover:border-white/20`}
                  >
                    <div className="flex gap-4 items-start w-full">
                      <div className="text-gray-600 pt-3 shrink-0 hidden sm:block cursor-move">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8h16M4 16h16"></path></svg>
                      </div>
                      
                      <div className="flex-1 min-w-0 space-y-4">
                        <div className="flex flex-col sm:flex-row gap-3">
                          <div className="flex-1 min-w-0">
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Question Label</label>
                            <input
                              type="text"
                              required
                              value={field.label}
                              onChange={(e) => updateCustomField(index, "label", e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm placeholder-gray-600 font-medium transition-all"
                              placeholder="e.g. Your Name, Phone Number, etc."
                            />
                          </div>
                          
                          <div className="w-full sm:w-48 shrink-0">
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Field Type</label>
                            <select
                              value={field.type}
                              onChange={(e) => handleTypeChange(index, e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 h-[42px] text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium transition-all appearance-none cursor-pointer"
                            >
                              <option value="text" className="bg-gray-800">Text Input</option>
                              <option value="number" className="bg-gray-800">Number</option>
                              <option value="email" className="bg-gray-800">Email Address</option>
                              <option value="dropdown" className="bg-gray-800">Dropdown</option>
                              <option value="radio" className="bg-gray-800">Radio Buttons</option>
                              <option value="checkbox" className="bg-gray-800">Checkboxes</option>
                              <option value="undertaking" className="bg-gray-800">Undertaking Form</option>
                            </select>
                          </div>
                          
                          <div className="flex flex-wrap items-end gap-3 mt-2 sm:mt-0 w-full sm:w-auto">
                            <div className="flex items-center h-[42px] px-4 bg-white/5 rounded-xl border border-white/10 shrink-0">
                              <label className="text-sm text-gray-300 font-semibold cursor-pointer flex items-center gap-2">
                                <input 
                                  type="checkbox" 
                                  checked={field.required}
                                  onChange={(e) => updateCustomField(index, "required", e.target.checked)}
                                  className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500 transition-colors"
                                />
                                Required
                              </label>
                            </div>
                            
                            <button
                              type="button"
                              onClick={() => removeCustomField(index)}
                              className="h-[42px] px-4 text-gray-400 hover:text-red-400 transition-colors bg-white/5 hover:bg-red-500/10 rounded-xl border border-white/10 shrink-0 flex items-center justify-center"
                              title="Delete Field"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>

                            <div className="flex items-center gap-2 sm:hidden shrink-0 ml-auto">
                              <button
                                type="button"
                                onClick={() => moveCustomField(index, -1)}
                                disabled={index === 0}
                                className="h-[42px] px-3 text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 flex items-center justify-center disabled:opacity-30"
                                title="Move Up"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path></svg>
                              </button>
                              <button
                                type="button"
                                onClick={() => moveCustomField(index, 1)}
                                disabled={index === customFields.length - 1}
                                className="h-[42px] px-3 text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 flex items-center justify-center disabled:opacity-30"
                                title="Move Down"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        {(field.type === 'dropdown' || field.type === 'radio' || field.type === 'checkbox') && (
                          <div className={`${field.type === 'radio' ? 'bg-purple-500/5 border-purple-500/20' : field.type === 'checkbox' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-indigo-500/5 border-indigo-500/20'} p-4 rounded-xl border sm:ml-10`}>
                            <label className={`block text-xs font-bold ${field.type === 'radio' ? 'text-purple-400' : field.type === 'checkbox' ? 'text-emerald-400' : 'text-indigo-400'} mb-4 uppercase tracking-wider`}>
                              {field.type === 'dropdown' ? 'Dropdown Options' : field.type === 'radio' ? 'Radio Options' : 'Checkbox Options'}
                            </label>
                            <div className="space-y-3">
                              {(field.options || []).map((opt: string, optIdx: number) => (
                                <div key={optIdx} className="flex items-center gap-2">
                                  <div className={`w-3 h-3 ${field.type === 'radio' ? 'rounded-full bg-purple-500/50' : field.type === 'checkbox' ? 'rounded bg-emerald-500/50' : 'rounded-full bg-indigo-500/50'}`}></div>
                                  <input
                                    type="text"
                                    required
                                    value={opt}
                                    onChange={(e) => {
                                      const newOptions = [...(field.options || [])];
                                      newOptions[optIdx] = e.target.value;
                                      updateCustomField(index, "options", newOptions);
                                    }}
                                    className="flex-1 min-w-0 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                    placeholder={`Option ${optIdx + 1}`}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newOptions = [...(field.options || [])];
                                      newOptions.splice(optIdx, 1);
                                      updateCustomField(index, "options", newOptions);
                                    }}
                                    className="text-gray-500 hover:text-red-400 p-1"
                                    title="Remove Option"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                  </button>
                                </div>
                              ))}
                              <button
                                type="button"
                                onClick={() => {
                                  const newOptions = [...(field.options || []), ""];
                                  updateCustomField(index, "options", newOptions);
                                }}
                                className={`flex items-center gap-2 ${field.type === 'radio' ? 'text-purple-400 hover:text-purple-300' : field.type === 'checkbox' ? 'text-emerald-400 hover:text-emerald-300' : 'text-indigo-400 hover:text-indigo-300'} text-sm font-semibold transition-colors mt-2`}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                                Add Option
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => addCustomField()}
                    className="w-full py-4 border-2 border-dashed border-white/10 rounded-2xl text-gray-400 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all flex items-center justify-center gap-2 font-bold"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                    Add Field
                  </button>
                </div>

                <div className="mt-8 pt-6 border-t border-white/10">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div>
                      <h2 className="text-xl font-bold text-white mb-1">Payment Integration</h2>
                      <p className="text-sm text-gray-400">Enable PhonePe payment gateway for this form.</p>
                    </div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="isPaymentEnabled"
                        checked={isPaymentEnabled}
                        onChange={(e) => setIsPaymentEnabled(e.target.checked)}
                        className="w-5 h-5 rounded border-gray-600 bg-black/40 text-blue-500 focus:ring-blue-500 cursor-pointer"
                      />
                      <label htmlFor="isPaymentEnabled" className="text-white font-bold cursor-pointer">
                        Enable Payment for this form
                      </label>
                    </div>
                    {isPaymentEnabled && (
                      <div className="pt-2 pl-8">
                        <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">Amount to collect (₹)</label>
                        <input
                          type="number"
                          required={isPaymentEnabled}
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(Number(e.target.value))}
                          className="w-full sm:w-64 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-bold placeholder-gray-600 transition-all"
                          placeholder="e.g. 450"
                          min="1"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="isEmailTicketEnabled"
                        checked={isEmailTicketEnabled && customFields.some(f => f.type === 'email')}
                        onChange={(e) => setIsEmailTicketEnabled(e.target.checked)}
                        disabled={!customFields.some(f => f.type === 'email')}
                        className="w-5 h-5 rounded border-gray-600 bg-black/40 text-blue-500 focus:ring-blue-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <label htmlFor="isEmailTicketEnabled" className="text-white font-bold cursor-pointer">
                        Send Email Ticket
                      </label>
                    </div>
                    <p className="text-sm text-gray-400 pl-8">
                      {!customFields.some(f => f.type === 'email') 
                        ? "You must add an 'Email' field to your form to enable this feature."
                        : "Send a ticket with a QR code to the user's email upon submission."}
                    </p>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/10 flex justify-end gap-4">
                  <button
                    onClick={() => setIsBuilderOpen(false)}
                    className="px-6 py-3 rounded-xl font-bold text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveForm}
                    disabled={isSaving}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-all transform active:scale-[0.98] disabled:opacity-70 flex items-center gap-2"
                  >
                    {isSaving ? "Saving..." : "Save Form"}
                  </button>
                </div>
              </div>
          )}

        </div>
      </div>

      <AnimatePresence>
        {selectedPaymentDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-[#1A1A1A] border border-white/10 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
              
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-white">Payment Details</h3>
                <button
                  onClick={() => setSelectedPaymentDetails(null)}
                  className="text-gray-400 hover:text-white transition-colors p-1"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex justify-between items-center">
                  <span className="text-gray-400 font-medium text-sm">Status</span>
                  <span className={`font-bold px-3 py-1 rounded-xl text-sm ${
                    selectedPaymentDetails.paymentStatus === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                    selectedPaymentDetails.paymentStatus === 'failed' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                    'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                  }`}>
                    {(selectedPaymentDetails.paymentStatus || 'pending').toUpperCase()}
                  </span>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex justify-between items-center">
                  <span className="text-gray-400 font-medium text-sm">Amount</span>
                  <span className="text-white font-bold">₹{viewResponsesFor?.paymentAmount || 0}</span>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <span className="text-gray-400 font-medium text-sm block mb-1">Transaction ID</span>
                  <span className="text-white font-mono text-sm break-all">
                    {selectedPaymentDetails.transactionId || 'N/A'}
                  </span>
                </div>
                
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <span className="text-gray-400 font-medium text-sm block mb-1">Response Submitted On</span>
                  <span className="text-white text-sm">
                    {new Date(selectedPaymentDetails.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="mt-8 space-y-3">
                {selectedPaymentDetails.paymentStatus === 'pending' && (
                  <button
                    onClick={() => handleVerifyPayment(selectedPaymentDetails._id)}
                    disabled={isVerifying}
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isVerifying ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    )}
                    {isVerifying ? "Verifying & Sending Ticket..." : "Verify Payment & Send Ticket"}
                  </button>
                )}
                <button
                  onClick={() => setSelectedPaymentDetails(null)}
                  className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
