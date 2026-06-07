import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { signIn, signOut } from "next-auth/react";

// Server components can't use next-auth/react (signIn/signOut), 
// so we need a client component wrapper for them or link to a signin page.
// For the landing page, we'll use a link to the signin page.
export default async function Home() {
  const session = await getServerSession(authOptions);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
        <h1 className="text-6xl font-bold text-gray-900 dark:text-gray-100">
          Welcome to <span className="text-indigo-600 dark:text-indigo-400">Availeasy</span>
        </h1>

        <p className="mt-3 text-2xl text-gray-700 dark:text-gray-300">
          Your API-first personal availability service.
        </p>

        <div className="mt-8">
          {session ? (
            <div className="flex flex-col items-center">
              <p className="text-lg text-gray-800 dark:text-gray-200">
                Signed in as {session.user?.email || "User"}
              </p>
              <Link href="/dashboard" className="mt-4 px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                Go to Dashboard
              </Link>
              <Link href="/api/auth/signout" className="mt-4 text-indigo-600 hover:text-indigo-900">
                Sign Out
              </Link>
            </div>
          ) : (
            <Link href="/api/auth/signin" className="px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                Sign In / Sign Up
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
