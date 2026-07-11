import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import Navbar from "@/components/Navbar";
import PixelBlast from "@/components/PixelBlast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KaalaCHASMA & co",
  description: "Your journey starts here.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gradient-to-br from-orange-950 via-red-950 to-stone-950">
        <div className="fixed inset-0 z-0 pointer-events-none opacity-30">
          <PixelBlast
            variant="circle"
            pixelSize={6}
            color="#ff6b00"
            patternScale={3}
            patternDensity={1.2}
            pixelSizeJitter={0.5}
            enableRipples={true}
            rippleSpeed={0.4}
            rippleThickness={0.12}
            rippleIntensityScale={1.5}
            liquid={true}
            liquidStrength={0.12}
            liquidRadius={1.2}
            liquidWobbleSpeed={5}
            speed={0.6}
            edgeFade={0.25}
            transparent={true}
          />
        </div>
        <Providers>
          <div className="relative z-10 flex flex-col min-h-full">
            <Navbar />
            <div className="flex-grow">
              {children}
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
