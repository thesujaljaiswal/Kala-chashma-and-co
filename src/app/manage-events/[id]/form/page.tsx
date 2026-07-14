"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import AdminSidebar from "@/components/AdminSidebar";
import { getEventById, updateEventFields } from "@/app/actions";
import Link from "next/link";

export default function FormBuilderPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;

  const [event, setEvent] = useState<any>(null);
  const [customFields, setCustomFields] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [draggedFieldIdx, setDraggedFieldIdx] = useState<number | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    const fetchEvent = async () => {
      if (status !== "authenticated" || !eventId) return;
      setIsLoading(true);
      const data = await getEventById(eventId);
      if (data) {
        setEvent(data);
        setCustomFields(data.customFields || []);
      }
      setIsLoading(false);
    };
    fetchEvent();
  }, [status, eventId]);

  if (status === "loading" || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-[calc(100vh-64px)] bg-black/20 gap-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '-0.3s' }}></div>
          <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '-0.15s' }}></div>
          <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce"></div>
        </div>
        <div className="text-gray-400 font-medium text-sm animate-pulse mt-2">Loading...</div>
      </div>
    );
  }

  if (!session?.user || !event) return null;

  const addCustomField = (type: string) => {
    setCustomFields([...customFields, { label: "", type, options: type === "dropdown" ? [""] : [], required: false }]);
  };

  const updateCustomField = (index: number, key: string, value: any) => {
    const updated = [...customFields];
    updated[index][key] = value;
    setCustomFields(updated);
  };

  const removeCustomField = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
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

  const handleSave = async () => {
    const validCustomFields = customFields.filter(f => f.label.trim() !== "");
    setIsSaving(true);
    const result = await updateEventFields(eventId, validCustomFields);
    setIsSaving(false);
    
    if (result.success) {
      router.push('/manage-events');
    } else {
      alert("Failed to save form fields.");
    }
  };

  return (
    <div className="flex w-full min-h-[calc(100vh-64px)] relative overflow-hidden bg-black/20">
      <AdminSidebar activeTab="manage" title="Form Builder" />

      <div className="flex-1 flex flex-col w-full h-[calc(100vh-64px)] overflow-y-auto">
        <div className="p-3 sm:p-4 md:p-8 w-full max-w-4xl mx-auto pb-24 pt-20 md:pt-8">
          
          <div className="mb-6 flex items-center justify-between">
            <div>
              <Link href="/manage-events" className="text-gray-400 hover:text-white flex items-center gap-2 mb-2 transition-colors text-sm font-semibold">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                Back to Events
              </Link>
              <h1 className="text-3xl font-black text-white">Form Builder</h1>
              <p className="text-gray-400 mt-1">Configure custom questions for <span className="text-orange-400 font-bold">{event.name}</span></p>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-emerald-500"></div>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Custom Questions</h2>
                <p className="text-sm text-gray-400">These will appear on the public registration page after Name, Phone, and Station.</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => addCustomField('text')}
                  className="bg-blue-500/20 text-blue-300 hover:bg-blue-500/40 hover:text-white px-4 py-2 rounded-xl transition-all flex items-center gap-2 font-semibold text-sm border border-blue-500/30"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                  Text Answer
                </button>
                <button
                  type="button"
                  onClick={() => addCustomField('dropdown')}
                  className="bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/40 hover:text-white px-4 py-2 rounded-xl transition-all flex items-center gap-2 font-semibold text-sm border border-emerald-500/30"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                  Dropdown
                </button>
              </div>
            </div>

            <div className="space-y-4 min-h-[300px]">
              {customFields.length === 0 && (
                <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-white/10 rounded-2xl">
                  <p className="text-gray-500 font-medium">No custom questions added yet.</p>
                  <p className="text-sm text-gray-600 mt-1">Click the buttons above to add fields.</p>
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
                  <div className="flex gap-4 items-start">
                    <div className="text-gray-600 pt-3 shrink-0 hidden sm:block cursor-move">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8h16M4 16h16"></path></svg>
                    </div>
                    
                    <div className="flex-1 space-y-4">
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1">
                          <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Question Label</label>
                          <input
                            type="text"
                            required
                            value={field.label}
                            onChange={(e) => updateCustomField(index, "label", e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm placeholder-gray-600 font-medium transition-all"
                            placeholder="e.g. T-Shirt Size or Emergency Contact Name"
                          />
                        </div>
                        
                        <div className="flex items-end gap-3">
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
                        </div>
                      </div>
                      
                      {field.type === 'dropdown' && (
                        <div className="bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/20 sm:ml-10">
                          <label className="block text-xs font-bold text-emerald-400 mb-2 uppercase tracking-wider">
                            Dropdown Options (Comma-separated)
                          </label>
                          <input
                            type="text"
                            required
                            value={(field.options || []).join(", ")}
                            onChange={(e) => {
                              const opts = e.target.value.split(",").map(s => s.trim()).filter(s => s);
                              updateCustomField(index, "options", opts);
                            }}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                            placeholder="e.g. Small, Medium, Large, X-Large"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 flex justify-end gap-4">
              <button
                onClick={() => router.push('/manage-events')}
                className="px-6 py-3 rounded-xl font-bold text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-all transform active:scale-[0.98] disabled:opacity-70 flex items-center gap-2"
              >
                {isSaving ? "Saving..." : "Save Form Fields"}
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
