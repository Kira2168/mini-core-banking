"use client";

import { useEffect, useMemo, useState } from "react";

type Product = {
  productId: number;
  productName: string;
};

type AccountStatus = "Active" | "Inactive" | "Frozen" | "Closed";

type AccountRow = {
  accountId: number;
  accountNumber: string;
  clientId: number;
  productId: number;
  productName: string;
  branchId: number;
  status: AccountStatus;
  balance: string | number | null;
  createdAt: string;
};

type ApiResponse<T> = {
  success: boolean;
  error?: string;
  data: T;
};

type AdminBalancesPanelProps = {
  theme: "dark" | "light";
};

type StatusFilter = "All" | AccountStatus;

const STATUS_FILTERS: StatusFilter[] = ["All", "Active", "Inactive", "Frozen", "Closed"];

export default function AdminBalancesPanel({ theme }: AdminBalancesPanelProps) {
  const isDark = theme === "dark";
  const [products, setProducts] = useState<Product[]>([]);
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [productFilter, setProductFilter] = useState("All");
  const [search, setSearch] = useState("");

  const panel = isDark ? "border-[#1f2d32] bg-[#08171d]/85" : "border-[#b6d3ce] bg-[#f5fffd]/90";
  const heading = isDark ? "text-[#f2fffd]" : "text-[#123a3f]";
  const badge = isDark
    ? "border-[#27464e] bg-[#0d232b] text-[#8eb8b2]"
    : "border-[#a7cfc9] bg-[#ebf9f7] text-[#386f68]";
  const field = isDark
    ? "border-[#22414d] bg-[#0a2029] text-[#e6f4f2] focus:border-[#2dc7b8]"
    : "border-[#a6cbc6] bg-[#fbfffe] text-[#173d42] focus:border-[#1ea696]";
  const tableHead = isDark ? "border-[#1d323a] text-[#8eb8b2]" : "border-[#c6dedb] text-[#4a7570]";
  const tableBody = isDark ? "text-[#d9efeb]" : "text-[#234f53]";
  const tableRow = isDark ? "border-[#14262d]" : "border-[#d5e8e5]";
  const emptyText = isDark ? "text-[#9db8b4]" : "text-[#5a7f7b]";

  const loadProducts = async () => {
    setLoadingProducts(true);
    setError("");

    try {
      const response = await fetch("/api/admin/products", { method: "GET", cache: "no-store" });
      const result: ApiResponse<Product[]> = await response.json();

      if (!response.ok || !result.success) {
        setError(result.error ?? "Failed to load products.");
        return;
      }

      setProducts(result.data);
    } catch {
      setError("Failed to load products.");
    } finally {
      setLoadingProducts(false);
    }
  };

  const loadAccounts = async (overrideSearch?: string) => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        status: statusFilter,
        search: overrideSearch ?? search,
        limit: "250",
      });

      if (productFilter !== "All") {
        params.set("productId", productFilter);
      }

      const response = await fetch(`/api/admin/accounts?${params.toString()}`, {
        method: "GET",
        cache: "no-store",
      });

      const result: ApiResponse<AccountRow[]> = await response.json();

      if (!response.ok || !result.success) {
        setError(result.error ?? "Failed to load accounts.");
        return;
      }

      setAccounts(result.data);
    } catch {
      setError("Failed to load accounts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [statusFilter, productFilter]);

  const onSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    loadAccounts(search.trim());
  };

  const filteredLabel = useMemo(() => {
    return `${accounts.length} result${accounts.length === 1 ? "" : "s"}`;
  }, [accounts.length]);

  return (
    <section className={`mt-8 rounded-2xl border p-5 backdrop-blur-md ${panel}`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className={`text-lg font-semibold ${heading}`}>Account Balances</h2>
        <span className={`rounded-full border px-3 py-1 text-xs ${badge}`}>{filteredLabel}</span>
      </div>

      {error ? (
        <p className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      <form onSubmit={onSearchSubmit} className="mb-4 grid gap-3 md:grid-cols-4">
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
          className={`rounded-xl border p-3 text-sm outline-none ${field}`}
        >
          {STATUS_FILTERS.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        <select
          value={productFilter}
          onChange={(event) => setProductFilter(event.target.value)}
          className={`rounded-xl border p-3 text-sm outline-none ${field}`}
          disabled={loadingProducts}
        >
          <option value="All">All Products</option>
          {products.map((product) => (
            <option key={product.productId} value={product.productId}>
              {product.productName}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Search account no or client id"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className={`rounded-xl border p-3 text-sm outline-none ${field}`}
        />

        <button
          type="submit"
          className="rounded-xl bg-[#2dc7b8] px-4 py-3 text-sm font-semibold text-[#03272b] transition-colors hover:bg-[#43ded0]"
        >
          Apply Filters
        </button>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full min-w-190 border-collapse text-left text-sm">
          <thead>
            <tr className={`border-b ${tableHead}`}>
              <th className="px-3 py-2 font-medium">Account No</th>
              <th className="px-3 py-2 font-medium">Client ID</th>
              <th className="px-3 py-2 font-medium">Product</th>
              <th className="px-3 py-2 font-medium">Branch</th>
              <th className="px-3 py-2 font-medium">Balance</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Created</th>
            </tr>
          </thead>
          <tbody className={tableBody}>
            {loading ? (
              <tr>
                <td className={`px-3 py-6 ${emptyText}`} colSpan={7}>
                  Loading accounts...
                </td>
              </tr>
            ) : accounts.length === 0 ? (
              <tr>
                <td className={`px-3 py-6 ${emptyText}`} colSpan={7}>
                  No accounts found for your selection.
                </td>
              </tr>
            ) : (
              accounts.map((account) => (
                <tr key={account.accountId} className={`border-b ${tableRow}`}>
                  <td className="px-3 py-3">{account.accountNumber}</td>
                  <td className="px-3 py-3">{account.clientId}</td>
                  <td className="px-3 py-3">{account.productName}</td>
                  <td className="px-3 py-3">{account.branchId}</td>
                  <td className="px-3 py-3">{Number(account.balance ?? 0).toFixed(2)}</td>
                  <td className="px-3 py-3">{account.status}</td>
                  <td className="px-3 py-3">{new Date(account.createdAt).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
