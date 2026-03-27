"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, LogIn, Moon, ShieldUser, Sun } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isDark = theme === "dark";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, password }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.error ?? "Invalid login.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Unable to login right now.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className={`relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 ${
        isDark ? "bg-[#040b10]" : "bg-[#edf8f5]"
      }`}
    >
      <div
        className={`pointer-events-none absolute inset-0 ${
          isDark
            ? "bg-[radial-gradient(circle_at_20%_15%,rgba(45,199,184,0.26),transparent_45%),radial-gradient(circle_at_80%_75%,rgba(255,159,67,0.2),transparent_40%),linear-gradient(to_bottom,#05141b,#03070a)]"
            : "bg-[radial-gradient(circle_at_20%_15%,rgba(33,133,121,0.16),transparent_45%),radial-gradient(circle_at_80%_75%,rgba(224,143,61,0.16),transparent_40%),linear-gradient(to_bottom,#f9fffe,#e6f4f0)]"
        }`}
      />
      <div className="pointer-events-none absolute inset-0">
        <Image
          src="/bank.jpg"
          alt="Money background"
          fill
          priority
          className={`bank-bg-drift object-cover object-center ${
            isDark ? "opacity-18 mix-blend-screen" : "opacity-22 mix-blend-multiply"
          }`}
        />
      </div>
      <div className={`bank-float pointer-events-none absolute -left-20 top-1/3 h-72 w-72 rounded-full blur-3xl ${isDark ? "bg-[#2dc7b8]/20" : "bg-[#2aa89a]/20"}`} />
      <div className={`bank-float pointer-events-none absolute -right-20 bottom-1/4 h-80 w-80 rounded-full blur-3xl ${isDark ? "bg-[#ff9f43]/20" : "bg-[#e89c50]/20"}`} style={{ animationDelay: "-2.1s" }} />

      <button
        type="button"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        title={isDark ? "Light mode" : "Dark mode"}
        className={`absolute right-6 top-6 z-20 rounded-full border p-2.5 transition-colors ${
          isDark
            ? "border-[#31515a] bg-[#0b1d25]/80 text-[#b7d8d4] hover:bg-[#14303b]"
            : "border-[#98c4be] bg-[#f8fffe] text-[#2c5f5a] hover:bg-[#eff9f7]"
        }`}
      >
        {isDark ? <Sun size={18} strokeWidth={2.2} /> : <Moon size={18} strokeWidth={2.2} />}
      </button>

      <Link
        href="/"
        className={`absolute left-6 top-6 z-20 inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition-colors ${
          isDark
            ? "border-[#31515a] bg-[#0b1d25]/80 text-[#b7d8d4] hover:bg-[#14303b]"
            : "border-[#98c4be] bg-[#f8fffe] text-[#2c5f5a] hover:bg-[#eff9f7]"
        }`}
      >
        <ArrowLeft size={16} />
        Back
      </Link>

      <section
        className={`relative z-10 w-full max-w-md rounded-3xl border p-8 shadow-[0_20px_80px_-35px_rgba(21,176,184,0.55)] backdrop-blur-xl ${
          isDark
            ? "border-[#1f2d32] bg-linear-to-b from-[#091418]/95 to-[#051015]/95"
            : "border-[#b7d5d1] bg-linear-to-b from-[#f8fffe]/95 to-[#ecf6f5]/95"
        }`}
      >
        <span
          className={`bank-sheen pointer-events-none absolute -left-10 top-0 h-full w-12 ${
            isDark ? "bg-linear-to-r from-transparent via-[#9ff5eb]/30 to-transparent" : "bg-linear-to-r from-transparent via-[#66c8bb]/22 to-transparent"
          }`}
        />
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#5fa8a0]/50 bg-white/90 p-2 shadow-sm">
            <Image src="/logo.png" alt="LITTLE Mini Banking System logo" width={40} height={40} className="h-10 w-10 object-contain" priority />
          </div>
          <p className={`mb-2 text-xs font-semibold uppercase tracking-[0.35em] ${isDark ? "text-[#8ed7cf]" : "text-[#2f7e75]"}`}>
            LITTLE Mini Banking System
          </p>
          <h1 className={`inline-flex items-center gap-2 text-3xl font-bold tracking-tight ${isDark ? "text-[#f8fffd]" : "text-[#10373b]"}`}>
            <ShieldUser size={26} strokeWidth={2.1} />
            Admin Login
          </h1>
          <p className={`mt-2 text-sm ${isDark ? "text-[#9eb4b0]" : "text-[#4f6f6c]"}`}>Restricted access. Authorized administrator only.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="text"
            placeholder="Admin ID"
            value={id}
            onChange={(e) => setId(e.target.value)}
            required
            className={`w-full rounded-xl border p-3 outline-none transition-colors ${
              isDark
                ? "border-[#22414d] bg-[#0a2029] text-[#e6f4f2] focus:border-[#2dc7b8]"
                : "border-[#a6cbc6] bg-[#fbfffe] text-[#173d42] focus:border-[#1ea696]"
            }`}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={`w-full rounded-xl border p-3 outline-none transition-colors ${
              isDark
                ? "border-[#22414d] bg-[#0a2029] text-[#e6f4f2] focus:border-[#2dc7b8]"
                : "border-[#a6cbc6] bg-[#fbfffe] text-[#173d42] focus:border-[#1ea696]"
            }`}
          />

          {error ? (
            <p
              className={`rounded-xl border px-3 py-2 text-sm ${
                isDark ? "border-red-500/40 bg-red-500/10 text-red-200" : "border-red-300 bg-red-100 text-red-700"
              }`}
            >
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2dc7b8] py-3 font-bold tracking-wide text-[#03272b] transition-colors hover:bg-[#43ded0] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <LogIn size={17} />
            {loading ? "Checking..." : "Enter Dashboard"}
          </button>
        </form>
      </section>
    </main>
  );
}
