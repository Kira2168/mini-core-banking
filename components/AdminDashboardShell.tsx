"use client";

import Image from "next/image";
import { useState } from "react";
import { Moon, Sun } from "lucide-react";
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
      <div className="pointer-events-none absolute inset-0">
        <Image
          src="/bank.jpg"
          alt="Money background"
          fill
          priority
          className={`bank-bg-drift object-cover object-center ${
            isDark ? "opacity-14 mix-blend-screen" : "opacity-20 mix-blend-multiply"
          }`}
        />
      </div>
      <div
        className={`pointer-events-none absolute inset-0 ${
          isDark
            ? "bg-[radial-gradient(circle_at_50%_35%,transparent_20%,rgba(2,8,12,0.62)_80%)]"
            : "bg-[radial-gradient(circle_at_50%_35%,transparent_20%,rgba(224,241,237,0.66)_80%)]"
        }`}
      />
      <div
        className={`pointer-events-none absolute inset-0 opacity-30 ${
          isDark
            ? "bg-[linear-gradient(rgba(109,168,176,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(109,168,176,0.1)_1px,transparent_1px)]"
            : "bg-[linear-gradient(rgba(46,111,108,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(46,111,108,0.1)_1px,transparent_1px)]"
        } bank-grid-shift bg-size-[60px_60px]`}
      />

      <div
        className={`bank-float pointer-events-none absolute right-8 top-28 hidden w-72 rounded-2xl border p-4 shadow-2xl backdrop-blur-lg xl:block ${
          isDark ? "border-[#223745] bg-[#08131b]/88" : "border-[#aecfca] bg-[#f8fffd]/90"
        }`}
      >
        <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${isDark ? "text-[#8bc6c0]" : "text-[#30716a]"}`}>
          Portfolio Health
        </p>
        <div className="mt-3 space-y-2">
          {[
            { label: "Active Accounts", value: "94%", width: "w-[94%]", color: "bg-[#2dc7b8]" },
            { label: "KYC Verified", value: "88%", width: "w-[88%]", color: "bg-[#58b7f0]" },
            { label: "Risk Cleared", value: "79%", width: "w-[79%]", color: "bg-[#ff9f43]" },
          ].map((item) => (
            <div key={item.label} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className={isDark ? "text-[#adc7c4]" : "text-[#3d6764]"}>{item.label}</span>
                <span className={isDark ? "text-[#d9ece9]" : "text-[#1a4649]"}>{item.value}</span>
              </div>
              <div className={`h-1.5 rounded-full ${isDark ? "bg-[#12242f]" : "bg-[#d9ebe8]"}`}>
                <div className={`h-full rounded-full ${item.width} ${item.color}`} />
              </div>
            </div>
          ))}
        </div>
      </div>

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
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              title={isDark ? "Light mode" : "Dark mode"}
              className={`rounded-xl border p-2.5 transition-colors ${
                isDark
                  ? "border-[#35535b] bg-[#10252d] text-[#b9d9d4] hover:bg-[#183641]"
                  : "border-[#98c4be] bg-[#f8fffe] text-[#2c5f5a] hover:bg-[#eff9f7]"
              }`}
            >
              {isDark ? <Sun size={18} strokeWidth={2.2} /> : <Moon size={18} strokeWidth={2.2} />}
            </button>
            <LogoutButton />
          </div>
        </header>

        <AdminClientsTable theme={theme} />
      </section>
    </main>
  );
}
