import React, { useState } from "react";
import { motion } from "motion/react";
import { Lock, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

interface LoginProps {
  onSuccess: () => void;
}

export function Login({ onSuccess }: LoginProps) {
  const [password, setPassword]       = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading]     = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Pogrešna lozinka");
        return;
      }

      const { token } = await res.json();
      localStorage.setItem("dashboard_token", token);
      onSuccess();
    } catch {
      toast.error("Greška pri povezivanju s serverom");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080c18] flex items-center justify-center p-4">
      {/* Subtle background grid */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-sm relative"
      >
        {/* Icon + heading */}
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[var(--accent-subtle)] border border-[var(--accent-border)] flex items-center justify-center mb-5 shadow-[0_0_40px_rgba(16,185,129,0.1)]">
            <Lock className="w-7 h-7 text-[var(--accent-400)]" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-white mb-1.5">
            Adi Zeljković
          </h1>
          <p className="text-slate-500 text-sm font-light">
            Personal Dashboard
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/[0.04] border border-white/[0.06] rounded-3xl p-8 shadow-[0_0_60px_rgba(0,0,0,0.5)]">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-widest text-slate-500">
                Lozinka
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-12 px-4 pr-12 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white placeholder:text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)]/40 focus:border-[var(--accent-border)] transition-all"
                  autoFocus
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-300 transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !password.trim()}
              className="w-full h-12 rounded-xl bg-[var(--accent-500)] hover:bg-[var(--accent-400)] active:brightness-90 disabled:opacity-40 disabled:cursor-not-allowed text-black font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_0_30px_var(--accent-glow)]"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                "Prijavi se"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-700 text-xs mt-6 font-mono">
          dashboard.adizeljkovic.com
        </p>
      </motion.div>
    </div>
  );
}
