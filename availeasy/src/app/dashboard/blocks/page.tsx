"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AvailabilityException, AvailabilityState } from "@prisma/client";
import { createBlockSchema } from "@/lib/availability/validation";
import { format } from "date-fns";

// Helper for initial block state
const createEmptyBlock = () => ({
  start: "",
  end: "",
  state: AvailabilityState.unavailable,
  public_label: "",
  private_note: "",
});

export default function BlocksPage() {
  const { data: session, status } = useSession();
  const [blocks, setBlocks] = useState<AvailabilityException[]>([]);
  const [newBlock, setNewBlock] = useState(createEmptyBlock());
  const [loading, setLoading] = useState<boolean>(true);
  const [adding, setAdding] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/signin");
    }

    if (status === "authenticated" && session?.user?.id) {
      fetchBlocks();
    }
  }, [status, session]);

  const fetchBlocks = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/v1/me/blocks"); // Assuming a GET /api/v1/me/blocks endpoint for listing
      if (!response.ok) {
        throw new Error("Failed to fetch availability blocks");
      }
      const data: AvailabilityException[] = await response.json();
      setBlocks(data);
    } catch (err: any) {
      setError(err.message || "Failed to load blocks.");
    } finally {
      setLoading(false);
    }
  };

  const handleNewBlockChange = (field: string, value: any) => {
    setNewBlock((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        ...newBlock,
        start: new Date(newBlock.start).toISOString(), // Ensure ISO string format
        end: new Date(newBlock.end).toISOString(), // Ensure ISO string format
      };

      // Client-side Zod validation
      const validationResult = createBlockSchema.safeParse(payload);
      if (!validationResult.success) {
        throw new Error(validationResult.error.errors.map(e => e.message).join(", "));
      }

      const response = await fetch("/api/v1/me/blocks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || "Failed to add block.");
      }

      setSuccess("Block added successfully!");
      setNewBlock(createEmptyBlock()); // Reset form
      fetchBlocks(); // Refresh list
    } catch (err: any) {
      setError(err.message || "An error occurred while adding the block.");
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteBlock = async (blockId: string) => {
    if (!confirm("Are you sure you want to delete this block?")) {
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/v1/me/blocks/${blockId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || "Failed to delete block.");
      }

      setSuccess("Block deleted successfully!");
      fetchBlocks(); // Refresh list
    } catch (err: any) {
      setError(err.message || "An error occurred while deleting the block.");
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Manage One-Off Availability Blocks</h1>
      <Link href="/dashboard" className="text-indigo-600 hover:underline mb-4 inline-block">
        &larr; Back to Dashboard
      </Link>

      <div className="bg-white rounded-lg shadow p-6 mt-4">
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">{error}</div>}
        {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">{success}</div>}

        <h2 className="text-xl font-semibold text-gray-800 mb-4">Add New Block</h2>
        <form onSubmit={handleAddBlock} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="start" className="block text-sm font-medium text-gray-700">
              Starts At (UTC)
            </label>
            <input
              type="datetime-local"
              id="start"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={newBlock.start}
              onChange={(e) => handleNewBlockChange("start", e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="end" className="block text-sm font-medium text-gray-700">
              Ends At (UTC)
            </label>
            <input
              type="datetime-local"
              id="end"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={newBlock.end}
              onChange={(e) => handleNewBlockChange("end", e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="state" className="block text-sm font-medium text-gray-700">
              State
            </label>
            <select
              id="state"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={newBlock.state}
              onChange={(e) =>
                handleNewBlockChange("state", e.target.value as AvailabilityState)
              }
              required
            >
              {Object.values(AvailabilityState).map((state) => (
                <option key={state} value={state}>
                  {state.charAt(0).toUpperCase() + state.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="public_label" className="block text-sm font-medium text-gray-700">
              Public Label (Optional)
            </label>
            <input
              type="text"
              id="public_label"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={newBlock.public_label}
              onChange={(e) => handleNewBlockChange("public_label", e.target.value)}
              maxLength={80}
            />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="private_note" className="block text-sm font-medium text-gray-700">
              Private Note (Optional)
            </label>
            <textarea
              id="private_note"
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={newBlock.private_note}
              onChange={(e) => handleNewBlockChange("private_note", e.target.value)}
              maxLength={500}
            ></textarea>
          </div>
          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={adding}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {adding ? "Adding..." : "Add Block"}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mt-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Upcoming Blocks</h2>
        {blocks.length === 0 ? (
          <p className="text-gray-600">No one-off availability blocks found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Starts At
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ends At
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    State
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Public Label
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Private Note
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {blocks.map((block) => (
                  <tr key={block.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(block.startsAt), "yyyy-MM-dd HH:mm")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(block.endsAt), "yyyy-MM-dd HH:mm")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {block.state.charAt(0).toUpperCase() + block.state.slice(1)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {block.publicLabel || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {block.privateNote || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDeleteBlock(block.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
