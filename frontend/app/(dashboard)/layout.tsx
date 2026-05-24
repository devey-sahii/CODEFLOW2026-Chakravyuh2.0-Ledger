"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "@/components/layout/sidebar";
import Navbar from "@/components/layout/navbar";
import Silk from "@/components/ui/silk";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0b0f] relative">
      {/* Twilight atmospheric starry background */}
      <div className="absolute inset-0 z-0">
        <Silk
          speed={5}
          scale={1}
          color="#5227FF"
          noiseIntensity={1.5}
          rotation={0}
        />
      </div>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar — desktop */}
      <div className="hidden lg:flex flex-shrink-0 z-10 relative">
        <Sidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />
      </div>

      {/* Sidebar — mobile */}
      <div className="lg:hidden z-50 relative">
        <AnimatePresence>
          {mobileSidebarOpen && (
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed left-0 top-0 bottom-0 z-50"
            >
              <Sidebar
                isOpen={true}
                onToggle={() => setMobileSidebarOpen(false)}
                isMobile
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main area */}
      <div className="flex flex-col flex-1 overflow-hidden z-10 relative">
        {/* Navbar */}
        <Navbar
          onMenuToggle={() => {
            if (window.innerWidth >= 1024) {
              setSidebarOpen(!sidebarOpen);
            } else {
              setMobileSidebarOpen(!mobileSidebarOpen);
            }
          }}
        />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {children}
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}

