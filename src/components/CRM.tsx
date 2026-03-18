import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Users, Phone, Mail, MoreHorizontal, ArrowUpRight, ArrowDownRight,
  ChevronLeft, FileText, MessageSquare, Plus, Calendar as CalendarIcon,
  Download, CheckCircle2, Clock, AlertCircle, Building2, MapPin, Send
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { api, type CRMClient } from "../lib/api";


export function CRM() {
  const [clients, setClients] = useState<CRMClient[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "communications" | "invoices" | "documents">("overview");
  const [newComm, setNewComm] = useState("");

  useEffect(() => {
    api.crm.getAll().then(setClients).catch(console.error);
  }, []);

  const selectedClient = clients.find(c => c.id === selectedClientId);

  const handleAddCommunication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComm.trim() || !selectedClient) return;

    const created = await api.crm.addCommunication(selectedClient.id, { preview: newComm });
    setClients(clients.map(c => c.id === selectedClient.id ? {
      ...c,
      communications: [created, ...c.communications]
    } : c));
    setNewComm("");
  };

  if (selectedClient) {
    return (
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="p-4 md:p-8 max-w-7xl mx-auto space-y-8"
      >
        <button
          onClick={() => setSelectedClientId(null)}
          className="flex items-center text-slate-400 hover:text-white transition-colors group text-sm font-mono uppercase tracking-widest"
        >
          <ChevronLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Clients
        </button>

        <header className="flex flex-col md:flex-row md:items-start justify-between gap-6 bg-white/[0.01] border border-white/[0.05] p-4 md:p-8 rounded-3xl relative overflow-hidden">
          <div className={`absolute top-0 left-0 w-1 h-full ${
            selectedClient.status === 'Active' ? 'bg-emerald-500' :
            selectedClient.status === 'Pending' ? 'bg-yellow-500' :
            'bg-slate-500'
          }`} />
          
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-3xl font-bold border border-white/5 shadow-inner text-white">
              {selectedClient.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl md:text-4xl font-semibold tracking-tighter text-white">{selectedClient.name}</h1>
                <span className={`px-3 py-1 rounded-full text-[10px] font-mono tracking-widest uppercase border ${
                  selectedClient.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                  selectedClient.status === 'Pending' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                  'bg-slate-500/10 text-slate-400 border-slate-500/20'
                }`}>
                  {selectedClient.status}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400 font-light">
                <span className="flex items-center gap-1.5"><Building2 className="w-4 h-4" /> {selectedClient.company}</span>
                <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" /> {selectedClient.contact}</span>
                <span className="flex items-center gap-1.5"><Phone className="w-4 h-4" /> {selectedClient.phone}</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <span className="text-sm text-slate-500 font-mono uppercase tracking-widest">Total Value</span>
            <span className="text-4xl font-light text-white tracking-tighter">{selectedClient.value}</span>
          </div>
        </header>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {(["overview", "communications", "invoices", "documents"] as const).map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 rounded-full text-sm font-mono tracking-widest uppercase transition-all duration-300 whitespace-nowrap ${
                activeTab === tab 
                  ? "bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)]" 
                  : "bg-white/[0.02] text-slate-400 hover:bg-white/[0.05] hover:text-slate-200 border border-white/[0.05]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="mt-6">
          <AnimatePresence mode="wait">
            {activeTab === "overview" && (
              <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="col-span-1 md:col-span-2 bg-white/[0.01] border-white/[0.05]">
                  <CardHeader><CardTitle className="text-sm uppercase tracking-widest font-mono text-slate-400">About Company</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-slate-300 font-light leading-relaxed">{selectedClient.about}</p>
                    <div className="mt-6 flex items-start gap-3 text-sm text-slate-400">
                      <MapPin className="w-5 h-5 text-slate-500 shrink-0" />
                      <span>{selectedClient.address}</span>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white/[0.01] border-white/[0.05]">
                  <CardHeader><CardTitle className="text-sm uppercase tracking-widest font-mono text-slate-400">Quick Stats</CardTitle></CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <span className="text-xs text-slate-500 uppercase tracking-widest font-mono block mb-1">Last Contact</span>
                      <span className="text-lg text-white">{selectedClient.lastContact}</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 uppercase tracking-widest font-mono block mb-1">Total Invoices</span>
                      <span className="text-lg text-white">{selectedClient.invoices.length}</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 uppercase tracking-widest font-mono block mb-1">Documents</span>
                      <span className="text-lg text-white">{selectedClient.documents.length}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeTab === "communications" && (
              <motion.div key="communications" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                <Card className="bg-white/[0.01] border-white/[0.05]">
                  <CardContent className="p-6">
                    <form onSubmit={handleAddCommunication} className="flex gap-4">
                      <Input 
                        value={newComm}
                        onChange={(e) => setNewComm(e.target.value)}
                        placeholder="Log a note, call summary, or update..." 
                        className="flex-1 bg-white/[0.02] border-white/[0.05]" 
                      />
                      <Button type="submit" className="bg-emerald-500 text-black hover:bg-emerald-400"><Send className="w-4 h-4 mr-2" /> Log</Button>
                    </form>
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  {selectedClient.communications.map((comm) => (
                    <Card key={comm.id} className="bg-white/[0.01] border-white/[0.05] hover:bg-white/[0.02] transition-colors">
                      <CardContent className="p-6 flex gap-6">
                        <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center shrink-0">
                          {comm.type === 'email' ? <Mail className="w-5 h-5 text-blue-400" /> :
                           comm.type === 'call' ? <Phone className="w-5 h-5 text-emerald-400" /> :
                           comm.type === 'meeting' ? <Users className="w-5 h-5 text-purple-400" /> :
                           <MessageSquare className="w-5 h-5 text-orange-400" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-lg font-medium text-white">{comm.subject}</h4>
                            <span className="text-xs text-slate-500 font-mono flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {comm.date}</span>
                          </div>
                          <p className="text-slate-400 font-light text-sm">{comm.preview}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {selectedClient.communications.length === 0 && (
                    <div className="text-center py-12 text-slate-500 font-light">No communication history yet.</div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === "invoices" && (
              <motion.div key="invoices" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <Card className="bg-white/[0.01] border-white/[0.05] overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-slate-500 uppercase tracking-widest font-mono bg-white/[0.02] border-b border-white/[0.05]">
                        <tr>
                          <th className="px-8 py-5 font-medium">Invoice ID</th>
                          <th className="px-8 py-5 font-medium">Date</th>
                          <th className="px-8 py-5 font-medium">Amount</th>
                          <th className="px-8 py-5 font-medium">Status</th>
                          <th className="px-8 py-5 font-medium text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedClient.invoices.map((inv) => (
                          <tr key={inv.id} className="border-b border-white/[0.05] hover:bg-white/[0.02] transition-colors">
                            <td className="px-8 py-5 font-medium text-white flex items-center gap-3">
                              <FileText className="w-4 h-4 text-slate-500" /> {inv.id}
                            </td>
                            <td className="px-8 py-5 text-slate-400 font-mono">{inv.date}</td>
                            <td className="px-8 py-5 text-slate-300 font-mono tracking-tight">{inv.amount}</td>
                            <td className="px-8 py-5">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-mono tracking-widest uppercase border ${
                                inv.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                inv.status === 'Pending' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                'bg-red-500/10 text-red-400 border-red-500/20'
                              }`}>
                                {inv.status}
                              </span>
                            </td>
                            <td className="px-8 py-5 text-right">
                              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white"><Download className="w-4 h-4" /></Button>
                            </td>
                          </tr>
                        ))}
                        {selectedClient.invoices.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-8 py-12 text-center text-slate-500 font-light">No invoices found.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </motion.div>
            )}

            {activeTab === "documents" && (
              <motion.div key="documents" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {selectedClient.documents.map((doc) => (
                    <Card key={doc.id} className="bg-white/[0.01] border-white/[0.05] hover:bg-white/[0.03] transition-colors group cursor-pointer">
                      <CardContent className="p-6 flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 text-blue-400 group-hover:scale-110 transition-transform">
                          <FileText className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-white truncate mb-1">{doc.name}</h4>
                          <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
                            <span>{doc.size}</span>
                            <span>•</span>
                            <span>{doc.date}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  <Card className="bg-white/[0.01] border-white/[0.05] border-dashed hover:bg-white/[0.02] transition-colors cursor-pointer flex flex-col items-center justify-center min-h-[100px] text-slate-500 hover:text-white group">
                    <CardContent className="p-6 flex flex-col items-center justify-center gap-2">
                      <Plus className="w-6 h-6 group-hover:scale-125 transition-transform" />
                      <span className="text-sm font-medium">Upload Document</span>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    );
  }

  // Main Dashboard View
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-4 md:p-8 max-w-7xl mx-auto space-y-8"
    >
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-5xl font-semibold tracking-tighter text-white mb-2">CRM</h1>
          <p className="text-slate-400 text-lg font-light">Manage your client relationships</p>
        </div>
        <div className="flex items-center gap-3">
          <Input placeholder="Search clients..." className="w-full md:w-64 bg-white/[0.02] border-white/[0.05]" />
          <Button className="bg-emerald-500 text-black hover:bg-emerald-400"><Plus className="w-4 h-4 mr-2" /> Add Client</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-emerald-900/20 to-emerald-900/5 border-emerald-500/20 relative overflow-hidden">
          <div className="absolute top-[-50%] right-[-20%] w-48 h-48 bg-emerald-500/10 blur-[60px] rounded-full" />
          <CardHeader className="pb-2">
            <CardTitle className="text-emerald-400/80 text-sm font-mono flex items-center gap-2 uppercase tracking-widest">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="flex items-end gap-3">
              <span className="text-5xl font-light text-white tracking-tighter">KM 48,700</span>
              <span className="flex items-center text-emerald-400 text-sm mb-2 font-mono">
                <ArrowUpRight className="w-4 h-4 mr-1" /> +12%
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-900/20 to-blue-900/5 border-blue-500/20 relative overflow-hidden">
          <div className="absolute top-[-50%] right-[-20%] w-48 h-48 bg-blue-500/10 blur-[60px] rounded-full" />
          <CardHeader className="pb-2">
            <CardTitle className="text-blue-400/80 text-sm font-mono flex items-center gap-2 uppercase tracking-widest">Active Clients</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="flex items-end gap-3">
              <span className="text-5xl font-light text-white tracking-tighter">24</span>
              <span className="flex items-center text-blue-400 text-sm mb-2 font-mono">
                <ArrowUpRight className="w-4 h-4 mr-1" /> +3
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-900/20 to-orange-900/5 border-orange-500/20 relative overflow-hidden">
          <div className="absolute top-[-50%] right-[-20%] w-48 h-48 bg-orange-500/10 blur-[60px] rounded-full" />
          <CardHeader className="pb-2">
            <CardTitle className="text-orange-400/80 text-sm font-mono flex items-center gap-2 uppercase tracking-widest">Pending Deals</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="flex items-end gap-3">
              <span className="text-5xl font-light text-white tracking-tighter">7</span>
              <span className="flex items-center text-orange-400 text-sm mb-2 font-mono">
                <ArrowDownRight className="w-4 h-4 mr-1" /> -2
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white/[0.01] border-white/[0.05] overflow-hidden">
        <CardHeader>
          <CardTitle className="text-sm uppercase tracking-widest font-mono text-slate-400">All Clients</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase tracking-widest font-mono bg-white/[0.02] border-y border-white/[0.05]">
                <tr>
                  <th className="px-8 py-5 font-medium">Client</th>
                  <th className="px-8 py-5 font-medium">Contact</th>
                  <th className="px-8 py-5 font-medium">Status</th>
                  <th className="px-8 py-5 font-medium">Value</th>
                  <th className="px-8 py-5 font-medium">Last Contact</th>
                  <th className="px-8 py-5 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr 
                    key={client.id} 
                    onClick={() => setSelectedClientId(client.id)}
                    className="border-b border-white/[0.05] hover:bg-white/[0.03] transition-colors group cursor-pointer"
                  >
                    <td className="px-8 py-5 font-medium text-white flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-sm font-bold border border-white/5 shadow-inner group-hover:scale-110 transition-transform">
                        {client.name.charAt(0)}
                      </div>
                      <span className="text-base group-hover:text-emerald-400 transition-colors">{client.name}</span>
                    </td>
                    <td className="px-8 py-5 text-slate-400">{client.contact}</td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-mono tracking-widest uppercase border ${
                        client.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        client.status === 'Pending' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                        'bg-slate-500/10 text-slate-400 border-slate-500/20'
                      }`}>
                        {client.status}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-slate-300 font-mono text-base tracking-tight">{client.value}</td>
                    <td className="px-8 py-5 text-slate-500 font-mono text-xs uppercase tracking-wider">{client.lastContact}</td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-white/[0.05] hover:text-white" onClick={(e) => e.stopPropagation()}><Phone className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-white/[0.05] hover:text-white" onClick={(e) => e.stopPropagation()}><Mail className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-white/[0.05] hover:text-white" onClick={(e) => e.stopPropagation()}><MoreHorizontal className="w-4 h-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
