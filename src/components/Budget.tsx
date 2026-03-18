import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Wallet, TrendingUp, TrendingDown, DollarSign, PieChart, Plus, X, Tag, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { api, type Transaction, type BudgetCategories } from "../lib/api";
import toast from "react-hot-toast";

export function Budget() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<BudgetCategories>({ income: [], expense: [] });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.budget.getTransactions(), api.budget.getCategories()])
      .then(([txs, cats]) => { setTransactions(txs); setCategories(cats); })
      .catch(() => toast.error("Failed to load budget data"))
      .finally(() => setIsLoading(false));
  }, []);

  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [txType, setTxType] = useState<"income" | "expense">("expense");
  const [txName, setTxName] = useState("");
  const [txAmount, setTxAmount] = useState("");
  const [txDate, setTxDate] = useState(new Date().toISOString().split("T")[0]);
  const [txCategory, setTxCategory] = useState("");
  const [catType, setCatType] = useState<"income" | "expense">("expense");
  const [newCategoryName, setNewCategoryName] = useState("");

  const { totalIncome, totalExpense, balance } = useMemo(() => {
    let inc = 0; let exp = 0;
    transactions.forEach(t => { if (t.type === "income") inc += t.amount; else exp += t.amount; });
    return { totalIncome: inc, totalExpense: exp, balance: inc - exp };
  }, [transactions]);

  // Compute real monthly chart data from transactions (last 7 months)
  const chartData = useMemo(() => {
    const monthMap: Record<string, { name: string; income: number; expenses: number }> = {};
    transactions.forEach(t => {
      const parts = t.date.split("-");
      if (parts.length < 2) return;
      const key = `${parts[0]}-${parts[1]}`;
      const label = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1).toLocaleString("en-US", { month: "short" });
      if (!monthMap[key]) monthMap[key] = { name: label, income: 0, expenses: 0 };
      if (t.type === "income") monthMap[key].income += t.amount;
      else monthMap[key].expenses += t.amount;
    });
    return Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-7)
      .map(([, v]) => v);
  }, [transactions]);

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txName || !txAmount || !txCategory) return;
    try {
      const newTx = await api.budget.createTransaction({ name: txName, amount: parseFloat(txAmount), date: txDate, category: txCategory, type: txType });
      setTransactions([newTx, ...transactions]);
      setIsTransactionModalOpen(false);
      setTxName(""); setTxAmount(""); setTxCategory("");
      toast.success("Transaction saved");
    } catch { toast.error("Failed to save transaction"); }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      const updated = await api.budget.addCategory(newCategoryName.trim(), catType);
      setCategories(updated);
      setNewCategoryName("");
      setIsCategoryModalOpen(false);
      toast.success("Category added");
    } catch { toast.error("Failed to add category"); }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      await api.budget.removeTransaction(id);
      setTransactions(transactions.filter(t => t.id !== id));
      toast.success("Transaction deleted");
    } catch { toast.error("Failed to delete transaction"); }
  };

  const openTransactionModal = (type: "income" | "expense") => {
    setTxType(type);
    // Safe default — avoid crash if categories are empty
    setTxCategory(categories[type][0] ?? "");
    setIsTransactionModalOpen(true);
  };

  const Skeleton = () => (
    <div className="space-y-3">
      {[1,2,3,4,5].map(i => <div key={i} className="h-16 rounded-2xl bg-white/[0.04] animate-pulse" />)}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
      className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 relative"
    >
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-5xl font-semibold tracking-tighter text-white mb-2">House Budget</h1>
          <p className="text-slate-400 text-lg font-light">Track your income and expenses</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => setIsCategoryModalOpen(true)} variant="outline" className="border-white/[0.1] text-slate-300 hover:bg-white/[0.05] hover:text-white">
            <Tag className="w-4 h-4 mr-2" /> Categories
          </Button>
          <Button onClick={() => openTransactionModal("income")} variant="outline" className="border-[var(--accent-border)] text-[var(--accent-400)] hover:bg-[var(--accent-subtle)] hover:border-[var(--accent-border)]">
            <TrendingUp className="w-4 h-4 mr-2" /> Add Income
          </Button>
          <Button onClick={() => openTransactionModal("expense")} variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50">
            <TrendingDown className="w-4 h-4 mr-2" /> Add Expense
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-indigo-900/30 to-indigo-900/10 border-indigo-500/20 relative overflow-hidden">
          <div className="absolute top-[-50%] right-[-20%] w-48 h-48 bg-indigo-500/10 blur-[60px] rounded-full" />
          <CardHeader className="pb-2">
            <CardTitle className="text-indigo-400/80 text-sm font-mono flex items-center gap-2 uppercase tracking-widest"><Wallet className="w-4 h-4" /> Total Balance</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl md:text-5xl font-light text-white tracking-tighter mb-2">KM {balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </CardContent>
        </Card>

        <Card className="border-[var(--accent-border)] relative overflow-hidden" style={{ background: "linear-gradient(135deg, color-mix(in srgb, var(--accent-500) 15%, transparent), color-mix(in srgb, var(--accent-500) 5%, transparent))" }}>
          <div className="absolute top-[-50%] right-[-20%] w-48 h-48 bg-[var(--accent-subtle)] blur-[60px] rounded-full" />
          <CardHeader className="pb-2">
            <CardTitle className="text-[var(--accent-400)]/80 text-sm font-mono flex items-center gap-2 uppercase tracking-widest"><TrendingUp className="w-4 h-4" /> Total Income</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl md:text-5xl font-light text-white tracking-tighter mb-2">KM {totalIncome.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-900/30 to-red-900/10 border-red-500/20 relative overflow-hidden">
          <div className="absolute top-[-50%] right-[-20%] w-48 h-48 bg-red-500/10 blur-[60px] rounded-full" />
          <CardHeader className="pb-2">
            <CardTitle className="text-red-400/80 text-sm font-mono flex items-center gap-2 uppercase tracking-widest"><TrendingDown className="w-4 h-4" /> Total Expenses</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl md:text-5xl font-light text-white tracking-tighter mb-2">KM {totalExpense.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-white/[0.03] border-white/[0.07]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-widest font-mono text-slate-400">
              <PieChart className="w-4 h-4 text-purple-400" />
              Income vs Expenses (Monthly)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px] md:h-[350px] w-full">
              {chartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-500 font-light">
                  Add transactions to see the chart.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="#334155" tick={{ fill: "#64748b", fontSize: 12, fontFamily: "JetBrains Mono" }} tickMargin={10} />
                    <YAxis stroke="#334155" tick={{ fill: "#64748b", fontSize: 12, fontFamily: "JetBrains Mono" }} tickFormatter={(v) => `KM ${v}`} />
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} opacity={0.5} />
                    <Tooltip contentStyle={{ backgroundColor: "rgba(15,23,42,0.8)", backdropFilter: "blur(12px)", borderColor: "rgba(255,255,255,0.1)", borderRadius: "16px", color: "#fff" }} itemStyle={{ color: "#e2e8f0", fontFamily: "JetBrains Mono", fontSize: "14px" }} />
                    <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                    <Area type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/[0.03] border-white/[0.07]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-widest font-mono text-slate-400">
              <DollarSign className="w-4 h-4 text-[var(--accent-400)]" /> Recent Transactions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-y-auto max-h-[350px] scrollbar-hide px-6 pb-6 space-y-4">
              {isLoading ? <div className="pt-4"><Skeleton /></div> : transactions.length === 0 ? (
                <div className="text-center py-10 text-slate-500 font-light">No transactions yet.</div>
              ) : (
                transactions.map((t) => (
                  <div key={t.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.04] border border-white/[0.07] hover:bg-white/[0.04] transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${t.type === "income" ? "bg-[var(--accent-subtle)] text-[var(--accent-400)] border border-[var(--accent-border)]" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
                        {t.type === "income" ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-200 text-base truncate">{t.name}</p>
                        <p className="text-xs text-slate-500 font-mono mt-1">{t.date}</p>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-4 shrink-0">
                      <div>
                        <p className={`font-mono text-lg tracking-tight ${t.type === "income" ? "text-[var(--accent-400)]" : "text-slate-200"}`}>
                          {t.type === "income" ? "+" : "-"}KM {t.amount.toFixed(2)}
                        </p>
                        <p className="text-xs text-slate-500 font-mono mt-1 uppercase tracking-wider truncate max-w-[80px]">{t.category}</p>
                      </div>
                      <button onClick={() => handleDeleteTransaction(t.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Modal */}
      <AnimatePresence>
        {isTransactionModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-md bg-[#0d1124] border border-white/[0.1] rounded-3xl shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-white/[0.07] flex items-center justify-between">
                <h3 className="text-xl font-medium text-white flex items-center gap-2">
                  {txType === "income" ? <TrendingUp className="w-5 h-5 text-[var(--accent-400)]" /> : <TrendingDown className="w-5 h-5 text-red-400" />}
                  Add {txType === "income" ? "Income" : "Expense"}
                </h3>
                <button onClick={() => setIsTransactionModalOpen(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleAddTransaction} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-widest text-slate-500">Amount</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <Input type="number" step="0.01" min="0" required value={txAmount} onChange={(e) => setTxAmount(e.target.value)} className="pl-12 text-2xl h-14 bg-white/[0.04] border-white/[0.07] font-mono" placeholder="0.00" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-widest text-slate-500">Description</label>
                  <Input required value={txName} onChange={(e) => setTxName(e.target.value)} className="bg-white/[0.04] border-white/[0.07]" placeholder="e.g., Groceries, Salary..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-mono uppercase tracking-widest text-slate-500">Date</label>
                    <Input type="date" required value={txDate} onChange={(e) => setTxDate(e.target.value)} className="bg-white/[0.04] border-white/[0.07] font-mono text-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-mono uppercase tracking-widest text-slate-500">Category</label>
                    <select required value={txCategory} onChange={(e) => setTxCategory(e.target.value)} className="w-full h-10 px-3 rounded-md bg-white/[0.04] border border-white/[0.07] text-sm text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)]/50 appearance-none">
                      <option value="" disabled>Select...</option>
                      {categories[txType].map(cat => <option key={cat} value={cat} className="bg-[#0d1124]">{cat}</option>)}
                    </select>
                  </div>
                </div>
                <Button type="submit" className={`w-full mt-4 ${txType === "income" ? "bg-[var(--accent-500)] hover:bg-[var(--accent-400)] text-black" : "bg-red-500 hover:bg-red-400 text-white"}`}>
                  Save Transaction
                </Button>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* Category Modal */}
        {isCategoryModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-md bg-[#0d1124] border border-white/[0.1] rounded-3xl shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-white/[0.07] flex items-center justify-between">
                <h3 className="text-xl font-medium text-white flex items-center gap-2"><Tag className="w-5 h-5 text-blue-400" /> Manage Categories</h3>
                <button onClick={() => setIsCategoryModalOpen(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex bg-white/[0.04] p-1 rounded-xl border border-white/[0.07]">
                  <button onClick={() => setCatType("income")} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${catType === "income" ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"}`}>Income</button>
                  <button onClick={() => setCatType("expense")} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${catType === "expense" ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"}`}>Expense</button>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-widest text-slate-500">Current Categories</label>
                  <div className="flex flex-wrap gap-2 max-h-[150px] overflow-y-auto p-2 bg-white/[0.03] rounded-xl border border-white/[0.07]">
                    {categories[catType].map(cat => <span key={cat} className="px-3 py-1 bg-white/[0.05] border border-white/[0.1] rounded-full text-xs text-slate-300">{cat}</span>)}
                  </div>
                </div>
                <form onSubmit={handleAddCategory} className="space-y-2 pt-4 border-t border-white/[0.07]">
                  <label className="text-xs font-mono uppercase tracking-widest text-slate-500">Add New Category</label>
                  <div className="flex gap-2">
                    <Input required value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} className="bg-white/[0.04] border-white/[0.07]" placeholder="Category name..." />
                    <Button type="submit" className="bg-blue-500 hover:bg-blue-400 text-white px-4">Add</Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
