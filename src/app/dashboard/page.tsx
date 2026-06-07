import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentStatusByUserId } from "@/lib/repositories/currentStatus";
import { toPublicStatus } from "@/lib/public-safety";
import { findUserById } from "@/lib/repositories/user";
import { getAvailabilityForRange } from "@/lib/availability/calculate";
import { addDays, addHours, format } from "date-fns";
import { AvailabilityState, CurrentStatusState } from "@prisma/client";
import Tooltip from "@/components/Tooltip";
import ThemeToggle from "@/components/ThemeToggle";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/signin");
  }

  const userId = session.user.id;
  const user = await findUserById(userId);
  if (!user) {
    redirect("/signin");
  }

  const userTimezone = user.timezone;
  const now = new Date();
  const publicStatus = toPublicStatus(await getCurrentStatusByUserId(userId), userTimezone);
  const availabilityWindows = await getAvailabilityForRange({
    userId,
    from: now,
    to: addDays(now, 7),
    timezone: userTimezone,
  });

  const nextAvailable = availabilityWindows.find(
    (w) => w.state === AvailabilityState.available && new Date(w.end) > now
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400">Welcome back, {user.handle}.</p>
          </div>
          <div className="flex gap-4 items-center">
            <Link href={`/u/${user.handle}`} className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
              Public Page &rarr;
            </Link>
            <form action="/api/auth/signout" method="POST">
              <button type="submit" className="text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 text-sm font-semibold">
                Sign Out
              </button>
            </form>
            <ThemeToggle />
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <Tooltip text="The status others see when they check your availability.">
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                Current Status
                <span className="text-gray-400 font-normal text-sm">(?)</span>
              </h2>
            </Tooltip>
            <div className="flex items-center gap-3 mb-4">
              <span className={`w-4 h-4 rounded-full ${publicStatus.state === 'available' ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span className="text-xl font-semibold capitalize text-gray-800 dark:text-gray-200">{publicStatus.state}</span>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-6">
              {[
                { state: 'available', label: 'Available', color: 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-300' },
                { state: 'busy', label: 'Busy (1h)', color: 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-300', val: addHours(now, 1) },
                { state: 'away', label: 'Away (1d)', color: 'bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900 dark:text-orange-300', val: addDays(now, 1) },
                { state: 'offline', label: 'Offline', color: 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300' },
              ].map((s) => (
                <form key={s.state} action="/api/v1/me/status" method="POST">
                  <input type="hidden" name="state" value={s.state} />
                  {s.val && <input type="hidden" name="valid_until" value={s.val.toISOString()} />}
                  <button type="submit" className={`px-4 py-2 text-sm font-medium rounded-full ${s.color}`}>
                    {s.label}
                  </button>
                </form>
              ))}
            </div>
          </section>

          <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
             <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">Next Window</h2>
             {nextAvailable ? (
                <p className="text-lg text-gray-700 dark:text-gray-300">
                  Available from {format(new Date(nextAvailable.start), 'MMM d, h:mm a')}
                </p>
             ) : (
                <p className="text-gray-500 dark:text-gray-400">No upcoming windows.</p>
             )}
          </section>
        </div>

        <nav className="mt-8 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">Management</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Weekly Rules', href: '/dashboard/rules', tip: 'Set your regular working hours.' },
              { label: 'One-Off Blocks', href: '/dashboard/blocks', tip: 'Override rules for specific dates.' },
              { label: 'Custom Status', href: '/dashboard/status', tip: 'Set a specific status message.' },
              { label: 'API Tokens', href: '/dashboard/api-tokens', tip: 'Generate tokens for integrations.' },
            ].map(link => (
              <Tooltip key={link.href} text={link.tip}>
                <Link href={link.href} className="block p-4 text-center rounded-xl bg-gray-50 dark:bg-gray-700 hover:bg-indigo-50 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-semibold">
                  {link.label}
                </Link>
              </Tooltip>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
