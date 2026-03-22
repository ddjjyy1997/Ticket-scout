"use client";

import { useState } from "react";
import { SessionProvider } from "next-auth/react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { CheckoutGate } from "@/components/checkout-gate";
import { Suspense } from "react";
import { TrackGoogleSignup } from "@/components/tiktok-events";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <SessionProvider>
      <CheckoutGate>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <MobileNav open={mobileNavOpen} onOpenChange={setMobileNavOpen} />
          <div className="flex flex-1 flex-col overflow-hidden">
            <Header onMenuClick={() => setMobileNavOpen(true)} />
            <main className="flex-1 overflow-auto p-4 md:p-6">
              <Suspense><TrackGoogleSignup /></Suspense>
              {children}
            </main>
          </div>
        </div>
      </CheckoutGate>
    </SessionProvider>
  );
}
