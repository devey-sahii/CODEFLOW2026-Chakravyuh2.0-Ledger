"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  Search,
  Bell,
  Sun,
  Moon,
  LogOut,
  User,
  Settings,
  ChevronDown,
  Check,
  Trash2,
  Sparkles,
  Info,
  AlertTriangle,
} from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { useUIStore } from "@/store/ui-store";

interface NavbarProps {
  onMenuToggle: () => void;
}

export default function Navbar({ onMenuToggle }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const theme = useUIStore((state) => state.theme);
  const setTheme = useUIStore((state) => state.setTheme);
  const notifications = useUIStore((state) => state.notifications);
  const unreadCount = useUIStore((state) => state.unreadCount);
  const markNotificationRead = useUIStore((state) => state.markNotificationRead);
  const markAllNotificationsRead = useUIStore((state) => state.markAllNotificationsRead);

  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const notificationsRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close menus on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard shortcut for search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        const searchInput = document.getElementById("nav-search-input");
        if (searchInput) searchInput.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLogout = () => {
    document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    logout();
    router.push("/login");
  };

  const getBreadcrumbs = () => {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length === 0) return [{ label: "Home", href: "/" }];
    return segments.map((seg, idx) => {
      const href = "/" + segments.slice(0, idx + 1).join("/");
      const label = seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " ");
      return { label, href };
    });
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="sticky top-0 z-30 h-16 w-full flex items-center justify-between px-4 lg:px-8 border-b-2 border-black bg-[#0c0d12] backdrop-blur-md">
      {/* Left side: Hamburger and Breadcrumbs */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="p-2 rounded bg-slate-800 border-2 border-black text-slate-200 hover:bg-slate-700 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 active:shadow-none transition-all lg:hidden"
          aria-label="Toggle Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Breadcrumbs */}
        <nav className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-slate-400">
          {breadcrumbs.map((crumb, idx) => (
            <div key={crumb.href} className="flex items-center gap-1.5">
              {idx > 0 && <span className="text-slate-600">/</span>}
              <span
                className={
                  idx === breadcrumbs.length - 1
                    ? "text-indigo-400 font-extrabold"
                    : "hover:text-slate-200 transition-colors"
                }
              >
                {crumb.label}
              </span>
            </div>
          ))}
        </nav>
      </div>

      {/* Center: CMD+K Search bar */}
      <div className="flex-1 max-w-md mx-6 relative hidden md:block">
        <div
          className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl border-2 border-black transition-all duration-200 ${
            searchFocused
              ? "bg-slate-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -translate-x-0.5 -translate-y-0.5"
              : "bg-slate-900/90 shadow-none hover:bg-slate-900"
          }`}
        >
          <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <input
            id="nav-search-input"
            type="text"
            placeholder="Search audits, employees, vendors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="w-full bg-transparent border-0 outline-none text-sm text-slate-100 placeholder:text-slate-500 font-medium"
          />
          <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-800 border-2 border-black text-[10px] text-slate-300 font-mono font-bold">
            <span>⌘</span>K
          </kbd>
        </div>
      </div>

      {/* Right side: Notifications, Theme, Profile */}
      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="w-10 h-10 rounded-xl bg-slate-800 border-2 border-black flex items-center justify-center text-slate-200 hover:bg-slate-700 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all"
          aria-label="Toggle Theme"
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </button>

        {/* Notifications Bell */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-10 h-10 rounded-xl bg-slate-800 border-2 border-black flex items-center justify-center text-slate-200 hover:bg-slate-700 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all relative"
            aria-label="View Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-black" />
            )}
          </button>          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-80 rounded-2xl p-2 z-50 overflow-hidden bg-slate-900 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                <div className="flex items-center justify-between px-3 py-2 border-b-2 border-black">
                  <span className="text-xs font-bold text-white">Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllNotificationsRead}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-[300px] overflow-y-auto divide-y-2 divide-black py-1">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-500 font-bold">
                      No new notifications
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markNotificationRead(n.id)}
                        className={`p-3 text-xs flex gap-2.5 cursor-pointer hover:bg-slate-800 transition-colors ${
                          !n.is_read ? "bg-indigo-950/40" : ""
                        }`}
                      >
                        <div className="w-6 h-6 rounded bg-indigo-600 border border-black flex items-center justify-center text-white flex-shrink-0">
                          {n.type === "fraud_detected" ? (
                            <AlertTriangle className="w-3.5 h-3.5 text-red-300" />
                          ) : (
                            <Info className="w-3.5 h-3.5 text-white" />
                          )}
                        </div>
                        <div className="space-y-0.5">
                          <p className="font-bold text-white">{n.title}</p>
                          <p className="text-slate-400 line-clamp-2 leading-relaxed font-semibold">{n.message}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Profile Dropdown */}
        <div className="relative" ref={profileMenuRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-slate-800 border-2 border-black hover:bg-slate-700 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all text-slate-200"
          >
            <div className="w-7 h-7 rounded bg-indigo-600 border border-black flex items-center justify-center text-white text-xs font-bold font-mono">
              {user?.full_name ? user.full_name.charAt(0) : "U"}
            </div>
            <span className="text-xs font-bold hidden sm:inline-block max-w-[100px] truncate">
              {user?.full_name ?? "User Profile"}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 font-bold" />
          </button>

          <AnimatePresence>
            {showProfileMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-56 rounded-2xl p-2 z-50 overflow-hidden bg-slate-900 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                <div className="px-3 py-2 border-b-2 border-black">
                  <p className="text-xs font-bold text-white truncate">{user?.full_name ?? "Corporate Admin"}</p>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5 font-semibold">{user?.email ?? "admin@company.in"}</p>
                </div>

                <div className="py-1 space-y-1">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      router.push("/dashboard/settings");
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800 hover:border-2 hover:border-black transition-all text-left font-bold"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    Account Settings
                  </button>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-red-400 hover:text-red-200 hover:bg-red-950/45 hover:border-2 hover:border-black transition-all text-left font-bold"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Log Out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
