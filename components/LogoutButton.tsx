"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const logout = async () => {
    setLoading(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={logout}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-xl border border-[#385056] bg-[#10252d] px-4 py-2 text-sm font-semibold text-[#b9d9d4] transition-colors hover:bg-[#183641] disabled:cursor-not-allowed disabled:opacity-50"
    >
      <LogOut size={16} />
      {loading ? "Signing out..." : "Logout"}
    </button>
  );
}
