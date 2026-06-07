"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  AvailabilityRule,
  AvailabilityState,
  User,
} from "@prisma/client";
import { updateRulesSchema } from "@/lib/availability/validation";
import ThemeToggle from "@/components/ThemeToggle";

// Helper for initial rule state
const createEmptyRule = (): Partial<AvailabilityRule> => ({
  dayOfWeek: 0,
  startTimeLocal: "09:00",
  endTimeLocal: "17:00",
  state: AvailabilityState.available,
});

export default function RulesPage() {
  const { data: session, status } = useSession();
  const [rules, setRules] = useState<Partial<AvailabilityRule>[]>([]);
  const [userTimezone, setUserTimezone] = useState<string>("UTC");
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/signin");
    }

    if (status === "authenticated" && session?.user?.id) {
      fetchRules();
    }
  }, [status, session]);

  const fetchRules = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/user/${session?.user?.id}`); 
      if (!response.ok) {
        throw new Error("Failed to fetch user data and rules");
      }
      const userData: User & { AvailabilityRule: AvailabilityRule[] } = await response.json();
      setRules(userData.AvailabilityRule.length > 0 ? userData.AvailabilityRule : [createEmptyRule()]);
      setUserTimezone(userData.timezone);
    } catch (err: any) {
      setError(err.message || "Failed to load rules.");
    } finally {
      setLoading(false);
    }
  };

  const handleRuleChange = (
    index: number,
    field: keyof AvailabilityRule,
    value: any
  ) => {
    const newRules = [...rules];
    (newRules[index] as any)[field] = value;
    setRules(newRules);
  };

  const addRule = () => {
    setRules([...rules, createEmptyRule()]);
  };

  const removeRule = (index: number) => {
    const newRules = rules.filter((_, i) => i !== index);
    setRules(newRules.length > 0 ? newRules : [createEmptyRule()]);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = {
        timezone: userTimezone,
        rules: rules.map((rule) => ({
          day_of_week: rule.dayOfWeek,
          start_time: rule.startTimeLocal,
          end_time: rule.endTimeLocal,
          state: rule.state,
        })),
      };

      const validationResult = updateRulesSchema.safeParse(payload);
      if (!validationResult.success) {
        throw new Error(validationResult.error.issues.map((e: any) => e.message).join(", "));
      }

      const response = await fetch("/api/v1/me/rules", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || "Failed to save rules.");
      }

      setSuccess("Rules saved successfully!");
      fetchRules();
    } catch (err: any) {
      setError(err.message || "An error occurred while saving rules.");
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8 flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8 text-gray-900 dark:text-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manage Weekly Availability Rules</h1>
        <ThemeToggle />
      </div>
      <Link href="/dashboard" className="text-indigo-600 hover:underline mb-4 inline-block">
        &larr; Back to Dashboard
      </Link>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mt-4">
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">{error}</div>}
        {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">{success}</div>}

        <div className="mb-4">
          <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Your Timezone (IANA format)
          </label>
          <input
            type="text"
            id="timezone"
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            value={userTimezone}
            onChange={(e) => setUserTimezone(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Day
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Start
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  End
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  State
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {rules.map((rule, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={rule.dayOfWeek || 0}
                      onChange={(e) =>
                        handleRuleChange(index, "dayOfWeek", parseInt(e.target.value))
                      }
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    >
                      {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day, i) => (
                        <option key={i} value={i}>
                          {day}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="time"
                      value={rule.startTimeLocal || "09:00"}
                      onChange={(e) =>
                        handleRuleChange(index, "startTimeLocal", e.target.value)
                      }
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="time"
                      value={rule.endTimeLocal || "17:00"}
                      onChange={(e) =>
                        handleRuleChange(index, "endTimeLocal", e.target.value)
                      }
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={rule.state || AvailabilityState.available}
                      onChange={(e) =>
                        handleRuleChange(index, "state", e.target.value as AvailabilityState)
                      }
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    >
                      {Object.values(AvailabilityState).map((state) => (
                        <option key={state} value={state}>
                          {state.charAt(0).toUpperCase() + state.slice(1)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => removeRule(index)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex justify-between">
          <button
            onClick={addRule}
            type="button"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Add Rule
          </button>
          <button
            onClick={handleSave}
            type="button"
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save All Rules"}
          </button>
        </div>
      </div>
    </div>
  );
}
