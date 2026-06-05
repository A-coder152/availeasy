import Link from "next/link";
import { auth, signIn, signOut } from "@/lib/auth";

export default async function Home() {
  const session = await auth();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-gray-50">
      <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
        <h1 className="text-6xl font-bold text-gray-900">
          Welcome to <span className="text-indigo-600">Availeasy</span>
        </h1>

        <p className="mt-3 text-2xl text-gray-700">
          Your API-first personal availability service.
        </p>

        <div className="flex flex-wrap items-center justify-around max-w-4xl mt-6 sm:w-full">
          <div className="p-6 mt-6 text-left border w-96 rounded-xl hover:text-indigo-600 focus:text-indigo-600">
            <h3 className="text-2xl font-bold">Define & Publish &rarr;</h3>
            <p className="mt-4 text-xl">
              Set your availability rules, add exceptions, and publish your status.
            </p>
          </div>

          <div className="p-6 mt-6 text-left border w-96 rounded-xl hover:text-indigo-600 focus:text-indigo-600">
            <h3 className="text-2xl font-bold">Embed Anywhere &rarr;</h3>
            <p className="mt-4 text-xl">
              Integrate your availability with websites, apps, and workflows.
            </p>
          </div>

          <div className="mt-8">
            {session ? (
              <div className="flex flex-col items-center">
                <p className="text-lg text-gray-800">
                  Signed in as {session.user?.email || "User"}
                </p>
                <Link href="/dashboard" className="mt-4 px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                  Go to Dashboard
                </Link>
                <form
                  action={async () => {
                    "use server";
                    await signOut();
                  }}
                  className="mt-4"
                >
                  <button type="submit" className="text-indigo-600 hover:text-indigo-900">
                    Sign Out
                  </button>
                </form>
              </div>
            ) : (
              <form
                action={async () => {
                  "use server";
                  await signIn(); // Redirects to /api/auth/signin
                }}
              >
                <button type="submit" className="px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                  Sign In / Sign Up
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="mt-12">
          <h2 className="text-3xl font-bold text-gray-900">Demo Widget</h2>
          <p className="mt-2 text-lg text-gray-700">
            See how your availability can be displayed:
          </p>
          {/* Demo widget placeholder */}
          <div id="availability-widget" data-user="demo" className="mt-4 mx-auto"></div>
          {/* In a real app, you'd include the embed.js script here for the demo */}
          {/* <script src="/u/demo/embed.js"></script> */}
        </div>
      </main>

      <footer className="flex items-center justify-center w-full h-24 border-t mt-8">
        <a
          className="flex items-center justify-center"
          href="https://github.com/your-repo"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by Availeasy
        </a>
      </footer>
    </div>
  );
}
