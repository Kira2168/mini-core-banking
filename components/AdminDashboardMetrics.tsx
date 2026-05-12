"use client";

import { useEffect, useMemo, useState } from "react";

type MetricsResponse = {
  newClientsWeek: number;
  newClientsMonth: number;
  cashTransactionsWeek: number;
  transferTransactionsWeek: number;
  topTransactionsWeek: Array<{
    transactionId: number;
    transactionType: "Cash" | "Transfer";
    direction: "Credit" | "Debit";
    amount: string | number;
    createdAt: string;
    accountId: number;
  }>;
  topAccountsByBalance: Array<{
    accountId: number;
    accountNumber: string;
    clientId: number;
    balance: string | number;
  }>;
};

type ApiResponse<T> = {
  success: boolean;
  error?: string;
  data: T;
};

type AdminDashboardMetricsProps = {
  theme: "dark" | "light";
};

export default function AdminDashboardMetrics({ theme }: AdminDashboardMetricsProps) {
  const isDark = theme === "dark";
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [canViewBalance, setCanViewBalance] = useState(false);

  const cardBase = isDark ? "border-[#27464e] bg-[#0a1f27]/90" : "border-[#a8cdc8] bg-[#f3fffd]/95";
  const cardTitle = isDark ? "text-[#80bab3]" : "text-[#317a72]";
  const cardValue = isDark ? "text-[#dffbf7]" : "text-[#124247]";
  const cardText = isDark ? "text-[#9db8b4]" : "text-[#5a7f7b]";
  const panel = isDark ? "border-[#1f2d32] bg-[#08171d]/85" : "border-[#b6d3ce] bg-[#f5fffd]/90";
  const heading = isDark ? "text-[#f2fffd]" : "text-[#123a3f]";
  const tableHead = isDark ? "border-[#1d323a] text-[#8eb8b2]" : "border-[#c6dedb] text-[#4a7570]";
  const tableBody = isDark ? "text-[#d9efeb]" : "text-[#234f53]";
  const tableRow = isDark ? "border-[#14262d]" : "border-[#d5e8e5]";
  const emptyText = isDark ? "text-[#9db8b4]" : "text-[#5a7f7b]";

  const loadSession = async () => {
    try {
      const response = await fetch("/api/admin/security/me", { method: "GET", cache: "no-store" });
      const result: ApiResponse<{ roleName: string }> = await response.json();
      if (response.ok && result.success) {
        const roleName = result.data?.roleName ?? "";
        setIsSuperAdmin(roleName === "Super Admin");
        setCanViewBalance(roleName === "Manager" || roleName === "Super Admin");
      }
    } catch {
      setIsSuperAdmin(false);
      setCanViewBalance(false);
    }
  };

  const loadMetrics = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/dashboard/metrics", {
        method: "GET",
        cache: "no-store",
      });
      const result: ApiResponse<MetricsResponse> = await response.json();

      if (!response.ok || !result.success) {
        setError(result.error ?? "Failed to load dashboard metrics.");
        return;
      }

      setMetrics(result.data);
    } catch {
      setError("Failed to load dashboard metrics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
    loadSession();
  }, []);

  const handleReset = async () => {
    setResetting(true);
    setResetError("");
    setResetSuccess("");

    try {
      const response = await fetch("/api/admin/dashboard/reset", { method: "POST" });
      const result: ApiResponse<{ resetAt: string }> = await response.json();

      if (!response.ok || !result.success) {
        setResetError(result.error ?? "Failed to clear dashboard.");
        return;
      }

      setResetSuccess("Dashboard metrics cleared.");
      await loadMetrics();
    } catch {
      setResetError("Failed to clear dashboard.");
    } finally {
      setResetting(false);
    }
  };

  const summaryCards = useMemo(() => {
    return [
      {
        label: "New Clients (Week)",
        value: metrics?.newClientsWeek ?? 0,
        helper: "Registered since Monday",
      },
      {
        label: "New Clients (Month)",
        value: metrics?.newClientsMonth ?? 0,
        helper: "Registered since month start",
      },
      {
        label: "Cash Transactions (Week)",
        value: metrics?.cashTransactionsWeek ?? 0,
        helper: "Cash postings this week",
      },
      {
        label: "Transfer Transactions (Week)",
        value: metrics?.transferTransactionsWeek ?? 0,
        helper: "Transfers this week",
      },
    ];
  }, [metrics]);

  return (
    <section className="mb-8">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <article key={card.label} className={`rounded-2xl border p-5 ${cardBase}`}>
            <p className={`text-xs uppercase tracking-[0.2em] ${cardTitle}`}>{card.label}</p>
            <p className={`mt-3 text-3xl font-bold ${cardValue}`}>{card.value}</p>
            <p className={`mt-1 text-sm ${cardText}`}>{card.helper}</p>
          </article>
        ))}
      </div>

      <div className={`mt-6 rounded-2xl border p-5 backdrop-blur-md ${panel}`}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className={`text-lg font-semibold ${heading}`}>Top Transactions This Week</h2>
          {isSuperAdmin ? (
            <button
              type="button"
              onClick={handleReset}
              disabled={resetting}
              className={`rounded-xl border px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition-colors ${
                isDark
                  ? "border-[#35535b] bg-[#10252d] text-[#b9d9d4] hover:bg-[#183641]"
                  : "border-[#98c4be] bg-[#f8fffe] text-[#2c5f5a] hover:bg-[#eff9f7]"
              } ${resetting ? "opacity-70" : ""}`}
            >
              {resetting ? "Clearing..." : "Clear Dashboard"}
            </button>
          ) : null}
        </div>

        {resetError ? (
          <p className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {resetError}
          </p>
        ) : null}

        {resetSuccess ? (
          <p className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
            {resetSuccess}
          </p>
        ) : null}

        {error ? (
          <p className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </p>
        ) : null}

        <div className="overflow-x-auto">
          <table className="w-full min-w-190 border-collapse text-left text-sm">
            <thead>
              <tr className={`border-b ${tableHead}`}>
                <th className="px-3 py-2 font-medium">Date</th>
                <th className="px-3 py-2 font-medium">Type</th>
                <th className="px-3 py-2 font-medium">Direction</th>
                <th className="px-3 py-2 font-medium">Amount</th>
                <th className="px-3 py-2 font-medium">Account</th>
              </tr>
            </thead>
            <tbody className={tableBody}>
              {loading ? (
                <tr>
                  <td className={`px-3 py-6 ${emptyText}`} colSpan={5}>
                    Loading transactions...
                  </td>
                </tr>
              ) : metrics?.topTransactionsWeek?.length ? (
                metrics.topTransactionsWeek.map((transaction) => (
                  <tr key={transaction.transactionId} className={`border-b ${tableRow}`}>
                    <td className="px-3 py-3">{new Date(transaction.createdAt).toLocaleString()}</td>
                    <td className="px-3 py-3">{transaction.transactionType}</td>
                    <td className="px-3 py-3">{transaction.direction}</td>
                    <td className="px-3 py-3">{Number(transaction.amount).toFixed(2)}</td>
                    <td className="px-3 py-3">#{transaction.accountId}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className={`px-3 py-6 ${emptyText}`} colSpan={5}>
                    No transactions posted this week.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {canViewBalance ? (
        <div className={`mt-6 rounded-2xl border p-5 backdrop-blur-md ${panel}`}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className={`text-lg font-semibold ${heading}`}>Top Accounts by Balance</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-190 border-collapse text-left text-sm">
              <thead>
                <tr className={`border-b ${tableHead}`}>
                  <th className="px-3 py-2 font-medium">Account</th>
                  <th className="px-3 py-2 font-medium">Client</th>
                  <th className="px-3 py-2 font-medium">Balance</th>
                </tr>
              </thead>
              <tbody className={tableBody}>
                {loading ? (
                  <tr>
                    <td className={`px-3 py-6 ${emptyText}`} colSpan={3}>
                      Loading accounts...
                    </td>
                  </tr>
                ) : metrics?.topAccountsByBalance?.length ? (
                  metrics.topAccountsByBalance.map((account) => (
                    <tr key={account.accountId} className={`border-b ${tableRow}`}>
                      <td className="px-3 py-3">
                        {account.accountNumber} (#{account.accountId})
                      </td>
                      <td className="px-3 py-3">{account.clientId}</td>
                      <td className="px-3 py-3">{Number(account.balance ?? 0).toFixed(2)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className={`px-3 py-6 ${emptyText}`} colSpan={3}>
                      No accounts available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </section>
  );
}
