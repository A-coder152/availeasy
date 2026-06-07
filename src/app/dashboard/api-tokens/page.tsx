"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ApiToken } from "@prisma/client";
import { createApiTokenSchema } from "@/lib/availability/validation";
import { format } from "date-fns";

type ApiTokenWithPlainText = ApiToken & { plainTextToken?: string };

export default function ApiTokensPage() {
  const { data: session, status } = useSession();
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [newTokenName, setNewTokenName] = useState<string>("");
  const [newTokenScopes, setNewTokenScopes] = useState<string[]>(["read"]);
  const [generatedToken, setGeneratedToken] = useState<ApiTokenWithPlainText | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [creating, setCreating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const availableScopes = ["read", "write", "write/status", "write/blocks", "write/rules", "admin"];

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/signin");
    }

    if (status === "authenticated" && session?.user?.id) {
      fetchApiTokens();
    }
  }, [status, session]);

  const fetchApiTokens = async () => {
    setLoading(true);
    setError(null);
    try {
      // Assuming a GET /api/v1/me/api-tokens endpoint for listing
      const response = await fetch("/api/v1/me/api-tokens");
      if (!response.ok) {
        throw new Error("Failed to fetch API tokens");
      }
      const data: ApiToken[] = await response.json();
      setTokens(data);
    } catch (err: any) {
      setError(err.message || "Failed to load API tokens.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    setSuccess(null);
    setGeneratedToken(null);

    try {
      const payload = {
        name: newTokenName,
        scopes: newTokenScopes,
      };

      // Client-side Zod validation
      const validationResult = createApiTokenSchema.safeParse(payload);
      if (!validationResult.success) {
        throw new Error(validationResult.error.issues.map(e => e.message).join(", "));
      }

      const response = await fetch("/api/v1/me/api-tokens", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || "Failed to create API token.");
      }

      const data = await response.json();
      setGeneratedToken({ ...data, plainTextToken: data.token });
      setNewTokenName(""); // Reset form
      setNewTokenScopes(["read"]);
      setSuccess("API token created successfully! Copy the token below, it will not be shown again.");
      fetchApiTokens(); // Refresh list
    } catch (err: any) {
      setError(err.message || "An error occurred while creating the API token.");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteToken = async (tokenId: string) => {
    if (!confirm("Are you sure you want to delete this API token? This action cannot be undone.")) {
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/v1/me/api-tokens/${tokenId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || "Failed to delete API token.");
      }

      setSuccess("API token deleted successfully!");
      fetchApiTokens(); // Refresh list
    } catch (err: any) {
      setError(err.message || "An error occurred while deleting the API token.");
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
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Manage API Tokens</h1>
      <Link href="/dashboard" className="text-indigo-600 hover:underline mb-4 inline-block">
        &larr; Back to Dashboard
      </Link>

      <div className="bg-white rounded-lg shadow p-6 mt-4">
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">{error}</div>}
        {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">{success}</div>}

        <h2 className="text-xl font-semibold text-gray-800 mb-4">Create New API Token</h2>
        <form onSubmit={handleCreateToken} className="space-y-4">
          <div>
            <label htmlFor="tokenName" className="block text-sm font-medium text-gray-700">
              Token Name
            </label>
            <input
              type="text"
              id="tokenName"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={newTokenName}
              onChange={(e) => setNewTokenName(e.target.value)}
              required
              maxLength={100}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Scopes</label>
            <div className="mt-1 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {availableScopes.map((scope) => (
                <div key={scope} className="flex items-center">
                  <input
                    id={`scope-${scope}`}
                    type="checkbox"
                    value={scope}
                    checked={newTokenScopes.includes(scope)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setNewTokenScopes([...newTokenScopes, scope]);
                      } else {
                        setNewTokenScopes(newTokenScopes.filter((s) => s !== scope));
                      }
                    }}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  />
                  <label htmlFor={`scope-${scope}`} className="ml-2 block text-sm text-gray-900">
                    {scope}
                  </label>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={creating || newTokenScopes.length === 0}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {creating ? "Creating..." : "Generate New Token"}
            </button>
          </div>
        </form>

        {generatedToken && generatedToken.plainTextToken && (
          <div className="bg-yellow-50 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative mt-6">
            <p className="font-bold">Your new API Token (Copy this now!)</p>
            <p className="break-all font-mono text-sm mt-2">{generatedToken.plainTextToken}</p>
            <button
              onClick={() =>
                navigator.clipboard.writeText(generatedToken.plainTextToken || "")
              }
              className="mt-2 text-indigo-600 hover:text-indigo-900 text-sm"
            >
              Copy to clipboard
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6 mt-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Your API Tokens</h2>
        {tokens.length === 0 ? (
          <p className="text-gray-600">No API tokens found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prefix
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Scopes
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created At
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Used
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tokens.map((token) => (
                  <tr key={token.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {token.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {token.tokenPrefix}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(token.scopes as string[]).join(", ")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(token.createdAt), "yyyy-MM-dd HH:mm")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {token.lastUsedAt ? format(new Date(token.lastUsedAt), "yyyy-MM-dd HH:mm") : "Never"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDeleteToken(token.id)}
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
