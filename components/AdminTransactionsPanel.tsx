"use client";

import { useEffect, useMemo, useState } from "react";

type TransactionRow = {
  transactionId: number;
  transactionType: "Cash" | "Transfer";
  direction: "Credit" | "Debit";
  amount: string | number;
  reference: string | null;
  createdAt: string;
  accountId: number;
  accountNumber: string;
  clientId: number;
  productId: number;
  productName: string;
};

type ApiResponse<T> = {
  success: boolean;
  error?: string;
  data: T;
};

type AdminTransactionsPanelProps = {
  theme: "dark" | "light";
};

type CashFormState = {
  accountId: string;
  direction: "Credit" | "Debit";
  amount: string;
  reference: string;
};

type TransferFormState = {
  fromAccountId: string;
  toAccountId: string;
  amount: string;
  reference: string;
};

type TypeFilter = "All" | "Cash" | "Transfer";

const TYPE_FILTERS: TypeFilter[] = ["All", "Cash", "Transfer"];

export default function AdminTransactionsPanel({ theme }: AdminTransactionsPanelProps) {
  const isDark = theme === "dark";
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [postError, setPostError] = useState("");
  const [postSuccess, setPostSuccess] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("All");
  const [accountFilter, setAccountFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [cashForm, setCashForm] = useState<CashFormState>({
    accountId: "",
    direction: "Credit",
    amount: "",
    reference: "",
  });
  const [transferForm, setTransferForm] = useState<TransferFormState>({
    fromAccountId: "",
    toAccountId: "",
    amount: "",
    reference: "",
  });

  const panel = isDark ? "border-[#1f2d32] bg-[#08171d]/85" : "border-[#b6d3ce] bg-[#f5fffd]/90";
  const heading = isDark ? "text-[#f2fffd]" : "text-[#123a3f]";
  const badge = isDark ? "border-[#27464e] bg-[#0d232b] text-[#8eb8b2]" : "border-[#a7cfc9] bg-[#ebf9f7] text-[#386f68]";
  const field = isDark
    ? "border-[#22414d] bg-[#0a2029] text-[#e6f4f2] focus:border-[#2dc7b8]"
    : "border-[#a6cbc6] bg-[#fbfffe] text-[#173d42] focus:border-[#1ea696]";
  const tableHead = isDark ? "border-[#1d323a] text-[#8eb8b2]" : "border-[#c6dedb] text-[#4a7570]";
  const tableBody = isDark ? "text-[#d9efeb]" : "text-[#234f53]";
  const tableRow = isDark ? "border-[#14262d]" : "border-[#d5e8e5]";
  const emptyText = isDark ? "text-[#9db8b4]" : "text-[#5a7f7b]";

  const loadTransactions = async (overrideAccount?: string) => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        type: typeFilter,
        limit: "250",
      });

      const accountIdValue = (overrideAccount ?? accountFilter).trim();
      if (accountIdValue) {
        params.set("accountId", accountIdValue);
      }

      if (startDate) {
        params.set("startDate", startDate);
      }

      if (endDate) {
        params.set("endDate", endDate);
      }

      const response = await fetch(`/api/admin/transactions?${params.toString()}`, {
        method: "GET",
        cache: "no-store",
      });
      const result: ApiResponse<TransactionRow[]> = await response.json();

      if (!response.ok || !result.success) {
        setError(result.error ?? "Failed to load transactions.");
        return;
      }

      setTransactions(result.data);
    } catch {
      setError("Failed to load transactions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [typeFilter]);

  const onFilterSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    loadTransactions(accountFilter);
  };

  const postCash = async (event: React.FormEvent) => {
    event.preventDefault();
    setPostError("");
    setPostSuccess("");

    const accountId = Number(cashForm.accountId);
    const amount = Number(cashForm.amount);

    if (!Number.isInteger(accountId) || accountId <= 0) {
      setPostError("Account id must be a positive number.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setPostError("Amount must be greater than zero.");
      return;
    }

    try {
      const response = await fetch("/api/admin/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId,
          direction: cashForm.direction,
          amount,
          reference: cashForm.reference.trim() || null,
        }),
      });

      const result: ApiResponse<{ transactionId: number; newBalance: number }> = await response.json();

      if (!response.ok || !result.success) {
        setPostError(result.error ?? "Failed to post cash transaction.");
        return;
      }

      setPostSuccess(`Cash ${cashForm.direction.toLowerCase()} posted. New balance: ${result.data.newBalance.toFixed(2)}`);
      setCashForm({ accountId: "", direction: "Credit", amount: "", reference: "" });
      await loadTransactions();
    } catch {
      setPostError("Failed to post cash transaction.");
    }
  };

  const postTransfer = async (event: React.FormEvent) => {
    event.preventDefault();
    setPostError("");
    setPostSuccess("");

    const fromAccountId = Number(transferForm.fromAccountId);
    const toAccountId = Number(transferForm.toAccountId);
    const amount = Number(transferForm.amount);

    if (!Number.isInteger(fromAccountId) || fromAccountId <= 0) {
      setPostError("From account id must be a positive number.");
      return;
    }

    if (!Number.isInteger(toAccountId) || toAccountId <= 0) {
      setPostError("To account id must be a positive number.");
      return;
    }

    if (fromAccountId === toAccountId) {
      setPostError("From and to accounts must be different.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setPostError("Amount must be greater than zero.");
      return;
    }

    try {
      const response = await fetch("/api/admin/transactions/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromAccountId,
          toAccountId,
          amount,
          reference: transferForm.reference.trim() || null,
        }),
      });

      const result: ApiResponse<{ transferId: number }> = await response.json();

      if (!response.ok || !result.success) {
        setPostError(result.error ?? "Failed to post transfer transaction.");
        return;
      }

      setPostSuccess("Transfer posted successfully.");
      setTransferForm({ fromAccountId: "", toAccountId: "", amount: "", reference: "" });
      await loadTransactions();
    } catch {
      setPostError("Failed to post transfer transaction.");
    }
  };

  const filteredLabel = useMemo(() => {
    return `${transactions.length} result${transactions.length === 1 ? "" : "s"}`;
  }, [transactions.length]);

  return (
    <section className={`mt-8 rounded-2xl border p-5 backdrop-blur-md ${panel}`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className={`text-lg font-semibold ${heading}`}>Transactions</h2>
        <span className={`rounded-full border px-3 py-1 text-xs ${badge}`}>{filteredLabel}</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <form onSubmit={postCash} className="space-y-3 rounded-2xl border border-dashed border-[#2a4a52] p-4">
          <p className={`text-xs uppercase tracking-[0.2em] ${isDark ? "text-[#8bc6c0]" : "text-[#317a72]"}`}>
            Cash Transaction
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            <input
              type="number"
              min="1"
              placeholder="Account ID"
              value={cashForm.accountId}
              onChange={(event) => setCashForm((prev) => ({ ...prev, accountId: event.target.value }))}
              className={`rounded-xl border p-3 text-sm outline-none ${field}`}
            />
            <select
              value={cashForm.direction}
              onChange={(event) =>
                setCashForm((prev) => ({ ...prev, direction: event.target.value as "Credit" | "Debit" }))
              }
              className={`rounded-xl border p-3 text-sm outline-none ${field}`}
            >
              <option value="Credit">Credit (+)</option>
              <option value="Debit">Debit (-)</option>
            </select>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="Amount"
              value={cashForm.amount}
              onChange={(event) => setCashForm((prev) => ({ ...prev, amount: event.target.value }))}
              className={`rounded-xl border p-3 text-sm outline-none ${field}`}
            />
            <input
              type="text"
              placeholder="Reference (optional)"
              value={cashForm.reference}
              onChange={(event) => setCashForm((prev) => ({ ...prev, reference: event.target.value }))}
              className={`rounded-xl border p-3 text-sm outline-none ${field}`}
            />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-[#2dc7b8] px-4 py-3 text-sm font-semibold text-[#03272b] transition-colors hover:bg-[#43ded0]"
          >
            Post Cash
          </button>
        </form>

        <form onSubmit={postTransfer} className="space-y-3 rounded-2xl border border-dashed border-[#2a4a52] p-4">
          <p className={`text-xs uppercase tracking-[0.2em] ${isDark ? "text-[#8bc6c0]" : "text-[#317a72]"}`}>
            Transfer Transaction
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            <input
              type="number"
              min="1"
              placeholder="From Account ID"
              value={transferForm.fromAccountId}
              onChange={(event) => setTransferForm((prev) => ({ ...prev, fromAccountId: event.target.value }))}
              className={`rounded-xl border p-3 text-sm outline-none ${field}`}
            />
            <input
              type="number"
              min="1"
              placeholder="To Account ID"
              value={transferForm.toAccountId}
              onChange={(event) => setTransferForm((prev) => ({ ...prev, toAccountId: event.target.value }))}
              className={`rounded-xl border p-3 text-sm outline-none ${field}`}
            />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="Amount"
              value={transferForm.amount}
              onChange={(event) => setTransferForm((prev) => ({ ...prev, amount: event.target.value }))}
              className={`rounded-xl border p-3 text-sm outline-none ${field}`}
            />
            <input
              type="text"
              placeholder="Reference (optional)"
              value={transferForm.reference}
              onChange={(event) => setTransferForm((prev) => ({ ...prev, reference: event.target.value }))}
              className={`rounded-xl border p-3 text-sm outline-none ${field}`}
            />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-[#2dc7b8] px-4 py-3 text-sm font-semibold text-[#03272b] transition-colors hover:bg-[#43ded0]"
          >
            Post Transfer
          </button>
        </form>
      </div>

      {postError ? (
        <p className="mb-4 mt-4 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {postError}
        </p>
      ) : null}

      {postSuccess ? (
        <p className="mb-4 mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
          {postSuccess}
        </p>
      ) : null}

      {error ? (
        <p className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      <form onSubmit={onFilterSubmit} className="mb-4 grid gap-3 md:grid-cols-6">
        <select
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value as TypeFilter)}
          className={`rounded-xl border p-3 text-sm outline-none ${field}`}
        >
          {TYPE_FILTERS.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        <input
          type="number"
          min="1"
          placeholder="Filter by account id"
          value={accountFilter}
          onChange={(event) => setAccountFilter(event.target.value)}
          className={`rounded-xl border p-3 text-sm outline-none ${field}`}
        />
        <input
          type="date"
          value={startDate}
          onChange={(event) => setStartDate(event.target.value)}
          className={`rounded-xl border p-3 text-sm outline-none ${field}`}
        />
        <input
          type="date"
          value={endDate}
          onChange={(event) => setEndDate(event.target.value)}
          className={`rounded-xl border p-3 text-sm outline-none ${field}`}
        />
        <div className="md:col-span-2">
          <button
            type="submit"
            className="w-full rounded-xl bg-[#2dc7b8] px-4 py-3 text-sm font-semibold text-[#03272b] transition-colors hover:bg-[#43ded0]"
          >
            Apply Filters
          </button>
        </div>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full min-w-190 border-collapse text-left text-sm">
          <thead>
            <tr className={`border-b ${tableHead}`}>
              <th className="px-3 py-2 font-medium">Date</th>
              <th className="px-3 py-2 font-medium">Type</th>
              <th className="px-3 py-2 font-medium">Direction</th>
              <th className="px-3 py-2 font-medium">Amount</th>
              <th className="px-3 py-2 font-medium">Account</th>
              <th className="px-3 py-2 font-medium">Client</th>
              <th className="px-3 py-2 font-medium">Product</th>
              <th className="px-3 py-2 font-medium">Reference</th>
            </tr>
          </thead>
          <tbody className={tableBody}>
            {loading ? (
              <tr>
                <td className={`px-3 py-6 ${emptyText}`} colSpan={8}>
                  Loading transactions...
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td className={`px-3 py-6 ${emptyText}`} colSpan={8}>
                  No transactions yet.
                </td>
              </tr>
            ) : (
              transactions.map((transaction) => (
                <tr key={transaction.transactionId} className={`border-b ${tableRow}`}>
                  <td className="px-3 py-3">{new Date(transaction.createdAt).toLocaleString()}</td>
                  <td className="px-3 py-3">{transaction.transactionType}</td>
                  <td className="px-3 py-3">{transaction.direction}</td>
                  <td className="px-3 py-3">{Number(transaction.amount).toFixed(2)}</td>
                  <td className="px-3 py-3">
                    {transaction.accountNumber} (#{transaction.accountId})
                  </td>
                  <td className="px-3 py-3">{transaction.clientId}</td>
                  <td className="px-3 py-3">{transaction.productName}</td>
                  <td className="px-3 py-3">{transaction.reference ?? "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
