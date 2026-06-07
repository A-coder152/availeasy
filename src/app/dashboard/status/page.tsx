"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CurrentStatus, CurrentStatusState } from "@prisma/client";
import { updateStatusSchema } from "@/lib/availability/validation";

export default function StatusPage() {
  const { data: session, status } = useSession();
  const [currentStatus, setCurrentStatus] = useState<Partial<CurrentStatus>>({
    state: CurrentStatusState.available,
    message: "",
    validUntil: null,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/signin");
    }

    if (status === "authenticated" && session?.user?.id) {
      fetchCurrentStatus();
    }
  }, [status, session]);

  const fetchCurrentStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      // Assuming a GET /api/v1/me/status endpoint exists for current status
      const response = await fetch("/api/v1/me/status");
      if (!response.ok) {
        throw new Error("Failed to fetch current status");
      }
      const data: CurrentStatus = await response.json();
      setCurrentStatus({
        state: data.state,
        message: data.message || "",
        validUntil: data.validUntil,
      });
    } catch (err: any) {
      setError(err.message || "Failed to load current status.");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (field: keyof CurrentStatus, value: any) => {
    setCurrentStatus((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = {
        state: currentStatus.state,
        message: currentStatus.message || null,
        valid_until: currentStatus.validUntil
          ? new Date(currentStatus.validUntil).toISOString()
          : null,
      };

      // Client-side Zod validation
      const validationResult = updateStatusSchema.safeParse(payload);
      if (!validationResult.success) {
        throw new Error(validationResult.error.issues.map((e: any) => e.message).join(", "));
      }

      const response = await fetch("/api/v1/me/status", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || "Failed to save status.");
      }

      setSuccess("Status saved successfully!");
      fetchCurrentStatus(); // Re-fetch to ensure consistency
    } catch (err: any) {
      setError(err.message || "An error occurred while saving status.");
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8 flex items-center justify-center text-gray-900 dark:text-gray-100">
        Loading...
      </div>
    );
  }

  // Format validUntil for datetime-local input
  const validUntilFormatted = currentStatus.validUntil
    ? new Date(currentStatus.validUntil).toISOString().slice(0, 16)
    : "";

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <h1 className="text-3xl font-bold mb-6">Manage Current Status</h1>
      <Link href="/dashboard" className="text-indigo-600 dark:text-indigo-400 hover:underline mb-4 inline-block">
        &larr; Back to Dashboard
      </Link>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mt-4 border border-gray-200 dark:border-gray-700">
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">{error}</div>}
        {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">{success}</div>}

        <form>
          <div className="mb-4">
            <label htmlFor="state" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              State
            </label>
            <select
              id="state"
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={currentStatus.state || CurrentStatusState.available}
              onChange={(e) =>
                handleStatusChange("state", e.target.value as CurrentStatusState)
              }
              required
            >
              {Object.values(CurrentStatusState).map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Message (Optional, max 140 chars)
            </label>
            <input
              type="text"
              id="message"
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={currentStatus.message || ""}
              onChange={(e) => handleStatusChange("message", e.target.value)}
              maxLength={140}
            />
          </div>

          <div className="mb-4">
            <label htmlFor="validUntil" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Valid Until (Optional, UTC)
            </label>
            <input
              type="datetime-local"
              id="validUntil"
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={validUntilFormatted}
              onChange={(e) =>
                handleStatusChange("validUntil", e.target.value ? new Date(e.target.value) : null)
              }
            />
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Set an optional expiration date/time for your status.
            </p>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              type="button"
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Status"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
