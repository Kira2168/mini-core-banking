"use client";

import { useEffect, useMemo, useState } from "react";

type Role = {
  roleId: number;
  roleName: string;
  description: string | null;
  permissionIds: number[];
};

type Permission = {
  permissionId: number;
  permissionName: string;
  moduleName: string;
  actionName: string;
  description: string | null;
};

type UserRow = {
  userId: number;
  username: string;
  email: string;
  status: "Active" | "Inactive";
  roleId: number;
  roleName: string;
  createdAt: string;
};

type ApiResponse<T> = {
  success: boolean;
  error?: string;
  data: T;
};

type AdminSecurityPanelProps = {
  theme: "dark" | "light";
};

type RoleFormState = {
  roleName: string;
  description: string;
};

type UserFormState = {
  username: string;
  email: string;
  password: string;
  roleId: string;
};

export default function AdminSecurityPanel({ theme }: AdminSecurityPanelProps) {
  const isDark = theme === "dark";
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [roleForm, setRoleForm] = useState<RoleFormState>({ roleName: "", description: "" });
  const [userForm, setUserForm] = useState<UserFormState>({
    username: "",
    email: "",
    password: "",
    roleId: "",
  });
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [roleEditForm, setRoleEditForm] = useState<RoleFormState | null>(null);
  const [userEditForm, setUserEditForm] = useState<{ email: string; status: "Active" | "Inactive"; roleId: string; password: string } | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [savingRolePermissions, setSavingRolePermissions] = useState(false);

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

  const loadAll = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const [rolesRes, permissionsRes, usersRes] = await Promise.all([
        fetch("/api/admin/security/roles", { method: "GET", cache: "no-store" }),
        fetch("/api/admin/security/permissions", { method: "GET", cache: "no-store" }),
        fetch("/api/admin/security/users", { method: "GET", cache: "no-store" }),
      ]);

      const rolesData: ApiResponse<Role[]> = await rolesRes.json();
      const permissionsData: ApiResponse<Permission[]> = await permissionsRes.json();
      const usersData: ApiResponse<UserRow[]> = await usersRes.json();

      if (!rolesRes.ok || !rolesData.success) {
        setError(rolesData.error ?? "Failed to load roles.");
        return;
      }
      if (!permissionsRes.ok || !permissionsData.success) {
        setError(permissionsData.error ?? "Failed to load permissions.");
        return;
      }
      if (!usersRes.ok || !usersData.success) {
        setError(usersData.error ?? "Failed to load users.");
        return;
      }

      setRoles(rolesData.data);
      setPermissions(permissionsData.data);
      setUsers(usersData.data);
    } catch {
      setError("Failed to load security data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const createRole = async (event: React.FormEvent) => {
    event.preventDefault();
    setSuccess("");

    const roleName = roleForm.roleName.trim();
    if (!roleName) {
      setError("Role name is required.");
      return;
    }

    try {
      const response = await fetch("/api/admin/security/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleName, description: roleForm.description.trim() || null }),
      });

      const result: ApiResponse<{ roleId: number }> = await response.json();

      if (!response.ok || !result.success) {
        setError(result.error ?? "Failed to create role.");
        return;
      }

      setRoleForm({ roleName: "", description: "" });
      await loadAll();
    } catch {
      setError("Failed to create role.");
    }
  };

  const createUser = async (event: React.FormEvent) => {
    event.preventDefault();
    setSuccess("");

    const username = userForm.username.trim();
    const email = userForm.email.trim();
    const password = userForm.password.trim();
    const roleId = Number(userForm.roleId);

    if (!username || !email || !password || !Number.isInteger(roleId) || roleId <= 0) {
      setError("Username, email, password, and role are required.");
      return;
    }

    try {
      const response = await fetch("/api/admin/security/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password, roleId }),
      });

      const result: ApiResponse<{ userId: number }> = await response.json();

      if (!response.ok || !result.success) {
        setError(result.error ?? "Failed to create user.");
        return;
      }

      setUserForm({ username: "", email: "", password: "", roleId: "" });
      setSuccess("User created successfully.");
      await loadAll();
    } catch {
      setError("Failed to create user.");
    }
  };

  const openRoleEdit = (role: Role) => {
    setEditingRole(role);
    setRoleEditForm({ roleName: role.roleName, description: role.description ?? "" });
    setSelectedPermissions(role.permissionIds);
  };

  const closeRoleEdit = () => {
    setEditingRole(null);
    setRoleEditForm(null);
    setSelectedPermissions([]);
    setSavingRolePermissions(false);
  };

  const saveRoleEdit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSuccess("");

    if (!editingRole || !roleEditForm) {
      return;
    }

    const roleName = roleEditForm.roleName.trim();
    if (!roleName) {
      setError("Role name is required.");
      return;
    }

    try {
      const response = await fetch(`/api/admin/security/roles/${editingRole.roleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleName, description: roleEditForm.description.trim() || null }),
      });

      const result: ApiResponse<unknown> = await response.json();

      if (!response.ok || !result.success) {
        setError(result.error ?? "Failed to update role.");
        return;
      }

      closeRoleEdit();
      setSuccess("Role updated successfully.");
      await loadAll();
    } catch {
      setError("Failed to update role.");
    }
  };

  const saveRolePermissions = async () => {
    if (!editingRole) {
      return;
    }

    setSavingRolePermissions(true);
    setSuccess("");

    try {
      const response = await fetch(`/api/admin/security/roles/${editingRole.roleId}/permissions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissionIds: selectedPermissions }),
      });

      const result: ApiResponse<unknown> = await response.json();

      if (!response.ok || !result.success) {
        setError(result.error ?? "Failed to update permissions.");
        return;
      }

      setSuccess("Permissions updated successfully.");
      await loadAll();
    } catch {
      setError("Failed to update permissions.");
    } finally {
      setSavingRolePermissions(false);
    }
  };

  const deleteRole = async (roleId: number, roleName: string) => {
    const confirmDelete = window.confirm(`Delete role ${roleName}? This cannot be undone.`);
    if (!confirmDelete) {
      return;
    }
    setSuccess("");

    try {
      const response = await fetch(`/api/admin/security/roles/${roleId}`, { method: "DELETE" });
      const result: ApiResponse<unknown> = await response.json();

      if (!response.ok || !result.success) {
        setError(result.error ?? "Delete failed.");
        return;
      }

      setSuccess("Role deleted successfully.");
      await loadAll();
    } catch {
      setError("Delete failed.");
    }
  };

  const openUserEdit = (user: UserRow) => {
    setEditingUser(user);
    setUserEditForm({
      email: user.email,
      status: user.status,
      roleId: String(user.roleId),
      password: "",
    });
    setSuccess("");
  };

  const closeUserEdit = () => {
    setEditingUser(null);
    setUserEditForm(null);
  };

  const saveUserEdit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSuccess("");

    if (!editingUser || !userEditForm) {
      return;
    }

    const email = userEditForm.email.trim();
    const roleId = Number(userEditForm.roleId);
    const password = userEditForm.password.trim();

    if (!email || !Number.isInteger(roleId) || roleId <= 0) {
      setError("Email and role are required.");
      return;
    }

    try {
      const response = await fetch(`/api/admin/security/users/${editingUser.userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          status: userEditForm.status,
          roleId,
          password: password || null,
        }),
      });

      const result: ApiResponse<unknown> = await response.json();

      if (!response.ok || !result.success) {
        setError(result.error ?? "Failed to update user.");
        return;
      }

      closeUserEdit();
      setSuccess("User updated successfully.");
      await loadAll();
    } catch {
      setError("Failed to update user.");
    }
  };

  const deleteUser = async (userId: number, username: string) => {
    const confirmDelete = window.confirm(`Delete user ${username}? This cannot be undone.`);
    if (!confirmDelete) {
      return;
    }
    setSuccess("");

    try {
      const response = await fetch(`/api/admin/security/users/${userId}`, { method: "DELETE" });
      const result: ApiResponse<unknown> = await response.json();

      if (!response.ok || !result.success) {
        setError(result.error ?? "Delete failed.");
        return;
      }

      setSuccess("User deleted successfully.");
      await loadAll();
    } catch {
      setError("Delete failed.");
    }
  };

  const permissionGroups = useMemo(() => {
    const grouped: Record<string, Permission[]> = {};
    permissions.forEach((perm) => {
      if (!grouped[perm.moduleName]) {
        grouped[perm.moduleName] = [];
      }
      grouped[perm.moduleName].push(perm);
    });
    return grouped;
  }, [permissions]);

  const roleCount = roles.length;
  const userCount = users.length;

  return (
    <section className={`rounded-2xl border p-5 backdrop-blur-md ${panel}`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className={`text-lg font-semibold ${heading}`}>Security Management</h2>
        <span className={`rounded-full border px-3 py-1 text-xs ${badge}`}>
          {roleCount} roles, {userCount} users
        </span>
      </div>

      {error ? (
        <p className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      {success ? (
        <p className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
          {success}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <h3 className={`mb-2 text-sm font-semibold uppercase tracking-[0.2em] ${heading}`}>Roles</h3>
          <form onSubmit={createRole} className="mb-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
            <input
              type="text"
              placeholder="Role Name"
              value={roleForm.roleName}
              onChange={(event) => setRoleForm((prev) => ({ ...prev, roleName: event.target.value }))}
              className={`rounded-xl border p-3 text-sm outline-none ${field}`}
            />
            <input
              type="text"
              placeholder="Description"
              value={roleForm.description}
              onChange={(event) => setRoleForm((prev) => ({ ...prev, description: event.target.value }))}
              className={`rounded-xl border p-3 text-sm outline-none ${field}`}
            />
            <button
              type="submit"
              className="rounded-xl bg-[#2dc7b8] px-4 py-3 text-sm font-semibold text-[#03272b] transition-colors hover:bg-[#43ded0]"
            >
              Add Role
            </button>
          </form>

          <div className="overflow-x-auto">
            <table className="w-full min-w-160 border-collapse text-left text-sm">
              <thead>
                <tr className={`border-b ${tableHead}`}>
                  <th className="px-3 py-2 font-medium">Role</th>
                  <th className="px-3 py-2 font-medium">Description</th>
                  <th className="px-3 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className={tableBody}>
                {loading ? (
                  <tr>
                    <td className={`px-3 py-6 ${emptyText}`} colSpan={3}>
                      Loading roles...
                    </td>
                  </tr>
                ) : roles.length === 0 ? (
                  <tr>
                    <td className={`px-3 py-6 ${emptyText}`} colSpan={3}>
                      No roles created yet.
                    </td>
                  </tr>
                ) : (
                  roles.map((role) => (
                    <tr key={role.roleId} className={`border-b ${tableRow}`}>
                      <td className="px-3 py-3">{role.roleName}</td>
                      <td className="px-3 py-3">{role.description ?? "-"}</td>
                      <td className="px-3 py-3">
                        <div className="flex gap-2">
                          <button type="button" className={editBtnClass} onClick={() => openRoleEdit(role)}>
                            Edit
                          </button>
                          <button
                            type="button"
                            className={deleteBtnClass}
                            onClick={() => deleteRole(role.roleId, role.roleName)}
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
        </div>

        <div>
          <h3 className={`mb-2 text-sm font-semibold uppercase tracking-[0.2em] ${heading}`}>Users</h3>
          <form onSubmit={createUser} className="mb-4 grid gap-3 md:grid-cols-2">
            <input
              type="text"
              placeholder="Username"
              value={userForm.username}
              onChange={(event) => setUserForm((prev) => ({ ...prev, username: event.target.value }))}
              className={`rounded-xl border p-3 text-sm outline-none ${field}`}
            />
            <input
              type="email"
              placeholder="Email"
              value={userForm.email}
              onChange={(event) => setUserForm((prev) => ({ ...prev, email: event.target.value }))}
              className={`rounded-xl border p-3 text-sm outline-none ${field}`}
            />
            <input
              type="password"
              placeholder="Password"
              value={userForm.password}
              onChange={(event) => setUserForm((prev) => ({ ...prev, password: event.target.value }))}
              className={`rounded-xl border p-3 text-sm outline-none ${field}`}
            />
            <select
              value={userForm.roleId}
              onChange={(event) => setUserForm((prev) => ({ ...prev, roleId: event.target.value }))}
              className={`rounded-xl border p-3 text-sm outline-none ${field}`}
            >
              <option value="">Select role</option>
              {roles.map((role) => (
                <option key={role.roleId} value={role.roleId}>
                  {role.roleName}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-xl bg-[#2dc7b8] px-4 py-3 text-sm font-semibold text-[#03272b] transition-colors hover:bg-[#43ded0] md:col-span-2"
            >
              Add User
            </button>
          </form>

          <div className="overflow-x-auto">
            <table className="w-full min-w-160 border-collapse text-left text-sm">
              <thead>
                <tr className={`border-b ${tableHead}`}>
                  <th className="px-3 py-2 font-medium">User</th>
                  <th className="px-3 py-2 font-medium">Role</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className={tableBody}>
                {loading ? (
                  <tr>
                    <td className={`px-3 py-6 ${emptyText}`} colSpan={4}>
                      Loading users...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td className={`px-3 py-6 ${emptyText}`} colSpan={4}>
                      No users created yet.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.userId} className={`border-b ${tableRow}`}>
                      <td className="px-3 py-3">
                        {user.username}
                        <div className={`text-xs ${emptyText}`}>{user.email}</div>
                      </td>
                      <td className="px-3 py-3">{user.roleName}</td>
                      <td className="px-3 py-3">{user.status}</td>
                      <td className="px-3 py-3">
                        <div className="flex gap-2">
                          <button type="button" className={editBtnClass} onClick={() => openUserEdit(user)}>
                            Edit
                          </button>
                          <button
                            type="button"
                            className={deleteBtnClass}
                            onClick={() => deleteUser(user.userId, user.username)}
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
        </div>
      </div>

      {editingRole && roleEditForm ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/55" onClick={closeRoleEdit} />
          <section
            className={`relative z-10 w-full max-w-3xl rounded-2xl border p-5 backdrop-blur-xl ${
              isDark ? "border-[#2a4450] bg-[#081822]/95" : "border-[#b8d2ce] bg-[#f9fffd]/95"
            }`}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className={`text-xs uppercase tracking-[0.22em] ${isDark ? "text-[#8bc6c0]" : "text-[#317a72]"}`}>
                  Edit Role
                </p>
                <h3 className={`mt-1 text-xl font-bold ${heading}`}>{editingRole.roleName}</h3>
              </div>
              <button
                type="button"
                onClick={closeRoleEdit}
                className={`rounded-lg border px-2.5 py-1 text-sm ${
                  isDark ? "border-[#35535b] text-[#b9d9d4]" : "border-[#a8c9c4] text-[#2b6460]"
                }`}
              >
                Close
              </button>
            </div>

            <form onSubmit={saveRoleEdit} className="mb-4 grid gap-3 md:grid-cols-2">
              <input
                type="text"
                value={roleEditForm.roleName}
                onChange={(event) => setRoleEditForm((prev) => (prev ? { ...prev, roleName: event.target.value } : prev))}
                className={`rounded-xl border p-3 text-sm outline-none ${field}`}
              />
              <input
                type="text"
                value={roleEditForm.description}
                onChange={(event) => setRoleEditForm((prev) => (prev ? { ...prev, description: event.target.value } : prev))}
                className={`rounded-xl border p-3 text-sm outline-none ${field}`}
              />
              <button
                type="submit"
                className="rounded-xl bg-[#2dc7b8] px-4 py-3 text-sm font-semibold text-[#03272b] transition-colors hover:bg-[#43ded0] md:col-span-2"
              >
                Save Role
              </button>
            </form>

            <div className="max-h-[300px] overflow-y-auto rounded-xl border border-[#21424a] p-4">
              {Object.entries(permissionGroups).map(([moduleName, perms]) => (
                <div key={moduleName} className="mb-4">
                  <p className={`mb-2 text-xs font-semibold uppercase tracking-[0.18em] ${heading}`}>{moduleName}</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {perms.map((permission) => (
                      <label key={permission.permissionId} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={selectedPermissions.includes(permission.permissionId)}
                          onChange={(event) => {
                            const checked = event.target.checked;
                            setSelectedPermissions((prev) =>
                              checked
                                ? [...prev, permission.permissionId]
                                : prev.filter((id) => id !== permission.permissionId)
                            );
                          }}
                        />
                        <span>{permission.permissionName}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              disabled={savingRolePermissions}
              onClick={saveRolePermissions}
              className="mt-4 rounded-xl bg-[#2dc7b8] px-4 py-3 text-sm font-semibold text-[#03272b] transition-colors hover:bg-[#43ded0] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingRolePermissions ? "Saving..." : "Save Permissions"}
            </button>
          </section>
        </div>
      ) : null}

      {editingUser && userEditForm ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/55" onClick={closeUserEdit} />
          <section
            className={`relative z-10 w-full max-w-lg rounded-2xl border p-5 backdrop-blur-xl ${
              isDark ? "border-[#2a4450] bg-[#081822]/95" : "border-[#b8d2ce] bg-[#f9fffd]/95"
            }`}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className={`text-xs uppercase tracking-[0.22em] ${isDark ? "text-[#8bc6c0]" : "text-[#317a72]"}`}>
                  Edit User
                </p>
                <h3 className={`mt-1 text-xl font-bold ${heading}`}>{editingUser.username}</h3>
              </div>
              <button
                type="button"
                onClick={closeUserEdit}
                className={`rounded-lg border px-2.5 py-1 text-sm ${
                  isDark ? "border-[#35535b] text-[#b9d9d4]" : "border-[#a8c9c4] text-[#2b6460]"
                }`}
              >
                Close
              </button>
            </div>

            <form onSubmit={saveUserEdit} className="space-y-3">
              <input
                type="email"
                value={userEditForm.email}
                onChange={(event) => setUserEditForm((prev) => (prev ? { ...prev, email: event.target.value } : prev))}
                className={`rounded-xl border p-3 text-sm outline-none ${field}`}
              />
              <select
                value={userEditForm.roleId}
                onChange={(event) => setUserEditForm((prev) => (prev ? { ...prev, roleId: event.target.value } : prev))}
                className={`rounded-xl border p-3 text-sm outline-none ${field}`}
              >
                {roles.map((role) => (
                  <option key={role.roleId} value={role.roleId}>
                    {role.roleName}
                  </option>
                ))}
              </select>
              <select
                value={userEditForm.status}
                onChange={(event) => setUserEditForm((prev) => (prev ? { ...prev, status: event.target.value as "Active" | "Inactive" } : prev))}
                className={`rounded-xl border p-3 text-sm outline-none ${field}`}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
              <input
                type="password"
                placeholder="New password (optional)"
                value={userEditForm.password}
                onChange={(event) => setUserEditForm((prev) => (prev ? { ...prev, password: event.target.value } : prev))}
                className={`rounded-xl border p-3 text-sm outline-none ${field}`}
              />
              <button
                type="submit"
                className="rounded-xl bg-[#2dc7b8] px-4 py-3 text-sm font-semibold text-[#03272b] transition-colors hover:bg-[#43ded0]"
              >
                Save User
              </button>
            </form>
          </section>
        </div>
      ) : null}
    </section>
  );
}
