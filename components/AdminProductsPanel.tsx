"use client";

import { useEffect, useMemo, useState } from "react";

type Product = {
  productId: number;
  productName: string;
  interestRate: string | number | null;
  productType: "Savings" | "Loan";
  activeFrom: string;
  expiryDate: string | null;
  minimumBalance: string | number;
  createdAt?: string;
};

type EditFormState = {
  productName: string;
  interestRate: string;
  productType: "Savings" | "Loan";
  activeFrom: string;
  expiryDate: string;
  minimumBalance: string;
};

type ApiResponse<T> = {
  success: boolean;
  error?: string;
  data: T;
};

type AdminProductsPanelProps = {
  theme: "dark" | "light";
  onProductCreated?: () => void;
};

type CreateFormState = {
  productName: string;
  interestRate: string;
  productType: "Savings" | "Loan";
  activeFrom: string;
  expiryDate: string;
  minimumBalance: string;
};

export default function AdminProductsPanel({ theme, onProductCreated }: AdminProductsPanelProps) {
  const isDark = theme === "dark";
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState<EditFormState | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [form, setForm] = useState<CreateFormState>({
    productName: "",
    interestRate: "0",
    productType: "Savings",
    activeFrom: "",
    expiryDate: "",
    minimumBalance: "0",
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
  const editBtnClass = isDark
    ? "rounded-lg border border-[#406089] bg-[#122339] px-3 py-1 text-xs font-semibold text-[#bfddff] transition-colors hover:bg-[#1b3452]"
    : "rounded-lg border border-[#abc9ec] bg-[#eaf4ff] px-3 py-1 text-xs font-semibold text-[#1f4c7a] transition-colors hover:bg-[#dbeafc]";
  const deleteBtnClass = isDark
    ? "rounded-lg border border-red-600/50 bg-red-700/20 px-3 py-1 text-xs font-semibold text-red-200 transition-colors hover:bg-red-700/35"
    : "rounded-lg border border-red-300 bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 transition-colors hover:bg-red-200";

  const loadProducts = async () => {
    setLoading(true);
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
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setCreateError("");
    setCreateSuccess("");

    const productName = form.productName.trim();
    const interestRate = Number(form.interestRate);
    const minimumBalance = Number(form.minimumBalance);

    if (!productName) {
      setCreateError("Product name is required.");
      return;
    }

    if (!Number.isFinite(interestRate) || interestRate < 0) {
      setCreateError("Interest rate must be a valid number.");
      return;
    }

    if (!form.activeFrom) {
      setCreateError("Active from date is required.");
      return;
    }

    if (form.expiryDate && form.expiryDate < form.activeFrom) {
      setCreateError("Expiry date cannot be before active from date.");
      return;
    }

    if (!Number.isFinite(minimumBalance) || minimumBalance < 0) {
      setCreateError("Minimum balance must be a valid number.");
      return;
    }

    try {
      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName,
          interestRate,
          productType: form.productType,
          activeFrom: form.activeFrom,
          expiryDate: form.expiryDate || null,
          minimumBalance,
        }),
      });

      const result: ApiResponse<Product> = await response.json();

      if (!response.ok || !result.success) {
        setCreateError(result.error ?? "Failed to create product.");
        return;
      }

      setCreateSuccess(`Product created: ${result.data.productName}`);
      setForm({
        productName: "",
        interestRate: "0",
        productType: "Savings",
        activeFrom: "",
        expiryDate: "",
        minimumBalance: "0",
      });
      await loadProducts();
      onProductCreated?.();
    } catch {
      setCreateError("Failed to create product.");
    }
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setEditForm({
      productName: product.productName ?? "",
      interestRate: String(product.interestRate ?? 0),
      productType: product.productType ?? "Savings",
      activeFrom: product.activeFrom ? product.activeFrom.slice(0, 10) : "",
      expiryDate: product.expiryDate ? product.expiryDate.slice(0, 10) : "",
      minimumBalance: String(product.minimumBalance ?? 0),
    });
  };

  const closeEditModal = () => {
    setEditingProduct(null);
    setEditForm(null);
    setSavingEdit(false);
  };

  const saveEdit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!editingProduct || !editForm) {
      return;
    }

    setSavingEdit(true);
    setCreateError("");

    const productName = editForm.productName.trim();
    const interestRate = Number(editForm.interestRate);
    const minimumBalance = Number(editForm.minimumBalance);

    if (!productName) {
      setCreateError("Product name is required.");
      setSavingEdit(false);
      return;
    }

    if (!Number.isFinite(interestRate) || interestRate < 0) {
      setCreateError("Interest rate must be a valid number.");
      setSavingEdit(false);
      return;
    }

    if (!editForm.activeFrom) {
      setCreateError("Active from date is required.");
      setSavingEdit(false);
      return;
    }

    if (editForm.expiryDate && editForm.expiryDate < editForm.activeFrom) {
      setCreateError("Expiry date cannot be before active from date.");
      setSavingEdit(false);
      return;
    }

    if (!Number.isFinite(minimumBalance) || minimumBalance < 0) {
      setCreateError("Minimum balance must be a valid number.");
      setSavingEdit(false);
      return;
    }

    try {
      const response = await fetch(`/api/admin/products/${editingProduct.productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName,
          interestRate,
          productType: editForm.productType,
          activeFrom: editForm.activeFrom,
          expiryDate: editForm.expiryDate || null,
          minimumBalance,
        }),
      });

      const result: ApiResponse<Product> = await response.json();

      if (!response.ok || !result.success) {
        setCreateError(result.error ?? "Failed to update product.");
        return;
      }

      closeEditModal();
      await loadProducts();
      onProductCreated?.();
    } catch {
      setCreateError("Failed to update product.");
    } finally {
      setSavingEdit(false);
    }
  };

  const deleteProduct = async (productId: number, productName: string) => {
    const confirmDelete = window.confirm(`Delete product ${productName}? This cannot be undone.`);
    if (!confirmDelete) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/products/${productId}`, { method: "DELETE" });
      const result: ApiResponse<unknown> = await response.json();

      if (!response.ok || !result.success) {
        setCreateError(result.error ?? "Delete failed.");
        return;
      }

      await loadProducts();
      onProductCreated?.();
    } catch {
      setCreateError("Delete failed.");
    }
  };

  const filteredLabel = useMemo(() => {
    return `${products.length} product${products.length === 1 ? "" : "s"}`;
  }, [products.length]);

  return (
    <section className={`mt-6 rounded-2xl border p-5 backdrop-blur-md ${panel}`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className={`text-lg font-semibold ${heading}`}>Products</h2>
        <span className={`rounded-full border px-3 py-1 text-xs ${badge}`}>{filteredLabel}</span>
      </div>

      <form onSubmit={handleCreate} className="mb-5 grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
        <input
          type="text"
          placeholder="Product Name"
          value={form.productName}
          onChange={(event) => setForm((prev) => ({ ...prev, productName: event.target.value }))}
          className={`rounded-xl border p-3 text-sm outline-none ${field}`}
        />
        <select
          value={form.productType}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, productType: event.target.value as "Savings" | "Loan" }))
          }
          className={`rounded-xl border p-3 text-sm outline-none ${field}`}
        >
          <option value="Savings">Savings</option>
          <option value="Loan">Loan</option>
        </select>
        <input
          type="number"
          min="0"
          step="0.01"
          placeholder="Interest Rate"
          value={form.interestRate}
          onChange={(event) => setForm((prev) => ({ ...prev, interestRate: event.target.value }))}
          className={`rounded-xl border p-3 text-sm outline-none ${field}`}
        />
        <input
          type="date"
          value={form.activeFrom}
          onChange={(event) => setForm((prev) => ({ ...prev, activeFrom: event.target.value }))}
          className={`rounded-xl border p-3 text-sm outline-none ${field}`}
        />
        <input
          type="date"
          value={form.expiryDate}
          onChange={(event) => setForm((prev) => ({ ...prev, expiryDate: event.target.value }))}
          className={`rounded-xl border p-3 text-sm outline-none ${field}`}
        />
        <input
          type="number"
          min="0"
          step="0.01"
          placeholder="Minimum Balance"
          value={form.minimumBalance}
          onChange={(event) => setForm((prev) => ({ ...prev, minimumBalance: event.target.value }))}
          className={`rounded-xl border p-3 text-sm outline-none ${field}`}
        />
        <button
          type="submit"
          className="rounded-xl bg-[#2dc7b8] px-4 py-3 text-sm font-semibold text-[#03272b] transition-colors hover:bg-[#43ded0]"
        >
          Create Product
        </button>
      </form>

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

      {error ? (
        <p className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full min-w-190 border-collapse text-left text-sm">
          <thead>
            <tr className={`border-b ${tableHead}`}>
              <th className="px-3 py-2 font-medium">Product</th>
              <th className="px-3 py-2 font-medium">Type</th>
              <th className="px-3 py-2 font-medium">Interest</th>
              <th className="px-3 py-2 font-medium">Min Balance</th>
              <th className="px-3 py-2 font-medium">Active</th>
              <th className="px-3 py-2 font-medium">Expiry</th>
              <th className="px-3 py-2 font-medium">Created</th>
              <th className="px-3 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className={tableBody}>
            {loading ? (
              <tr>
                <td className={`px-3 py-6 ${emptyText}`} colSpan={8}>
                  Loading products...
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td className={`px-3 py-6 ${emptyText}`} colSpan={8}>
                  No products yet.
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.productId} className={`border-b ${tableRow}`}>
                  <td className="px-3 py-3">{product.productName}</td>
                  <td className="px-3 py-3">{product.productType}</td>
                  <td className="px-3 py-3">{Number(product.interestRate ?? 0).toFixed(2)}</td>
                  <td className="px-3 py-3">{Number(product.minimumBalance ?? 0).toFixed(2)}</td>
                  <td className="px-3 py-3">{product.activeFrom ? product.activeFrom.slice(0, 10) : "-"}</td>
                  <td className="px-3 py-3">{product.expiryDate ? product.expiryDate.slice(0, 10) : "-"}</td>
                  <td className="px-3 py-3">
                    {product.createdAt ? new Date(product.createdAt).toLocaleString() : "-"}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(product)}
                        className={editBtnClass}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteProduct(product.productId, product.productName)}
                        className={deleteBtnClass}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editingProduct && editForm ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/55" onClick={closeEditModal} />
          <section
            className={`relative z-10 w-full max-w-lg rounded-2xl border p-5 backdrop-blur-xl ${
              isDark ? "border-[#2a4450] bg-[#081822]/95" : "border-[#b8d2ce] bg-[#f9fffd]/95"
            }`}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className={`text-xs uppercase tracking-[0.22em] ${isDark ? "text-[#8bc6c0]" : "text-[#317a72]"}`}>
                  Edit Product
                </p>
                <h3 className={`mt-1 text-xl font-bold ${heading}`}>Product #{editingProduct.productId}</h3>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                className={`rounded-lg border px-2.5 py-1 text-sm ${
                  isDark ? "border-[#35535b] text-[#b9d9d4]" : "border-[#a8c9c4] text-[#2b6460]"
                }`}
              >
                Close
              </button>
            </div>

            <form onSubmit={saveEdit} className="space-y-3">
              <input
                type="text"
                placeholder="Product Name"
                value={editForm.productName}
                onChange={(event) =>
                  setEditForm((prev) => (prev ? { ...prev, productName: event.target.value } : prev))
                }
                className={`rounded-xl border p-3 text-sm outline-none ${field}`}
              />
              <select
                value={editForm.productType}
                onChange={(event) =>
                  setEditForm((prev) =>
                    prev ? { ...prev, productType: event.target.value as "Savings" | "Loan" } : prev
                  )
                }
                className={`rounded-xl border p-3 text-sm outline-none ${field}`}
              >
                <option value="Savings">Savings</option>
                <option value="Loan">Loan</option>
              </select>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Interest Rate"
                value={editForm.interestRate}
                onChange={(event) =>
                  setEditForm((prev) => (prev ? { ...prev, interestRate: event.target.value } : prev))
                }
                className={`rounded-xl border p-3 text-sm outline-none ${field}`}
              />
              <input
                type="date"
                value={editForm.activeFrom}
                onChange={(event) =>
                  setEditForm((prev) => (prev ? { ...prev, activeFrom: event.target.value } : prev))
                }
                className={`rounded-xl border p-3 text-sm outline-none ${field}`}
              />
              <input
                type="date"
                value={editForm.expiryDate}
                onChange={(event) =>
                  setEditForm((prev) => (prev ? { ...prev, expiryDate: event.target.value } : prev))
                }
                className={`rounded-xl border p-3 text-sm outline-none ${field}`}
              />
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Minimum Balance"
                value={editForm.minimumBalance}
                onChange={(event) =>
                  setEditForm((prev) => (prev ? { ...prev, minimumBalance: event.target.value } : prev))
                }
                className={`rounded-xl border p-3 text-sm outline-none ${field}`}
              />
              <button
                type="submit"
                disabled={savingEdit}
                className="rounded-xl bg-[#2dc7b8] px-4 py-3 text-sm font-semibold text-[#03272b] transition-colors hover:bg-[#43ded0] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingEdit ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </section>
        </div>
      ) : null}
    </section>
  );
}
