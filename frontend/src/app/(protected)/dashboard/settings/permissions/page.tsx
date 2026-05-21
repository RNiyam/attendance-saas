"use client";

import { useEffect, useState } from "react";
import { apiBaseUrl } from "@/services/http";

type Permission = {
  id: string;
  code: string;
  module: string;
  description: string;
};

type Role = {
  id: string;
  name: string;
  description: string;
  isSystemRole: boolean;
  permissionIds: string[];
};

type PermissionsData = {
  roles: Role[];
  permissions: Permission[];
};

function authHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  const h: HeadersInit = { "Content-Type": "application/json" };
  if (token) (h as Record<string, string>).Authorization = `Bearer ${token}`;
  return h;
}

export default function ManagePermissionsPage() {
  const [data, setData] = useState<PermissionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/settings/permissions`, {
        headers: authHeaders(),
      });
      if (!res.ok) {
        if (res.status === 403) {
          setError("You do not have permission to view this page. Only the OWNER can manage permissions.");
        } else {
          setError("Failed to load permissions data.");
        }
        return;
      }
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError("Network error loading permissions.");
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = async (roleId: string, permissionId: string) => {
    if (!data) return;
    const role = data.roles.find(r => r.id === roleId);
    if (!role || role.name === "OWNER") return; // Owner cannot be modified

    const currentIds = new Set(role.permissionIds);
    if (currentIds.has(permissionId)) {
      currentIds.delete(permissionId);
    } else {
      currentIds.add(permissionId);
    }
    const newIds = Array.from(currentIds);

    // Optimistic update
    setData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        roles: prev.roles.map(r => 
          r.id === roleId ? { ...r, permissionIds: newIds } : r
        )
      };
    });

    setSaving(roleId);
    setSuccess(null);
    setError(null);
    
    try {
      const res = await fetch(`${apiBaseUrl}/api/settings/permissions`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({
          roleId: parseInt(roleId, 10),
          permissionIds: newIds.map(id => parseInt(id, 10)),
        }),
      });
      if (!res.ok) {
        setError("Failed to save permission changes.");
        // Revert optimistic update
        loadData();
      } else {
        setSuccess("Permissions updated successfully.");
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (e) {
      setError("Network error while saving.");
      loadData();
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return <div className="p-6 text-sm text-[#6B6B80]">Loading permissions...</div>;
  }

  if (error && !data) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      </div>
    );
  }

  const editableRoles = data?.roles.filter(r => r.name !== "OWNER") || [];

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-black tracking-tight text-[#0F0F1A]">Manage Permissions</h1>
        <p className="mt-2 text-sm text-[#6B6B80]">
          Configure which features each role can access across your workspace.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          {success}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-[#E8E5F0] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#E8E5F0] bg-[#FAFAFA]">
                <th className="whitespace-nowrap px-6 py-4 font-bold text-[#0F0F1A]">Module &amp; Permission</th>
                {editableRoles.map(role => (
                  <th key={role.id} className="whitespace-nowrap px-6 py-4 text-center font-bold text-[#0F0F1A]">
                    {role.name}
                    {saving === role.id && (
                      <span className="ml-2 inline-block h-3 w-3 animate-spin rounded-full border-2 border-[#4F7FFF] border-t-transparent" />
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E5F0]">
              {data?.permissions.map(permission => (
                <tr key={permission.id} className="transition-colors hover:bg-[#FAFAFA]">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center rounded-md bg-[#F1F5F9] px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#475569]">
                        {permission.module}
                      </span>
                      <span className="font-medium text-[#0F0F1A]">{permission.description || permission.code}</span>
                    </div>
                  </td>
                  {editableRoles.map(role => {
                    const hasPermission = role.permissionIds.includes(permission.id);
                    return (
                      <td key={role.id} className="px-6 py-4 text-center">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={hasPermission}
                          disabled={saving === role.id}
                          onClick={() => togglePermission(role.id, permission.id)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-2 ${
                            hasPermission ? "bg-[#4F7FFF]" : "bg-[#E2E8F0]"
                          } ${saving === role.id ? "opacity-50" : ""}`}
                        >
                          <span className="sr-only">Toggle {permission.description} for {role.name}</span>
                          <span
                            aria-hidden="true"
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              hasPermission ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
