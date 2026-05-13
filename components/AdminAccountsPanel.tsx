"use client";

import { useEffect, useMemo, useState } from "react";

type Product = {
  productId: number;
  productName: string;
  interestRate: string | number | null;
  productType?: "Savings" | "Loan";
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
  balance: string | number;
  createdAt: string;
};

type ApiResponse<T> = {
  success: boolean;
  error?: string;
  data: T;
};

type AdminAccountsPanelProps = {
  theme: "dark" | "light";
  refreshKey?: number;
};

type CreateFormState = {
  branchId: string;
  clientId: string;
  productId: string;
};

type StatusFilter = "All" | AccountStatus;

const STATUS_FILTERS: StatusFilter[] = ["All", "Active", "Inactive", "Frozen", "Closed"];

export default function AdminAccountsPanel({ theme, refreshKey }: AdminAccountsPanelProps) {
  const isDark = theme === "dark";
  const [products, setProducts] = useState<Product[]>([]);
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [error, setError] = useState("");
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");
  const [canCreateAccount, setCanCreateAccount] = useState(false);
  const [canEditAccount, setCanEditAccount] = useState(false);
  const [canViewBalance, setCanViewBalance] = useState(false);
  const [editSuccess, setEditSuccess] = useState("");
  const [editingAccount, setEditingAccount] = useState<AccountRow | null>(null);
  const [editStatus, setEditStatus] = useState<AccountStatus>("Active");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [productFilter, setProductFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [createForm, setCreateForm] = useState<CreateFormState>({
    branchId: "",
    clientId: "",
    productId: "",
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

  const loadProducts = async () => {
    setLoadingProducts(true);
    setError("");

    try {
      const response = await fetch("/api/admin/products", { method: "GET", cache: "no-store" });
      const result: ApiResponse<Product[]> = await response.json();

      if (!response.ok || !result.success) {
        if (response.status !== 403 && result.error !== "Forbidden") {
          setError(result.error ?? "Failed to load products.");
        }
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
        if (response.status !== 403 && result.error !== "Forbidden") {
          setError(result.error ?? "Failed to load accounts.");
        }
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
  }, [refreshKey]);

  useEffect(() => {
    const loadPermissions = async () => {
      try {
        const response = await fetch("/api/admin/security/me", { method: "GET", cache: "no-store" });
        const result: ApiResponse<{ permissions: string[] }> = await response.json();
        if (response.ok && result?.success) {
          const permissionSet = new Set(result.data?.permissions ?? []);
          setCanCreateAccount(permissionSet.has("create_account"));
          setCanEditAccount(permissionSet.has("edit_account"));
          const roleName = result.data?.roleName ?? "";
          setCanViewBalance(roleName === "Manager" || roleName === "Super Admin");
        }
      } catch {
        setCanCreateAccount(false);
        setCanEditAccount(false);
        setCanViewBalance(false);
      }
    };

    loadPermissions();
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [statusFilter, productFilter]);

  const onSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    loadAccounts(search.trim());
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setCreateError("");
    setCreateSuccess("");
    setEditSuccess("");

    const branchId = Number(createForm.branchId);
    const clientId = Number(createForm.clientId);
    const productId = Number(createForm.productId);

    if (!Number.isInteger(branchId) || branchId <= 0) {
      setCreateError("Branch id must be a positive number.");
      return;
    }

    if (!Number.isInteger(clientId) || clientId <= 0) {
      setCreateError("Client id must be a positive number.");
      return;
    }

    if (!Number.isInteger(productId) || productId <= 0) {
      setCreateError("Product must be selected.");
      return;
    }

    try {
      const response = await fetch("/api/admin/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branchId, clientId, productId }),
      });

      const result: ApiResponse<{ accountId: number; accountNumber: string }> = await response.json();

      if (!response.ok || !result.success) {
        setCreateError(result.error ?? "Failed to create account.");
        return;
      }

      setCreateSuccess(`Account created: ${result.data.accountNumber}`);
      setCreateForm({ branchId: "", clientId: "", productId: "" });
      await loadAccounts();
    } catch {
      setCreateError("Failed to create account.");
    }
  };

  const filteredLabel = useMemo(() => {
    return `${accounts.length} result${accounts.length === 1 ? "" : "s"}`;
  }, [accounts.length]);

  const openEdit = (account: AccountRow) => {
    setEditingAccount(account);
    setEditStatus(account.status);
    setEditSuccess("");
  };

  const closeEdit = () => {
    setEditingAccount(null);
  };

  const saveEdit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingAccount) {
      return;
    }

    setEditSuccess("");
    setError("");

    try {
      const response = await fetch(`/api/admin/accounts/${editingAccount.accountId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: editStatus }),
      });
      const result: ApiResponse<unknown> = await response.json();

      if (!response.ok || !result.success) {
        setError(result.error ?? "Failed to update account.");
        return;
      }

      setEditSuccess("Account status updated successfully.");
      closeEdit();
      await loadAccounts();
    } catch {
      setError("Failed to update account.");
    }
  };

  return (
    <section className={`mt-8 rounded-2xl border p-5 backdrop-blur-md ${panel}`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className={`text-lg font-semibold ${heading}`}>Account Maintenance</h2>
        <span className={`rounded-full border px-3 py-1 text-xs ${badge}`}>{filteredLabel}</span>
      </div>

      {canCreateAccount ? (
        <form onSubmit={handleCreate} className="mb-5 grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
          <input
            type="number"
            min="1"
            placeholder="Branch ID"
            value={createForm.branchId}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, branchId: event.target.value }))}
            className={`rounded-xl border p-3 text-sm outline-none ${field}`}
          />
          <input
            type="number"
            min="1"
            placeholder="Client ID"
            value={createForm.clientId}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, clientId: event.target.value }))}
            className={`rounded-xl border p-3 text-sm outline-none ${field}`}
          />
          <select
            value={createForm.productId}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, productId: event.target.value }))}
            className={`rounded-xl border p-3 text-sm outline-none ${field}`}
            disabled={loadingProducts}
          >
            <option value="">Select product</option>
            {products.map((product) => (
              <option key={product.productId} value={product.productId}>
                {product.productName}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-xl bg-[#2dc7b8] px-4 py-3 text-sm font-semibold text-[#03272b] transition-colors hover:bg-[#43ded0]"
          >
            Create Account
          </button>
        </form>
      ) : null}

      {createError ? (
        <p className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {createError}
        </p>
      ) : null}

      {createSuccess ? (
        <p className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
          {createSuccess}
        </p>
      ) : null}

      {editSuccess ? (
        <p className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
          {editSuccess}
        </p>
      ) : null}

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
                {canViewBalance ? <th className="px-3 py-2 font-medium">Balance</th> : null}
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Created</th>
              {canEditAccount ? <th className="px-3 py-2 font-medium">Actions</th> : null}
            </tr>
          </thead>
          <tbody className={tableBody}>
            {loading ? (
              <tr>
                <td className={`px-3 py-6 ${emptyText}`} colSpan={canEditAccount ? 8 : 7}>
                  Loading accounts...
                </td>
              </tr>
            ) : accounts.length === 0 ? (
              <tr>
                <td className={`px-3 py-6 ${emptyText}`} colSpan={canEditAccount ? 8 : 7}>
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
                  {canViewBalance ? (
                    <td className="px-3 py-3">{Number(account.balance ?? 0).toFixed(2)}</td>
                  ) : null}
                  <td className="px-3 py-3">{account.status}</td>
                  <td className="px-3 py-3">{new Date(account.createdAt).toLocaleString()}</td>
                  {canEditAccount ? (
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        onClick={() => openEdit(account)}
                        className="rounded-lg border border-[#406089] bg-[#122339] px-3 py-1 text-xs font-semibold text-[#bfddff] transition-colors hover:bg-[#1b3452]"
                      >
                        Edit
                      </button>
                    </td>
                  ) : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editingAccount ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/55" onClick={closeEdit} />
          <section
            className={`relative z-10 w-full max-w-md rounded-2xl border p-5 backdrop-blur-xl ${
              isDark ? "border-[#2a4450] bg-[#081822]/95" : "border-[#b8d2ce] bg-[#f9fffd]/95"
            }`}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className={`text-xs uppercase tracking-[0.22em] ${isDark ? "text-[#8bc6c0]" : "text-[#317a72]"}`}>
                  Edit Account Status
                </p>
                <h3 className={`mt-1 text-xl font-bold ${heading}`}>{editingAccount.accountNumber}</h3>
              </div>
              <button
                type="button"
                onClick={closeEdit}
                className={`rounded-lg border px-2.5 py-1 text-sm ${
                  isDark ? "border-[#35535b] text-[#b9d9d4]" : "border-[#a8c9c4] text-[#2b6460]"
                }`}
              >
                Close
              </button>
            </div>

            <form onSubmit={saveEdit} className="space-y-3">
              <select
                value={editStatus}
                onChange={(event) => setEditStatus(event.target.value as AccountStatus)}
                className={`rounded-xl border p-3 text-sm outline-none ${field}`}
              >
                {STATUS_FILTERS.filter((status) => status !== "All").map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                placeholder="Branch ID"
                value={editingAccount.branchId}
                onChange={(event) =>
                  setEditingAccount((prev) =>
                    prev ? { ...prev, branchId: Number(event.target.value) } : prev
                  )
                }
                className={`rounded-xl border p-3 text-sm outline-none ${field}`}
              />
              <button
                type="submit"
                className="rounded-xl bg-[#2dc7b8] px-4 py-3 text-sm font-semibold text-[#03272b] transition-colors hover:bg-[#43ded0]"
              >
                Save Status
              </button>
            </form>
          </section>
        </div>
      ) : null}
    </section>
  );
}
