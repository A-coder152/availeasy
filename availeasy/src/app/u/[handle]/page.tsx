import { NextPage } from "next";
import { findUserByHandle } from "@/lib/repositories/user";
import { getAvailabilityForRange } from "@/lib/availability/calculate";
import { getCurrentStatusByUserId } from "@/lib/repositories/currentStatus";
import { toPublicStatus } from "@/lib/public-safety";
import { addDays, format } from "date-fns";
import { AvailabilityState } from "@prisma/client";
import { notFound } from "next/navigation";
import Script from "next/script";

interface UserPublicPageProps {
  params: {
    handle: string;
  };
}

const UserPublicPage: NextPage<UserPublicPageProps> = async ({ params }) => {
  const { handle } = params;

  const user = await findUserByHandle(handle);
  if (!user) {
    notFound();
  }

  const userTimezone = user.timezone;
  const now = new Date();
  const nextSevenDays = addDays(now, 7);

  // Get current status
  const currentStatus = await getCurrentStatusByUserId(user.id);
  const publicStatus = toPublicStatus(currentStatus, userTimezone);

  // Get availability windows for next 7 days
  const availabilityWindows = await getAvailabilityForRange({
    userId: user.id,
    from: now,
    to: nextSevenDays,
    timezone: userTimezone,
  });

  const embedSnippet = `
    <div id="availability-widget" data-user="${handle}"></div>
    <script src="${process.env.NEXTAUTH_URL}/u/${handle}/embed.js"></script>
  `;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <Script src={`${process.env.NEXTAUTH_URL}/u/${handle}/embed.js`} strategy="lazyOnload" />

      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        {user.name || `@${handle}`}&apos;s Availability
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Current Status</h2>
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`w-3 h-3 rounded-full ${
                publicStatus.state === AvailabilityState.available
                  ? "bg-green-500"
                  : publicStatus.state === AvailabilityState.busy
                  ? "bg-red-500"
                  : publicStatus.state === AvailabilityState.unavailable
                  ? "bg-orange-500"
                  : "bg-gray-500" // Offline/Custom
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
              {format(new Date(publicStatus.valid_until), "MMM d, yyyy HH:mm", {
                timeZone: userTimezone,
              })}
            </p>
          )}
        </div>

        {/* Availability for Next 7 Days */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Next 7 Days Availability</h2>
          {availabilityWindows.length === 0 ? (
            <p className="text-gray-600">No availability windows found for the next 7 days.</p>
          ) : (
            <ul className="space-y-2">
              {availabilityWindows.map((window, index) => (
                <li key={index} className="text-sm text-gray-800">
                  <span
                    className={`inline-block w-2 h-2 rounded-full mr-2 ${
                      window.state === AvailabilityState.available
                        ? "bg-green-500"
                        : window.state === AvailabilityState.unavailable
                        ? "bg-red-500"
                        : "bg-gray-500"
                    }`}
                  ></span>
                  {format(new Date(window.start), "MMM d, HH:mm", {
                    timeZone: userTimezone,
                  })}{" "}
                  -{" "}
                  {format(new Date(window.end), "HH:mm", {
                    timeZone: userTimezone,
                  })}{" "}
                  ({window.state.toLowerCase()}) {window.label && `(${window.label})`}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Embed Snippet */}
      <div className="bg-white rounded-lg shadow p-6 mt-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Embed Widget</h2>
        <p className="text-gray-600 mb-4">
          Copy and paste this HTML snippet into your website to display your live availability.
        </p>
        <pre className="bg-gray-100 p-4 rounded-md text-sm overflow-x-auto">
          <code>{embedSnippet}</code>
        </pre>
        <button
          onClick={() => navigator.clipboard.writeText(embedSnippet)}
          className="mt-4 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Copy Embed Snippet
        </button>

        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Live Demo</h3>
          <div id="availability-widget" data-user={handle} className="border p-4 rounded-md">
            {/* Widget will render here */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserPublicPage;
