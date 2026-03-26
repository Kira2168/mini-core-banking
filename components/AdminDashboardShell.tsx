"use client";

import { useState } from "react";
import LogoutButton from "@/components/LogoutButton";
import AdminClientsTable from "@/components/AdminClientsTable";

type AdminDashboardShellProps = {
  adminName: string;
};

export default function AdminDashboardShell({ adminName }: AdminDashboardShellProps) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const isDark = theme === "dark";

  return (
    <main
      className={`relative min-h-screen overflow-hidden px-4 py-10 transition-colors duration-300 ${
        isDark ? "bg-[#040b10]" : "bg-[#eef8f6]"
      }`}
    >
      <div
        className={`pointer-events-none absolute inset-0 ${
          isDark
            ? "bg-[radial-gradient(circle_at_10%_10%,rgba(45,199,184,0.24),transparent_45%),radial-gradient(circle_at_85%_70%,rgba(255,159,67,0.18),transparent_40%),linear-gradient(to_bottom,#061018,#03070a)]"
            : "bg-[radial-gradient(circle_at_10%_10%,rgba(26,150,139,0.2),transparent_45%),radial-gradient(circle_at_85%_70%,rgba(224,143,61,0.16),transparent_40%),linear-gradient(to_bottom,#f8fffd,#e4f2ef)]"
        }`}
      />

      <section className="relative z-10 mx-auto w-full max-w-6xl">
        <header
          className={`mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-5 backdrop-blur-md ${
            isDark ? "border-[#1f2d32] bg-[#08171d]/85" : "border-[#b6d3ce] bg-[#f5fffd]/90"
          }`}
        >
          <div>
            <p className={`text-xs font-semibold uppercase tracking-[0.28em] ${isDark ? "text-[#8ed7cf]" : "text-[#2d7a72]"}`}>
              LITTLE Mini Banking System
            </p>
            <h1 className={`mt-1 text-3xl font-bold ${isDark ? "text-[#f6fffd]" : "text-[#123a3f]"}`}>Admin Dashboard</h1>
            <p className={`mt-1 text-sm ${isDark ? "text-[#9eb4b0]" : "text-[#527471]"}`}>Welcome back {adminName}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className={`rounded-xl border px-4 py-2 text-sm font-semibold transition-colors ${
                isDark
                  ? "border-[#35535b] bg-[#10252d] text-[#b9d9d4] hover:bg-[#183641]"
                  : "border-[#98c4be] bg-[#f8fffe] text-[#2c5f5a] hover:bg-[#eff9f7]"
              }`}
            >
              {isDark ? "Light Mode" : "Dark Mode"}
            </button>
            <LogoutButton />
          </div>
        </header>

        <AdminClientsTable theme={theme} />
      </section>
    </main>
  );
}
