"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { motion, useMotionValue, useMotionTemplate } from "framer-motion";
import { useState } from "react";

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [isHovered, setIsHovered] = useState(false);

  const maskImage = useMotionTemplate`radial-gradient(150px circle at ${mouseX}px ${mouseY}px, black, transparent)`;

  return (
    <nav 
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        mouseX.set(e.clientX - rect.left);
        mouseY.set(e.clientY - rect.top);
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="w-full bg-gradient-to-br from-orange-950 via-red-950 to-stone-950 border-b border-orange-500/20 sticky top-0 z-50 transition-all duration-300 shadow-lg overflow-hidden relative"
    >
      
      {/* Intellectual Ambient Art (Luxury / Heritage Aesthetic) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Slow Breathing Aurora Lights */}
        <div className="absolute -inset-20 opacity-30">
          <div className="absolute top-[-50px] left-1/4 w-[300px] h-[300px] bg-[#E86A28] rounded-full mix-blend-screen filter blur-[80px] animate-pulse" style={{ animationDuration: '8s' }}></div>
          <div className="absolute top-[-50px] right-1/4 w-[300px] h-[300px] bg-[#C69C6D] rounded-full mix-blend-screen filter blur-[80px] animate-pulse" style={{ animationDuration: '12s', animationDelay: '2s' }}></div>
        </div>
        
        {/* Base Subtle Lattice */}
        <div className="absolute inset-0 opacity-[0.05]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23ffffff' stroke-width='0.5'%3E%3Cpath d='M30 0 L60 30 L30 60 L0 30 Z'/%3E%3Cpath d='M30 15 L45 30 L30 45 L15 30 Z' opacity='0.5'/%3E%3Ccircle cx='30' cy='30' r='3' opacity='0.3'/%3E%3Cpath d='M0 0 L60 60 M60 0 L0 60' opacity='0.15'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }}></div>

        {/* Dynamic Mouse Spotlight Pattern Overlay */}
        <motion.div 
          className="absolute inset-0"
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.5 }}
          style={{
            WebkitMaskImage: maskImage,
            maskImage: maskImage
          }}
        >
          <div className="absolute inset-0 opacity-[0.45]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23ffffff' stroke-width='0.5'%3E%3Cpath d='M30 0 L60 30 L30 60 L0 30 Z'/%3E%3Cpath d='M30 15 L45 30 L30 45 L15 30 Z' opacity='0.5'/%3E%3Ccircle cx='30' cy='30' r='3' opacity='0.3'/%3E%3Cpath d='M0 0 L60 60 M60 0 L0 60' opacity='0.15'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}></div>
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 relative z-10">
        <div className="flex items-center justify-between h-16 gap-2">
          <div className="flex items-center">
            <Link href="/" className="text-sm sm:text-xl font-bold text-white tracking-wide truncate max-w-[150px] xs:max-w-[200px] sm:max-w-none">
              KaalaCHASMA <span className="text-orange-500">&</span> co
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {status === "loading" ? (
              <div className="w-20 h-6 bg-white/10 animate-pulse rounded-md"></div>
            ) : session?.user ? (
              <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                <span className="text-gray-300 text-sm hidden sm:block z-10">
                  Hello, <span className="font-semibold text-white">{session.user.name}</span>
                </span>
                <Link
                  href="/manage-treks"
                  className="text-xs sm:text-sm px-2.5 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-600 hover:to-rose-700 text-white font-medium rounded-lg transition-all shadow-lg z-10 whitespace-nowrap"
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="text-xs sm:text-sm px-2.5 py-1.5 sm:px-4 sm:py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors border border-white/5 z-10 whitespace-nowrap"
                >
                  Sign Out
                </button>
              </div>
            ) : pathname !== "/login" ? (
              <Link 
                href="/login"
                className="text-xs sm:text-sm px-4 py-1.5 sm:px-5 sm:py-2 bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-600 hover:to-rose-700 text-white font-medium rounded-lg transition-all shadow-lg whitespace-nowrap"
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
