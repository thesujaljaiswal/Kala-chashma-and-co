"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  return (
    <nav className="w-full bg-white/5 backdrop-blur-md border-b border-white/10 sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Link href="/" className="text-xl font-bold text-white tracking-wide">
              KaalaCHASMA <span className="text-orange-500">&</span> co
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {status === "loading" ? (
              <div className="w-20 h-6 bg-white/10 animate-pulse rounded-md"></div>
            ) : session?.user ? (
              <div className="flex items-center gap-4">
                <span className="text-gray-300 text-sm hidden sm:block">
                  Hello, <span className="font-semibold text-white">{session.user.name}</span>
                </span>
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="text-sm px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors border border-white/5"
                >
                  Sign Out
                </button>
              </div>
            ) : pathname !== "/login" ? (
              <Link 
                href="/login"
                className="text-sm px-5 py-2 bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-600 hover:to-rose-700 text-white font-medium rounded-lg transition-all shadow-lg"
              >
                Admin Login
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </nav>
  );
}
