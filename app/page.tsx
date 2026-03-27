"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Moon, ShieldUser, Sun } from "lucide-react";
import RegistrationForm from "@/components/RegistrationForm";

export default function Home() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const isDark = theme === "dark";

  return (
    <main
      className={`relative min-h-screen overflow-hidden px-4 py-10 transition-colors duration-300 md:px-6 ${
        isDark ? "bg-[#01050a]" : "bg-[#eff8f5]"
      }`}
    >
      <div
        className={`pointer-events-none absolute inset-0 ${
          isDark
            ? "bg-[radial-gradient(circle_at_18%_24%,rgba(45,199,184,0.24),transparent_46%),radial-gradient(circle_at_83%_14%,rgba(255,159,67,0.18),transparent_40%),radial-gradient(circle_at_65%_80%,rgba(43,99,214,0.16),transparent_42%),linear-gradient(168deg,#01050a_0%,#020a12_54%,#01060b_100%)]"
            : "bg-[radial-gradient(circle_at_18%_24%,rgba(33,133,121,0.2),transparent_46%),radial-gradient(circle_at_83%_14%,rgba(224,143,61,0.2),transparent_40%),radial-gradient(circle_at_65%_80%,rgba(58,122,213,0.15),transparent_42%),linear-gradient(168deg,#f8fffd_0%,#e8f5f2_54%,#dceeea_100%)]"
        }`}
      />
      <div className="pointer-events-none absolute inset-0">
        <Image
          src="/bank.jpg"
          alt="Money background"
          fill
          priority
          className={`bank-bg-drift object-cover object-center transition-all duration-700 ${
            isDark ? "scale-[1.04] opacity-14 mix-blend-screen" : "scale-[1.02] opacity-25 mix-blend-multiply"
          }`}
        />
      </div>
      <div
        className={`pointer-events-none absolute inset-0 ${
          isDark
            ? "bg-[radial-gradient(circle_at_50%_42%,transparent_18%,rgba(1,5,8,0.82)_78%)]"
            : "bg-[radial-gradient(circle_at_50%_42%,transparent_20%,rgba(224,240,236,0.72)_78%)]"
        }`}
      />
      <div
        className={`pointer-events-none absolute inset-0 opacity-40 ${
          isDark
            ? "bg-[linear-gradient(rgba(109,168,176,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(109,168,176,0.12)_1px,transparent_1px)]"
            : "bg-[linear-gradient(rgba(46,111,108,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(46,111,108,0.12)_1px,transparent_1px)]"
        } bank-grid-shift bg-size-[58px_58px]`}
      />
      <div className={`bank-float pointer-events-none absolute -left-24 top-1/3 h-72 w-72 rounded-full blur-3xl ${isDark ? "bg-[#2dc7b8]/20" : "bg-[#2aa89a]/20"}`} />
      <div className={`bank-float pointer-events-none absolute -right-24 bottom-1/4 h-80 w-80 rounded-full blur-3xl ${isDark ? "bg-[#ff9f43]/20" : "bg-[#e89c50]/20"}`} style={{ animationDelay: "-2.4s" }} />

      <div
        className={`bank-float pointer-events-none absolute -left-12 top-20 hidden h-44 w-72 rotate-[-10deg] rounded-2xl border p-4 shadow-2xl backdrop-blur-lg lg:block ${
          isDark
            ? "border-[#2a4a57] bg-linear-to-br from-[#0f2f3f]/90 via-[#0a1f2b]/90 to-[#07141d]/85"
            : "border-[#9cc8c3] bg-linear-to-br from-[#ffffff]/90 via-[#f2fbf8]/90 to-[#e7f3f0]/85"
        }`}
      >
        <p className={`text-[10px] font-semibold uppercase tracking-[0.25em] ${isDark ? "text-[#8bc6c0]" : "text-[#357d75]"}`}>
          Core Wallet Ledger
        </p>
        <p className={`mt-4 text-lg font-semibold tracking-[0.2em] ${isDark ? "text-[#f4fffd]" : "text-[#153d40]"}`}>2135 4789 0021 9084</p>
        <div className="mt-6 flex items-end justify-between">
          <p className={`text-xs ${isDark ? "text-[#b3d2ce]" : "text-[#446866]"}`}>Settlement Tier: Gold</p>
          <p className={`text-sm font-bold ${isDark ? "text-[#ffd7ac]" : "text-[#9d5b17]"}`}>KYC+</p>
        </div>
      </div>

      <div
        className={`bank-float pointer-events-none absolute -right-10 bottom-10 hidden w-72 rounded-2xl border p-4 shadow-2xl backdrop-blur-lg xl:block ${
          isDark ? "border-[#223745] bg-[#08131b]/88" : "border-[#aecfca] bg-[#f8fffd]/90"
        }`}
        style={{ animationDelay: "-3.6s" }}
      >
        <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${isDark ? "text-[#8bc6c0]" : "text-[#30716a]"}`}>
          Transaction Pulse
        </p>
        <div className="mt-3 space-y-2">
          {["Clearing", "Savings", "Treasury"].map((label, i) => (
            <div key={label} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className={isDark ? "text-[#adc7c4]" : "text-[#3d6764]"}>{label}</span>
                <span className={isDark ? "text-[#d9ece9]" : "text-[#1a4649]"}>{["92%", "81%", "74%"][i]}</span>
              </div>
              <div className={`h-1.5 rounded-full ${isDark ? "bg-[#12242f]" : "bg-[#d9ebe8]"}`}>
                <div
                  className={`h-full rounded-full ${i === 0 ? "w-[92%]" : i === 1 ? "w-[81%]" : "w-[74%]"} ${
                    i === 0 ? "bg-[#2dc7b8]" : i === 1 ? "bg-[#58b7f0]" : "bg-[#ff9f43]"
                  }`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

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
        href="/admin/login"
        className={`absolute left-6 top-6 z-20 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
          isDark
            ? "border-[#385056] bg-[#0b1d25]/80 text-[#b7d8d4] hover:bg-[#14303b]"
            : "border-[#98c4be] bg-[#f8fffe] text-[#2c5f5a] hover:bg-[#eff9f7]"
        }`}
      >
        <ShieldUser size={16} />
        Admin Login
      </Link>

      <section className="relative z-10 mx-auto mt-20 grid w-full max-w-6xl items-center gap-10 lg:grid-cols-[1fr_auto] lg:gap-12">
        <div className="order-2 space-y-6 lg:order-1">
          <p className={`inline-flex rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] ${isDark ? "border-[#305563] bg-[#091822]/85 text-[#9ad6d0]" : "border-[#a8ccc8] bg-[#f4fffd]/85 text-[#2f7a72]"}`}>
            Mini Core Banking
          </p>
          <h1 className={`text-4xl font-black leading-tight sm:text-5xl ${isDark ? "text-[#f7fffd]" : "text-[#10363a]"}`}>
            Open Accounts With
            <span className={isDark ? " text-[#6de5d7]" : " text-[#1e8f84]"}> Secure Digital Onboarding</span>
          </h1>
          <p className={`max-w-2xl text-base sm:text-lg ${isDark ? "text-[#acc5c1]" : "text-[#486f6b]"}`}>
            Designed for a modern banking flow with identity checks, customer profiles, and fast registration rails ready for teller and admin operations.
          </p>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: "Daily Registrations", value: "1,240+" },
              { label: "AML Review", value: "99.4%" },
              { label: "Avg Setup", value: "2m 18s" },
            ].map((item) => (
              <article
                key={item.label}
                className={`rounded-2xl border p-4 backdrop-blur-lg ${
                  isDark ? "border-[#254150] bg-[#08141d]/82" : "border-[#b7d5d1] bg-[#ffffff]/75"
                } relative overflow-hidden transition-transform duration-300 hover:-translate-y-1`}
              >
                <span
                  className={`bank-sheen pointer-events-none absolute -left-8 top-0 h-full w-10 ${
                    isDark ? "bg-linear-to-r from-transparent via-[#9ff5eb]/35 to-transparent" : "bg-linear-to-r from-transparent via-[#66c8bb]/25 to-transparent"
                  }`}
                />
                <p className={`text-xs uppercase tracking-[0.2em] ${isDark ? "text-[#83b7b1]" : "text-[#4a7d77]"}`}>{item.label}</p>
                <p className={`mt-2 text-2xl font-bold ${isDark ? "text-[#f2fffd]" : "text-[#163f42]"}`}>{item.value}</p>
              </article>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className={`rounded-2xl border p-4 transition-transform duration-300 hover:-translate-y-1 ${isDark ? "border-[#2d4454] bg-[#091521]/88" : "border-[#b5d1cd] bg-[#f9fffd]/90"}`}>
              <p className={`text-sm font-semibold ${isDark ? "text-[#dbf4f1]" : "text-[#1e4f52]"}`}>Integrated account categories</p>
              <p className={`mt-1 text-sm ${isDark ? "text-[#9dbab7]" : "text-[#537674]"}`}>Personal, staff, corporate, NGO, and association onboarding in one flow.</p>
            </div>
            <div className={`rounded-2xl border p-4 transition-transform duration-300 hover:-translate-y-1 ${isDark ? "border-[#4e3d2d] bg-[#1a120a]/88" : "border-[#dec7a6] bg-[#fff8ef]/92"}`}>
              <p className={`text-sm font-semibold ${isDark ? "text-[#ffdbb1]" : "text-[#8f5f28]"}`}>Audit-friendly trail</p>
              <p className={`mt-1 text-sm ${isDark ? "text-[#d3bb9f]" : "text-[#866543]"}`}>Every client entry can be traced by role and timestamp for compliance visibility.</p>
            </div>
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <RegistrationForm theme={theme} />
        </div>
      </section>
    </main>
  );
}