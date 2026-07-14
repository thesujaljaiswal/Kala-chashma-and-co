"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/AdminSidebar";
import { getForms, getFormResponses } from "@/app/actions";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const COLORS = ['#3b82f6', '#f97316', '#10b981', '#8b5cf6', '#ec4899', '#facc15', '#06b6d4', '#64748b'];

export default function FormAnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [forms, setForms] = useState<any[]>([]);
  const [selectedFormId, setSelectedFormId] = useState<string>("");
  const [responses, setResponses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingResponses, setIsLoadingResponses] = useState(false);
  
  const [selectedField, setSelectedField] = useState<string>("");
  const [chartType, setChartType] = useState<"bar" | "pie" | "list">("pie");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchForms();
    }
  }, [status]);

  const fetchForms = async () => {
    setIsLoading(true);
    const data = await getForms();
    setForms(data);
    if (data && data.length > 0) {
      setSelectedFormId(data[0]._id);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (selectedFormId) {
      fetchResponses(selectedFormId);
    } else {
      setResponses([]);
      setSelectedField("");
    }
  }, [selectedFormId]);

  const fetchResponses = async (formId: string) => {
    setIsLoadingResponses(true);
    const data = await getFormResponses(formId);
    setResponses(data);
    setIsLoadingResponses(false);
    
    // Auto-select first suitable field if available
    const form = forms.find(f => f._id === formId);
    if (form && form.fields && form.fields.length > 0) {
      setSelectedField(form.fields[0].label);
    }
  };

  const selectedForm = forms.find(f => f._id === selectedFormId);
  const selectedFieldConfig = selectedForm?.fields?.find((f: any) => f.label === selectedField);

  // Auto-switch to list for text-like fields if a chart was selected
  useEffect(() => {
    if (selectedFieldConfig) {
      const isChoiceField = ['dropdown', 'radio', 'checkbox'].includes(selectedFieldConfig.type);
      if (!isChoiceField && chartType !== 'list') {
        setChartType('list');
      } else if (isChoiceField && chartType === 'list') {
        setChartType('pie');
      }
    }
  }, [selectedFieldConfig, chartType]);

  // Aggregate Data
  const chartData = useMemo(() => {
    if (!selectedField || !responses.length) return [];
    
    const isChoiceField = ['dropdown', 'radio', 'checkbox'].includes(selectedFieldConfig?.type || '');
    
    if (isChoiceField) {
      const counts: Record<string, number> = {};
      
      responses.forEach(res => {
        const answerObj = res.responses.find((r: any) => r.label === selectedField);
        const answer = answerObj?.value;
        if (!answer) return;
        
        if (selectedFieldConfig?.type === 'checkbox') {
          // Checkbox might be comma separated string if multiple were selected
          const arr = answer.split(', ').filter(Boolean);
          arr.forEach((val: string) => {
            counts[val] = (counts[val] || 0) + 1;
          });
        } else {
          counts[answer] = (counts[answer] || 0) + 1;
        }
      });
      
      return Object.entries(counts).map(([name, count]) => ({
        name: name.length > 25 ? name.substring(0, 25) + '...' : name,
        fullText: name,
        value: count
      })).sort((a, b) => b.value - a.value);
    }
    
    return [];
  }, [selectedField, responses, selectedFieldConfig]);

  // Text list data
  const listData = useMemo(() => {
    if (!selectedField || !responses.length) return [];
    const isChoiceField = ['dropdown', 'radio', 'checkbox'].includes(selectedFieldConfig?.type || '');
    if (isChoiceField) return [];
    
    return responses
      .map(res => ({
        value: res.responses.find((r: any) => r.label === selectedField)?.value,
        date: res.createdAt
      }))
      .filter(item => item.value);
  }, [selectedField, responses, selectedFieldConfig]);


  if (status === "loading" || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-[calc(100vh-64px)] bg-black/20 gap-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '-0.3s' }}></div>
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '-0.15s' }}></div>
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
        </div>
      </div>
    );
  }

  if (!session?.user) return null;

  return (
    <div className="flex min-h-screen bg-black overflow-hidden relative selection:bg-purple-500/30">
      <AdminSidebar activeTab="analytics" title="Form Analytics" />

      <main className="flex-1 overflow-y-auto relative custom-scrollbar h-screen">
        <div className="p-4 sm:p-8 max-w-7xl mx-auto min-h-full">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-black text-white">Form Analytics</h1>
              <p className="text-gray-400 mt-2 font-medium">Visualize and analyze your form responses in real-time.</p>
            </div>
            
            {/* Form Selector */}
            <div className="w-full md:w-72">
              <select
                value={selectedFormId}
                onChange={(e) => setSelectedFormId(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-medium transition-all appearance-none cursor-pointer"
              >
                <option value="" disabled className="bg-gray-900 text-gray-500">Select a Form...</option>
                {forms.map(form => (
                  <option key={form._id} value={form._id} className="bg-gray-900 text-white">
                    {form.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {!selectedFormId ? (
            <div className="bg-white/5 border border-white/10 rounded-3xl p-16 text-center shadow-2xl flex flex-col items-center justify-center">
              <div className="w-20 h-20 bg-purple-500/10 rounded-full flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">No Form Selected</h2>
              <p className="text-gray-400 max-w-md">Select a form from the dropdown above to start analyzing its responses.</p>
            </div>
          ) : isLoadingResponses ? (
             <div className="text-gray-400 py-10 text-center animate-pulse">Loading responses...</div>
          ) : responses.length === 0 ? (
             <div className="bg-white/5 border border-white/10 rounded-3xl p-16 text-center">
               <h2 className="text-xl font-bold text-white mb-2">No Responses Yet</h2>
               <p className="text-gray-400">Share your form to start collecting data.</p>
             </div>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl">
              
              {/* Controls */}
              <div className="flex flex-col sm:flex-row gap-4 mb-8 bg-black/40 p-4 rounded-2xl border border-white/5">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Select Field</label>
                  <select
                    value={selectedField}
                    onChange={(e) => setSelectedField(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-medium transition-all appearance-none cursor-pointer"
                  >
                    {selectedForm?.fields?.map((f: any, i: number) => (
                      <option key={i} value={f.label} className="bg-gray-900 text-white">
                        {f.label} ({f.type})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="w-full sm:w-48">
                  <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Chart Type</label>
                  <div className="flex gap-2">
                    {['dropdown', 'radio', 'checkbox'].includes(selectedFieldConfig?.type || '') ? (
                      <>
                        <button
                          onClick={() => setChartType('pie')}
                          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${chartType === 'pie' ? 'bg-purple-500 text-white shadow-lg' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/10'}`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"></path></svg>
                          Pie
                        </button>
                        <button
                          onClick={() => setChartType('bar')}
                          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${chartType === 'bar' ? 'bg-purple-500 text-white shadow-lg' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/10'}`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                          Bar
                        </button>
                      </>
                    ) : (
                      <button
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all bg-white/5 text-gray-400 border border-white/10 cursor-not-allowed opacity-70"
                        title="Charts are only available for multiple choice fields"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg>
                        List Only
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Data Visualization */}
              <div className="bg-black/20 rounded-2xl border border-white/5 p-6 h-[400px]">
                {chartType === 'list' || !['dropdown', 'radio', 'checkbox'].includes(selectedFieldConfig?.type || '') ? (
                  <div className="h-full overflow-y-auto custom-scrollbar pr-4 space-y-3">
                    {listData.length > 0 ? (
                      listData.map((item, idx) => (
                        <div key={idx} className="bg-white/5 border border-white/5 rounded-xl p-4">
                          <p className="text-white font-medium">{item.value}</p>
                          <p className="text-xs text-gray-500 mt-1">{new Date(item.date).toLocaleString()}</p>
                        </div>
                      ))
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-400">No data available for this field.</div>
                    )}
                  </div>
                ) : chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    {chartType === 'bar' ? (
                      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                        <XAxis dataKey="name" stroke="#9ca3af" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                        <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af', fontSize: 12 }} allowDecimals={false} />
                        <Tooltip 
                          cursor={{ fill: '#ffffff0a' }}
                          contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '12px', color: '#fff' }}
                        />
                        <Bar dataKey="value" name="Responses" radius={[4, 4, 0, 0]}>
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    ) : (
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius="90%"
                          fill="#8884d8"
                          dataKey="value"
                          nameKey="fullText"
                          label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
                            const RADIAN = Math.PI / 180;
                            const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                            const x = cx + radius * Math.cos(-midAngle * RADIAN);
                            const y = cy + radius * Math.sin(-midAngle * RADIAN);
                            return percent > 0.05 ? (
                              <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight="bold">
                                {`${(percent * 100).toFixed(0)}%`}
                              </text>
                            ) : null;
                          }}
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '12px', color: '#fff' }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                      </PieChart>
                    )}
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-400">No data available for this field.</div>
                )}
              </div>

            </div>
          )}

        </div>
      </main>
    </div>
  );
}
