import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentStatusByUserId } from "@/lib/repositories/currentStatus";
import { toPublicStatus } from "@/lib/public-safety";
import { findUserById } from "@/lib/repositories/user";
import { getAvailabilityForRange } from "@/lib/availability/calculate";
import { addDays, addHours } from "date-fns";
import { AvailabilityState, CurrentStatusState } from "@prisma/client";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/signin"); // Redirect to sign-in page if not authenticated
  }

  const userId = session.user.id;
  const user = await findUserById(userId);

  if (!user) {
    // This should ideally not happen if session.user.id is valid
    redirect("/signin");
  }

  const userTimezone = user.timezone;
  const now = new Date();

  // Fetch current status
  const currentStatus = await getCurrentStatusByUserId(userId);
  const publicStatus = toPublicStatus(currentStatus, userTimezone);

  // Fetch next available window
  const nextSevenDays = addDays(now, 7);
  const availabilityWindows = await getAvailabilityForRange({
    userId,
    from: now,
    to: nextSevenDays,
    timezone: userTimezone,
  });

  const nextAvailableWindow = availabilityWindows.find(
    (window) => window.state === AvailabilityState.available && new Date(window.end) > now
  );

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Current Status Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Current Status</h2>
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`w-3 h-3 rounded-full ${
                publicStatus.state === CurrentStatusState.available
                  ? "bg-green-500"
                  : publicStatus.state === CurrentStatusState.busy
                  ? "bg-red-500"
                  : publicStatus.state === CurrentStatusState.away
                  ? "bg-orange-500"
                  : publicStatus.state === CurrentStatusState.offline
                  ? "bg-gray-500"
                  : "bg-indigo-500" // Custom
              }`}
            ></span>
            <span className="text-lg font-medium">
              {publicStatus.state.charAt(0).toUpperCase() + publicStatus.state.slice(1)}
            </span>
          </div>
          {publicStatus.message && (
            <p className="text-gray-600 text-sm mb-2">"{publicStatus.message}"</p>
          )}
          {publicStatus.valid_until && (
            <p className="text-gray-500 text-xs">
              Until:{" "}
              {new Date(publicStatus.valid_until).toLocaleString("en-US", {
                timeZone: userTimezone,
                hour: "numeric",
                minute: "numeric",
                day: "numeric",
                month: "short",
              })}
            </p>
          )}

          <div className="mt-4 border-t pt-4">
            <h3 className="text-md font-semibold mb-2">Quick Status Update:</h3>
            <div className="flex flex-wrap gap-2">
              <form action="/api/v1/me/status" method="POST"> {/* Using POST for simplicity in forms, will convert to PUT in API route */}
                <input type="hidden" name="state" value="available" />
                <button type="submit" className="px-3 py-1 text-sm rounded-md bg-green-500 text-white hover:bg-green-600">
                  Available
                </button>
              </form>
              <form action="/api/v1/me/status" method="POST">
                <input type="hidden" name="state" value="busy" />
                <input type="hidden" name="valid_until" value={addHours(now, 1).toISOString()} />
                <button type="submit" className="px-3 py-1 text-sm rounded-md bg-red-500 text-white hover:bg-red-600">
                  Busy for 1h
                </button>
              </form>
              <form action="/api/v1/me/status" method="POST">
                <input type="hidden" name="state" value="away" />
                <input type="hidden" name="valid_until" value={addDays(now, 1).toISOString()} />
                <button type="submit" className="px-3 py-1 text-sm rounded-md bg-orange-500 text-white hover:bg-orange-600">
                  Away until tomorrow
                </button>
              </form>
              <form action="/api/v1/me/status" method="POST">
                <input type="hidden" name="state" value="offline" />
                <button type="submit" className="px-3 py-1 text-sm rounded-md bg-gray-500 text-white hover:bg-gray-600">
                  Offline
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Next Available Window Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Next Available Window</h2>
          {nextAvailableWindow ? (
            <>
              <p className="text-lg font-medium mb-1">
                {new Date(nextAvailableWindow.start).toLocaleString("en-US", {
                  timeZone: userTimezone,
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "numeric",
                  minute: "numeric",
                })}{" "}
                -{" "}
                {new Date(nextAvailableWindow.end).toLocaleString("en-US", {
                  timeZone: userTimezone,
                  hour: "numeric",
                  minute: "numeric",
                })}
              </p>
              <p className="text-gray-500 text-sm">Timezone: {userTimezone}</p>
            </>
          ) : (
            <p className="text-lg text-gray-600">No upcoming available windows.</p>
          )}
        </div>

        {/* Navigation Links */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Manage</h2>
          <ul className="space-y-2">
            <li>
              <Link href="/dashboard/rules" className="text-indigo-600 hover:underline">
                Manage Weekly Rules
              </Link>
            </li>
            <li>
              <Link href="/dashboard/blocks" className="text-indigo-600 hover:underline">
                Manage One-Off Blocks
              </Link>
            </li>
            <li>
              <Link href="/dashboard/status" className="text-indigo-600 hover:underline">
                Update Custom Status
              </Link>
            </li>
            <li>
              <Link href="/dashboard/api-tokens" className="text-indigo-600 hover:underline">
                Manage API Tokens
              </Link>
            </li>
            <li>
              <Link href={`/u/${user.handle}`} className="text-indigo-600 hover:underline">
                Your Public Page
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
