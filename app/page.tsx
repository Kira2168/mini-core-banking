"use client";

import Link from "next/link";
import { useState } from "react";
import RegistrationForm from "@/components/RegistrationForm";

export default function Home() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const isDark = theme === "dark";

  return (
    <main
      className={`relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 transition-colors duration-300 ${
        isDark ? "bg-[#040b10]" : "bg-[#edf8f5]"
      }`}
    >
      <div
        className={`pointer-events-none absolute inset-0 ${
          isDark
            ? "bg-[radial-gradient(circle_at_20%_20%,rgba(45,199,184,0.28),transparent_45%),radial-gradient(circle_at_80%_75%,rgba(255,159,67,0.22),transparent_40%),linear-gradient(to_bottom,#041016,#03070b)]"
            : "bg-[radial-gradient(circle_at_20%_20%,rgba(33,133,121,0.18),transparent_45%),radial-gradient(circle_at_80%_75%,rgba(224,143,61,0.18),transparent_40%),linear-gradient(to_bottom,#f7fffd,#e3f2ef)]"
        }`}
      />
      <div className={`pointer-events-none absolute -left-24 top-1/3 h-72 w-72 rounded-full blur-3xl ${isDark ? "bg-[#2dc7b8]/20" : "bg-[#2aa89a]/20"}`} />
      <div className={`pointer-events-none absolute -right-24 bottom-1/4 h-80 w-80 rounded-full blur-3xl ${isDark ? "bg-[#ff9f43]/20" : "bg-[#e89c50]/20"}`} />

      <button
        type="button"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className={`absolute right-6 top-6 z-20 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
          isDark
            ? "border-[#31515a] bg-[#0b1d25]/80 text-[#b7d8d4] hover:bg-[#14303b]"
            : "border-[#98c4be] bg-[#f8fffe] text-[#2c5f5a] hover:bg-[#eff9f7]"
        }`}
      >
        {isDark ? "Light Mode" : "Dark Mode"}
      </button>

      <Link
        href="/admin/login"
        className={`absolute left-6 top-6 z-20 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
          isDark
            ? "border-[#385056] bg-[#0b1d25]/80 text-[#b7d8d4] hover:bg-[#14303b]"
            : "border-[#98c4be] bg-[#f8fffe] text-[#2c5f5a] hover:bg-[#eff9f7]"
        }`}
      >
        Admin Login
      </Link>

      <section className="relative z-10 w-full max-w-xl">
        <RegistrationForm theme={theme} />
      </section>
    </main>
  );
}