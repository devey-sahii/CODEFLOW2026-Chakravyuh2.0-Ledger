"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Mail,
  ArrowUpRight,
} from "lucide-react";

const Twitter = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

const Linkedin = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const Github = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const footerLinks = {
  Product: [
    { label: "Features", href: "/features" },
    { label: "Security", href: "/security" },
    { label: "API Docs", href: "/api-docs" },
    { label: "Pricing", href: "/pricing" },
    { label: "Changelog", href: "/blog" },
  ],
  Solutions: [
    { label: "Enterprise", href: "/solutions" },
    { label: "Startups", href: "/solutions" },
    { label: "Finance Teams", href: "/solutions" },
    { label: "Auditors", href: "/solutions" },
  ],
  Company: [
    { label: "About", href: "/contact" },
    { label: "Blog", href: "/blog" },
    { label: "Contact", href: "/contact" },
    { label: "Press", href: "/contact" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
    { label: "Cookie Policy", href: "#" },
    { label: "GDPR", href: "#" },
  ],
};

const certBadges = ["SOC 2 Type II", "ISO 27001", "GDPR Ready", "RBI Compliant"];

export default function Footer() {
  return (
    <footer className="relative border-t border-white/5 bg-[#070810]">
      {/* Gradient top border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Top section */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 pb-12 border-b border-white/5">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 group w-fit">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-white tracking-tight">
                  LEDGER
                </span>
                <span className="text-xs text-indigo-400 font-semibold tracking-widest uppercase">
                  AI
                </span>
              </div>
            </Link>

            <p className="mt-4 text-slate-400 text-sm leading-relaxed max-w-xs">
              AI-powered enterprise expense auditing, fraud detection, and GST
              compliance platform trusted by 500+ companies across India.
            </p>

            {/* Social links */}
            <div className="mt-6 flex items-center gap-3">
              {[
                { icon: Twitter, href: "#", label: "Twitter" },
                { icon: Linkedin, href: "#", label: "LinkedIn" },
                { icon: Github, href: "#", label: "GitHub" },
                { icon: Mail, href: "/contact", label: "Email" },
              ].map((social) => (
                <Link
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-indigo-500/20 hover:border-indigo-500/30 transition-all duration-200"
                >
                  <social.icon className="w-4 h-4" />
                </Link>
              ))}
            </div>

            {/* Cert badges */}
            <div className="mt-6 flex flex-wrap gap-2">
              {certBadges.map((badge) => (
                <span
                  key={badge}
                  className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800/60 border border-slate-700/50 text-slate-400"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>

          {/* Links columns */}
          <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-8">
            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category}>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">
                  {category}
                </h4>
                <ul className="space-y-2.5">
                  {links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-slate-400 hover:text-white transition-colors duration-200"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="my-12 p-8 rounded-2xl bg-gradient-to-r from-indigo-600/20 via-blue-600/15 to-violet-600/20 border border-indigo-500/20 flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div>
            <h3 className="text-xl font-bold text-white">
              Ready to stop expense fraud?
            </h3>
            <p className="text-slate-400 text-sm mt-1">
              Join 500+ companies saving crores with AI-powered auditing.
            </p>
          </div>
          <Link
            href="/auth/register"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold text-sm hover:from-indigo-500 hover:to-blue-500 shadow-lg shadow-indigo-500/25 transition-all duration-200 whitespace-nowrap"
          >
            Start 14-Day Free Trial
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </motion.div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
          <p>© 2025 Ledger AI Technologies Pvt. Ltd. All rights reserved.</p>
          <p className="flex items-center gap-1.5">
            Made with{" "}
            <span className="text-red-400">♥</span>{" "}
            in Mumbai, India 🇮🇳
          </p>
        </div>
      </div>
    </footer>
  );
}
