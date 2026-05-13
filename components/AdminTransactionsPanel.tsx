"use client";

import { useEffect, useMemo, useState } from "react";
import { GState, jsPDF } from "jspdf";

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

type ReceiptPayload =
  | {
      type: "Cash";
      direction: "Credit" | "Debit";
      amount: number;
      accountId: number;
      accountNumber: string;
      clientName: string;
      reference: string | null;
      transactionId: number;
      newBalance: number;
      createdAt: string;
    }
  | {
      type: "Transfer";
      amount: number;
      fromAccountId: number;
      fromAccountNumber: string;
      fromClientName: string;
      toAccountId: number;
      toAccountNumber: string;
      toClientName: string;
      reference: string | null;
      transferId: number;
      feeAmount: number;
      fromBalance: number;
      toBalance: number;
      createdAt: string;
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
  const [receipt, setReceipt] = useState<ReceiptPayload | null>(null);
  const [clearSuccess, setClearSuccess] = useState("");
  const [clearing, setClearing] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
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

  const loadSession = async () => {
    try {
      const response = await fetch("/api/admin/security/me", { method: "GET", cache: "no-store" });
      const result: ApiResponse<{ roleName: string }> = await response.json();
      if (response.ok && result.success) {
        setIsSuperAdmin(result.data?.roleName === "Super Admin");
      }
    } catch {
      setIsSuperAdmin(false);
    }
  };

  useEffect(() => {
    loadTransactions();
    loadSession();
  }, [typeFilter]);

  const clearTransactions = async () => {
    setClearing(true);
    setClearSuccess("");
    setError("");

    try {
      const response = await fetch("/api/admin/transactions/reset", { method: "POST" });
      const result: ApiResponse<{ resetAt: string }> = await response.json();

      if (!response.ok || !result.success) {
        setError(result.error ?? "Failed to clear transactions.");
        return;
      }

      setClearSuccess("Transaction history cleared.");
      await loadTransactions();
    } catch {
      setError("Failed to clear transactions.");
    } finally {
      setClearing(false);
    }
  };

  const onFilterSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    loadTransactions(accountFilter);
  };

  const postCash = async (event: React.FormEvent) => {
    event.preventDefault();
    setPostError("");
    setPostSuccess("");
    setReceipt(null);

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
      const summary = await fetchAccountSummary(accountId);
      setReceipt({
        type: "Cash",
        direction: cashForm.direction,
        amount,
        accountId,
        accountNumber: summary.accountNumber,
        clientName: summary.clientName,
        reference: cashForm.reference.trim() || null,
        transactionId: result.data.transactionId,
        newBalance: result.data.newBalance,
        createdAt: new Date().toISOString(),
      });
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
    setReceipt(null);

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

      const result: ApiResponse<{ transferId: number; feeAmount: number; fromBalance: number; toBalance: number }> =
        await response.json();

      if (!response.ok || !result.success) {
        setPostError(result.error ?? "Failed to post transfer transaction.");
        return;
      }

      setPostSuccess("Transfer posted successfully.");
      const [fromSummary, toSummary] = await Promise.all([
        fetchAccountSummary(fromAccountId),
        fetchAccountSummary(toAccountId),
      ]);
      setReceipt({
        type: "Transfer",
        amount,
        fromAccountId,
        fromAccountNumber: fromSummary.accountNumber,
        fromClientName: fromSummary.clientName,
        toAccountId,
        toAccountNumber: toSummary.accountNumber,
        toClientName: toSummary.clientName,
        reference: transferForm.reference.trim() || null,
        transferId: result.data.transferId,
        feeAmount: result.data.feeAmount,
        fromBalance: result.data.fromBalance,
        toBalance: result.data.toBalance,
        createdAt: new Date().toISOString(),
      });
      setTransferForm({ fromAccountId: "", toAccountId: "", amount: "", reference: "" });
      await loadTransactions();
    } catch {
      setPostError("Failed to post transfer transaction.");
    }
  };

  const filteredLabel = useMemo(() => {
    return `${transactions.length} result${transactions.length === 1 ? "" : "s"}`;
  }, [transactions.length]);

  const loadImageDataUrl = async (src: string) => {
    const response = await fetch(src);
    if (!response.ok) {
      return null;
    }
    const blob = await response.blob();
    return new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  };

  const downloadReceipt = async () => {
    if (!receipt) {
      return;
    }

    const doc = new jsPDF();
    const lines: string[] = [];

    const [logoDataUrl, backgroundDataUrl] = await Promise.all([
      loadImageDataUrl("/logo.png"),
      loadImageDataUrl("/bank.jpg"),
    ]);

    if (backgroundDataUrl) {
      doc.addImage(backgroundDataUrl, "JPEG", 0, 0, 210, 297, undefined, "FAST");
      doc.setGState(new GState({ opacity: 0.3 }));
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, 210, 297, "F");
      doc.setGState(new GState({ opacity: 1 }));
    }

    doc.setFillColor(6, 34, 41);
    doc.rect(0, 0, 210, 30, "F");
    doc.setTextColor(240, 255, 253);
    doc.setFontSize(14);
    const headerTextX = logoDataUrl ? 34 : 14;
    doc.text("LITTLE Mini Banking System", headerTextX, 18);

    if (logoDataUrl) {
      doc.addImage(logoDataUrl, "PNG", 14, 7, 16, 16, undefined, "FAST");
    }

    doc.setFillColor(248, 255, 253);
    doc.roundedRect(12, 40, 186, 210, 6, 6, "F");
    doc.setDrawColor(209, 231, 227);
    doc.roundedRect(12, 40, 186, 210, 6, 6, "S");

    doc.setTextColor(20, 55, 59);
    doc.setFontSize(16);
    doc.text("Transaction Receipt", 18, 56);

    doc.setDrawColor(198, 222, 219);
    doc.line(18, 60, 190, 60);

    lines.push(`Type: ${receipt.type}`);
    lines.push(`Date: ${new Date(receipt.createdAt).toLocaleString()}`);

    if (receipt.type === "Cash") {
      lines.push(`Transaction ID: ${receipt.transactionId}`);
      lines.push(`Direction: ${receipt.direction}`);
      lines.push(`Account No: ${receipt.accountNumber}`);
      lines.push(`Client: ${receipt.clientName}`);
      lines.push(`Amount: ${receipt.amount.toFixed(2)}`);
      lines.push("Fee: 0.00");
      lines.push(`New Balance: ${receipt.newBalance.toFixed(2)}`);
      if (receipt.reference) {
        lines.push(`Reference: ${receipt.reference}`);
      }
    } else {
      lines.push(`Transfer ID: ${receipt.transferId}`);
      lines.push(`From Account No: ${receipt.fromAccountNumber}`);
      lines.push(`From Client: ${receipt.fromClientName}`);
      lines.push(`To Account No: ${receipt.toAccountNumber}`);
      lines.push(`To Client: ${receipt.toClientName}`);
      lines.push(`Amount: ${receipt.amount.toFixed(2)}`);
      lines.push(`Fee: ${receipt.feeAmount.toFixed(2)}`);
      lines.push(`From Balance: ${receipt.fromBalance.toFixed(2)}`);
      lines.push(`To Balance: ${receipt.toBalance.toFixed(2)}`);
      if (receipt.reference) {
        lines.push(`Reference: ${receipt.reference}`);
      }
    }

    const left = 18;
    let top = 72;
    doc.setFontSize(11.5);
    doc.setTextColor(26, 64, 68);
    lines.forEach((line) => {
      doc.text(line, left, top);
      top += 8;
    });

    doc.setTextColor(200, 40, 40);
    doc.setFontSize(26);
    doc.text("PAID", 150, 92, { angle: 20 });

    doc.setDrawColor(30, 108, 116);
    doc.setLineWidth(0.6);
    doc.circle(158, 210, 18, "S");
    doc.setFontSize(8.5);
    doc.setTextColor(30, 108, 116);
    doc.text("LITTLE MINI", 150, 207, { angle: 0 });
    doc.text("BANKING SYSTEM", 147, 212, { angle: 0 });

    doc.setFontSize(10);
    doc.setTextColor(120, 142, 139);
    doc.text("Generated by LITTLE Mini Banking System", 14, 285);

    doc.save(`receipt-${receipt.type.toLowerCase()}-${Date.now()}.pdf`);
  };

  const fetchAccountSummary = async (accountId: number) => {
    const response = await fetch(`/api/admin/accounts/${accountId}`, { method: "GET", cache: "no-store" });
    const result: ApiResponse<{ accountNumber: string; clientName: string }> = await response.json();
    if (!response.ok || !result.success) {
      return { accountNumber: String(accountId), clientName: "Client" };
    }
    return {
      accountNumber: result.data.accountNumber ?? String(accountId),
      clientName: result.data.clientName ?? "Client",
    };
  };

  return (
    <section className={`mt-8 rounded-2xl border p-5 backdrop-blur-md ${panel}`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className={`text-lg font-semibold ${heading}`}>Transactions</h2>
        <span className={`rounded-full border px-3 py-1 text-xs ${badge}`}>{filteredLabel}</span>
        {isSuperAdmin ? (
          <button
            type="button"
            onClick={clearTransactions}
            disabled={clearing}
            className={`rounded-xl border px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition-colors ${
              isDark
                ? "border-[#35535b] bg-[#10252d] text-[#b9d9d4] hover:bg-[#183641]"
                : "border-[#98c4be] bg-[#f8fffe] text-[#2c5f5a] hover:bg-[#eff9f7]"
            } ${clearing ? "opacity-70" : ""}`}
          >
            {clearing ? "Clearing..." : "Clear History"}
          </button>
        ) : null}
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
              placeholder="Account ID or Number"
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
              placeholder="From Account ID or Number"
              value={transferForm.fromAccountId}
              onChange={(event) => setTransferForm((prev) => ({ ...prev, fromAccountId: event.target.value }))}
              className={`rounded-xl border p-3 text-sm outline-none ${field}`}
            />
            <input
              type="number"
              min="1"
              placeholder="To Account ID or Number"
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
        <div className="mb-4 mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>{postSuccess}</span>
            {receipt ? (
                  <button
                    type="button"
                    onClick={downloadReceipt}
                className="rounded-lg border border-emerald-200/40 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-100 transition-colors hover:bg-emerald-400/20"
              >
                Download PDF
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {clearSuccess ? (
        <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
          {clearSuccess}
        </div>
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
