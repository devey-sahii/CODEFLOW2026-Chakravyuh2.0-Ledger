"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Upload,
  FileText,
  ShieldAlert,
  Receipt,
  Brain,
  Building2,
  Users,
  BarChart3,
  ScrollText,
  Plug,
  Settings,
  ShieldCheck,
  ChevronLeft,
  LogOut,
  ChevronRight,
  X,
  ScanLine,
} from "lucide-react";
import { useAuthStore } from "@/store/auth-store";

// ─── Types ────────────────────────────────────────────────────────────────────

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
  rolesAllowed?: string[];
};

type NavSection = {
  title: string;
  items: NavItem[];
};

// ─── Navigation config ────────────────────────────────────────────────────────

const navSections: NavSection[] = [
  {
    title: "MAIN",
    items: [
      { label: "Dashboard Overview", href: "/dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
      { label: "Upload Receipt", href: "/dashboard/upload", icon: <Upload className="w-4 h-4" />, rolesAllowed: ["admin", "finance_manager", "employee"] },
      { label: "Expense Claims", href: "/dashboard/expenses", icon: <FileText className="w-4 h-4" />, badge: 12 },
    ],
  },
  {
    title: "DETECTION & AI",
    items: [
      { label: "Fraud Alerts", href: "/dashboard/fraud", icon: <ShieldAlert className="w-4 h-4" />, badge: 3, rolesAllowed: ["admin", "finance_manager", "auditor"] },
      { label: "Receipt Authenticity", href: "/dashboard/receipt-verify", icon: <ScanLine className="w-4 h-4" /> },
      { label: "GST Compliance", href: "/dashboard/gst", icon: <Receipt className="w-4 h-4" />, rolesAllowed: ["admin", "finance_manager", "auditor"] },
      { label: "AI Recommendations", href: "/dashboard/risk-reports", icon: <Brain className="w-4 h-4" />, rolesAllowed: ["admin", "finance_manager", "auditor"] },
    ],
  },
  {
    title: "MANAGEMENT",
    items: [
      { label: "Vendors", href: "/dashboard/vendors", icon: <Building2 className="w-4 h-4" />, rolesAllowed: ["admin", "finance_manager", "auditor"] },
      { label: "Employees", href: "/dashboard/employees", icon: <Users className="w-4 h-4" />, rolesAllowed: ["admin", "finance_manager"] },
    ],
  },
  {
    title: "INSIGHTS",
    items: [
      { label: "Analytics", href: "/dashboard/analytics", icon: <BarChart3 className="w-4 h-4" />, rolesAllowed: ["admin", "finance_manager", "auditor"] },
      { label: "Activity Timeline", href: "/dashboard/audit-logs", icon: <ScrollText className="w-4 h-4" />, rolesAllowed: ["admin", "auditor"] },
      { label: "Integrations", href: "/dashboard/integrations", icon: <Plug className="w-4 h-4" />, rolesAllowed: ["admin", "finance_manager"] },
    ],
  },
  {
    title: "SYSTEM",
    items: [
      { label: "Settings", href: "/dashboard/settings", icon: <Settings className="w-4 h-4" />, rolesAllowed: ["admin"] },
    ],
  },
];

// ─── Tooltip ─────────────────────────────────────────────────────────────────

function NavTooltip({ label, children }: { label: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  return (
    <div
      className="relative"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white font-medium whitespace-nowrap z-50 pointer-events-none"
          >
            {label}
            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-800" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  isMobile?: boolean;
}

export default function Sidebar({ isOpen, onToggle, isMobile }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const user = useAuthStore((state) => state.user);
  const userRole = user?.role || "admin";

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "selected_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    logout();
    router.push("/login");
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin": return "Admin";
      case "finance_manager": return "Finance Manager";
      case "auditor": return "Auditor";
      case "employee": return "Employee";
      default: return role.charAt(0).toUpperCase() + role.slice(1);
    }
  };

  const filteredSections = navSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (!item.rolesAllowed) return true;
        return item.rolesAllowed.includes(userRole);
      }),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <motion.aside
      initial={false}
      animate={{ width: isOpen ? 280 : 72 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="relative flex flex-col h-full overflow-hidden"
      style={{
        background: "#0c0d12",
        borderRight: "2px solid #000000",
      }}
    >
      {/* Header */}
      <div className="flex items-center h-16 px-4 flex-shrink-0 border-b-2 border-black">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-indigo-600 border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col min-w-0"
              >
                <span className="text-base font-bold text-white tracking-tight leading-none">
                  LEDGER
                </span>
                <span className="text-[10px] text-indigo-400 font-bold tracking-widest uppercase leading-none mt-0.5">
                  AI Platform
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Toggle button */}
        <button
          onClick={onToggle}
          className="flex-shrink-0 w-7 h-7 rounded bg-slate-800 border-2 border-black flex items-center justify-center text-slate-200 hover:bg-slate-700 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 active:shadow-none transition-all"
        >
          {isMobile ? (
            <X className="w-3.5 h-3.5" />
          ) : isOpen ? (
            <ChevronLeft className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2 space-y-5">
        {filteredSections.map((section) => (
          <div key={section.title} className="space-y-1">
            {/* Section title */}
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="px-3 pt-1 pb-1"
                >
                  <span className="text-[10px] font-semibold text-slate-600 tracking-widest">
                    {section.title}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Items */}
            {section.items.map((item) => {
              const active = isActive(item.href);
              const el = (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group border-2 ${
                    active
                      ? "bg-indigo-600 text-white border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-bold"
                      : "text-slate-400 border-transparent hover:text-slate-100 hover:bg-slate-800 hover:border-black font-semibold"
                  }`}
                >
                  {/* Icon */}
                  <span
                    className={`flex-shrink-0 transition-colors ${
                      active
                        ? "text-white"
                        : "text-slate-400 group-hover:text-slate-200"
                    }`}
                  >
                    {item.icon}
                  </span>

                  {/* Label */}
                  <AnimatePresence>
                    {isOpen && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="flex-1 text-sm truncate"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {/* Badge */}
                  {item.badge && (
                    <AnimatePresence>
                      {isOpen ? (
                        <motion.span
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="flex-shrink-0 min-w-[20px] h-5 px-1.5 rounded border border-black bg-pink-600 text-white text-[10px] font-bold flex items-center justify-center"
                        >
                          {item.badge}
                        </motion.span>
                      ) : (
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute top-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-pink-600 border border-black"
                        />
                      )}
                    </AnimatePresence>
                  )}
                </Link>
              );

              return isOpen ? (
                el
              ) : (
                <NavTooltip key={item.href} label={item.label}>
                  {el}
                </NavTooltip>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User profile card */}
      <div className="flex-shrink-0 p-3 border-t-2 border-black">
        <div
          className={`flex items-center gap-3 p-2.5 rounded-xl bg-slate-800 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 hover:bg-slate-700 ${
            !isOpen ? "justify-center" : ""
          }`}
        >
          {/* Avatar */}
          <div className="flex-shrink-0 relative">
            <div className="w-8 h-8 rounded bg-indigo-600 border border-black flex items-center justify-center text-white text-sm font-bold uppercase font-mono">
              {user?.full_name ? user.full_name.charAt(0) : "R"}
            </div>
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-black" />
          </div>

          {/* User info */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex-1 min-w-0"
              >
                <div className="text-sm font-semibold text-slate-200 truncate">
                  {user?.full_name ?? "Rajesh Kumar"}
                </div>
                <div className="text-xs text-slate-500 truncate font-semibold">
                  {getRoleLabel(userRole)}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Logout */}
          <AnimatePresence>
            {isOpen && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleLogout}
                className="flex-shrink-0 w-7 h-7 rounded bg-red-600 border border-black flex items-center justify-center text-white hover:bg-red-500 hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all"
                title="Logout"
              >
                <LogOut className="w-3.5 h-3.5" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  );
}
