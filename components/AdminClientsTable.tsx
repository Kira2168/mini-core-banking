"use client";

import { useEffect, useMemo, useState } from "react";

type CategoryFilter = "All" | "Individual" | "Non-Individual";
type StatusFilter = "All" | "Active" | "Inactive" | "Suspended";
type ClientStatus = "Active" | "Inactive" | "Suspended";

type ClientRow = {
  clientId: number;
  clientCategory: "Individual" | "Non-Individual";
  registrationDate: string;
  status: ClientStatus;
  firstName: string | null;
  lastName: string | null;
  dob: string | null;
  gender: "Male" | "Female" | "Other" | null;
  individualSubType: string | null;
  organizationName: string | null;
  registrationNumber: string | null;
  incorporationDate: string | null;
  nonIndividualSubType: string | null;
};

type ApiResponse = {
  success: boolean;
  error?: string;
  data: ClientRow[];
  meta: {
    totalClients: number;
    totalIndividuals: number;
    totalNonIndividuals: number;
  };
};

type AdminClientsTableProps = {
  theme: "dark" | "light";
};

export default function AdminClientsTable({ theme }: AdminClientsTableProps) {
  const isDark = theme === "dark";
  const [category, setCategory] = useState<CategoryFilter>("All");
  const [status, setStatus] = useState<StatusFilter>("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [meta, setMeta] = useState({ totalClients: 0, totalIndividuals: 0, totalNonIndividuals: 0 });
  const [pendingStatusUpdate, setPendingStatusUpdate] = useState<Record<number, ClientStatus>>({});

  const fetchClients = async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        category,
        status,
        search,
        limit: "250",
      });

      const response = await fetch(`/api/admin/clients?${params.toString()}`, {
        method: "GET",
        cache: "no-store",
      });

      const result: ApiResponse = await response.json();

      if (!response.ok || !result.success) {
        setError(result.error ?? "Failed to load clients.");
        return;
      }

      setClients(result.data);
      setMeta(result.meta);
      const nextPending: Record<number, ClientStatus> = {};
      result.data.forEach((client) => {
        nextPending[client.clientId] = client.status;
      });
      setPendingStatusUpdate(nextPending);
    } catch {
      setError("Failed to load clients.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [category, status]);

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchClients();
  };

  const deleteClient = async (clientId: number) => {
    const confirmDelete = window.confirm(`Delete client ${clientId}? This cannot be undone.`);
    if (!confirmDelete) {
      return;
    }

    const response = await fetch(`/api/admin/clients/${clientId}`, { method: "DELETE" });
    const result = await response.json();

    if (!response.ok || !result.success) {
      alert(result.error ?? "Delete failed.");
      return;
    }

    await fetchClients();
  };

  const updateStatus = async (clientId: number) => {
    const statusToSet = pendingStatusUpdate[clientId];
    const response = await fetch(`/api/admin/clients/${clientId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: statusToSet }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      alert(result.error ?? "Status update failed.");
      return;
    }

    await fetchClients();
  };

  const filteredLabel = useMemo(() => {
    return `${clients.length} result${clients.length === 1 ? "" : "s"}`;
  }, [clients.length]);

  const cardBase = isDark ? "border-[#27464e] bg-[#0a1f27]/90" : "border-[#a8cdc8] bg-[#f3fffd]/95";
  const cardTitle = isDark ? "text-[#80bab3]" : "text-[#317a72]";
  const cardValue = isDark ? "text-[#dffbf7]" : "text-[#124247]";
  const cardText = isDark ? "text-[#9db8b4]" : "text-[#5a7f7b]";
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

  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        <article className={`rounded-2xl border p-5 ${cardBase}`}>
          <p className={`text-xs uppercase tracking-[0.2em] ${cardTitle}`}>Total Clients</p>
          <p className={`mt-3 text-3xl font-bold ${cardValue}`}>{meta.totalClients}</p>
          <p className={`mt-1 text-sm ${cardText}`}>Across all categories</p>
        </article>

        <article className={`rounded-2xl border p-5 ${cardBase}`}>
          <p className={`text-xs uppercase tracking-[0.2em] ${cardTitle}`}>Individual</p>
          <p className={`mt-3 text-3xl font-bold ${cardValue}`}>{meta.totalIndividuals}</p>
          <p className={`mt-1 text-sm ${cardText}`}>Personal client records</p>
        </article>

        <article className={`rounded-2xl border p-5 ${cardBase}`}>
          <p className={`text-xs uppercase tracking-[0.2em] ${cardTitle}`}>Non-Individual</p>
          <p className={`mt-3 text-3xl font-bold ${cardValue}`}>{meta.totalNonIndividuals}</p>
          <p className={`mt-1 text-sm ${cardText}`}>Organizations and entities</p>
        </article>
      </div>

      <section className={`mt-6 rounded-2xl border p-5 backdrop-blur-md ${panel}`}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className={`text-lg font-semibold ${heading}`}>Client Tables</h2>
          <span className={`rounded-full border px-3 py-1 text-xs ${badge}`}>{filteredLabel}</span>
        </div>

        <form onSubmit={onSearchSubmit} className="mb-4 grid gap-3 md:grid-cols-4">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as CategoryFilter)}
            className={`rounded-xl border p-3 text-sm outline-none ${field}`}
          >
            <option value="All">All Categories</option>
            <option value="Individual">Individual Table</option>
            <option value="Non-Individual">Non-Individual Table</option>
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusFilter)}
            className={`rounded-xl border p-3 text-sm outline-none ${field}`}
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Suspended">Suspended</option>
          </select>

          <input
            type="text"
            placeholder="Search ID, name, org, reg no"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`rounded-xl border p-3 text-sm outline-none ${field}`}
          />

          <button
            type="submit"
            className="rounded-xl bg-[#2dc7b8] px-4 py-3 text-sm font-semibold text-[#03272b] transition-colors hover:bg-[#43ded0]"
          >
            Apply Filters
          </button>
        </form>

        {error ? (
          <p className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p>
        ) : null}

        <div className="overflow-x-auto">
          <table className="w-full min-w-190 border-collapse text-left text-sm">
            <thead>
              <tr className={`border-b ${tableHead}`}>
                <th className="px-3 py-2 font-medium">Client ID</th>
                <th className="px-3 py-2 font-medium">Category</th>
                <th className="px-3 py-2 font-medium">Name / Organization</th>
                <th className="px-3 py-2 font-medium">Subtype</th>
                <th className="px-3 py-2 font-medium">Registered</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Operations</th>
              </tr>
            </thead>
            <tbody className={tableBody}>
              {loading ? (
                <tr>
                  <td className={`px-3 py-6 ${emptyText}`} colSpan={7}>
                    Loading clients...
                  </td>
                </tr>
              ) : clients.length === 0 ? (
                <tr>
                  <td className={`px-3 py-6 ${emptyText}`} colSpan={7}>
                    No clients found for your selection.
                  </td>
                </tr>
              ) : (
                clients.map((client) => {
                  const displayName =
                    client.clientCategory === "Individual"
                      ? `${client.firstName ?? ""} ${client.lastName ?? ""}`.trim()
                      : client.organizationName ?? "-";
                  const subtype =
                    client.clientCategory === "Individual"
                      ? client.individualSubType ?? "-"
                      : client.nonIndividualSubType ?? "-";

                  return (
                    <tr key={client.clientId} className={`border-b ${tableRow}`}>
                      <td className="px-3 py-3">{client.clientId}</td>
                      <td className="px-3 py-3">{client.clientCategory}</td>
                      <td className="px-3 py-3">{displayName || "-"}</td>
                      <td className="px-3 py-3">{subtype}</td>
                      <td className="px-3 py-3">{new Date(client.registrationDate).toLocaleString()}</td>
                      <td className="px-3 py-3">
                        <select
                          value={pendingStatusUpdate[client.clientId] ?? client.status}
                          onChange={(e) =>
                            setPendingStatusUpdate((prev) => ({
                              ...prev,
                              [client.clientId]: e.target.value as ClientStatus,
                            }))
                          }
                          className="rounded-lg border border-[#2b4c57] bg-[#102932] px-2 py-1 text-xs text-[#dffbf7] outline-none"
                        >
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                          <option value="Suspended">Suspended</option>
                        </select>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => updateStatus(client.clientId)}
                            className="rounded-lg border border-[#2f5963] bg-[#10303a] px-3 py-1 text-xs font-semibold text-[#9febe3] transition-colors hover:bg-[#16404d]"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteClient(client.clientId)}
                            className="rounded-lg border border-red-600/50 bg-red-700/20 px-3 py-1 text-xs font-semibold text-red-200 transition-colors hover:bg-red-700/35"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
