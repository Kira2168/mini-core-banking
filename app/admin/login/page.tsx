"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#040b10] px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(45,199,184,0.26),transparent_45%),radial-gradient(circle_at_80%_75%,rgba(255,159,67,0.2),transparent_40%),linear-gradient(to_bottom,#05141b,#03070a)]" />
      <div className="pointer-events-none absolute -left-20 top-1/3 h-72 w-72 rounded-full bg-[#2dc7b8]/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-1/4 h-80 w-80 rounded-full bg-[#ff9f43]/20 blur-3xl" />

      <section className="relative z-10 w-full max-w-md rounded-3xl border border-[#1f2d32] bg-linear-to-b from-[#091418]/95 to-[#051015]/95 p-8 shadow-[0_20px_80px_-35px_rgba(21,176,184,0.75)] backdrop-blur-xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#5fa8a0]/50 bg-white/90 p-2 shadow-sm">
            <Image src="/logo.png" alt="LITTLE Mini Banking System logo" width={40} height={40} className="h-10 w-10 object-contain" priority />
          </div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.35em] text-[#8ed7cf]">LITTLE Mini Banking System</p>
          <h1 className="text-3xl font-bold tracking-tight text-[#f8fffd]">Admin Login</h1>
          <p className="mt-2 text-sm text-[#9eb4b0]">Restricted access. Authorized administrator only.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="text"
            placeholder="Admin ID"
            value={id}
            onChange={(e) => setId(e.target.value)}
            required
            className="w-full rounded-xl border border-[#22414d] bg-[#0a2029] p-3 text-[#e6f4f2] outline-none transition-colors focus:border-[#2dc7b8]"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-xl border border-[#22414d] bg-[#0a2029] p-3 text-[#e6f4f2] outline-none transition-colors focus:border-[#2dc7b8]"
          />

          {error ? (
            <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-[#2dc7b8] py-3 font-bold tracking-wide text-[#03272b] transition-colors hover:bg-[#43ded0] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Checking..." : "Enter Dashboard"}
          </button>
        </form>
      </section>
    </main>
  );
}
