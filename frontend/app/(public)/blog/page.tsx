"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Calendar, Clock, User, ArrowRight, Sparkles, Shield, Bookmark, Tag } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const categories = ["All", "Fraud Prevention", "GST Compliance", "Tax Strategy", "Case Studies"];

const articles = [
  {
    title: "How to Detect & Stop Employee Reimbursement Fraud",
    excerpt: "Corporate expense fraud cost Indian firms over ₹80 Crore in 2024. Learn the most common fraud types, including duplicate receipt editing, and how AI can catch them before payout.",
    date: "May 18, 2025",
    readTime: "6 min read",
    author: "Rohan Sharma, Chief Audit Officer",
    category: "Fraud Prevention",
    imageAccent: "from-red-500 to-rose-600",
    popular: true,
  },
  {
    title: "GSTR-2B vs GSTR-2A: Reclaiming Maximum Input Tax Credit (ITC)",
    excerpt: "Failing to reconcile purchase invoices against GSTR-2B quarterly leads to significant compliance warnings. Here is how automatic line-by-line validation secures your tax credits.",
    date: "April 29, 2025",
    readTime: "8 min read",
    author: "CA Priyanka Goel, Indirect Tax Expert",
    category: "GST Compliance",
    imageAccent: "from-emerald-500 to-teal-600",
    popular: false,
  },
  {
    title: "Understanding Section 16 of the CGST Act for Finance Teams",
    excerpt: "A comprehensive guide to CGST Act eligibility conditions. Learn the documentation standards required to withstand auditing reviews and minimize tax exposure.",
    date: "April 12, 2025",
    readTime: "5 min read",
    author: "Amit Verma, Legal & Tax Advisory",
    category: "Tax Strategy",
    imageAccent: "from-indigo-500 to-blue-600",
    popular: false,
  },
  {
    title: "Case Study: How a Leading logistics Firm Cut Audit Overhead by 90%",
    excerpt: "By automating manual expense audits using OCR pipelines and risk-engine routers, this 10,000+ employee enterprise saved crores in leakages and expedited reimbursements to under 24 hours.",
    date: "March 22, 2025",
    readTime: "7 min read",
    author: "Ledger AI Editorial Team",
    category: "Case Studies",
    imageAccent: "from-purple-500 to-indigo-600",
    popular: false,
  },
  {
    title: "Detecting AI-Generated Invoices: The Next Frontier in Fraud Detection",
    excerpt: "With the rise of generative tools, fraudulent receipts look more authentic than ever. Discover how ML models look beyond text to check transaction sequences, metadata anomalies, and vendor history.",
    date: "March 08, 2025",
    readTime: "9 min read",
    author: "Dr. Sandeep Nair, Lead ML Researcher",
    category: "Fraud Prevention",
    imageAccent: "from-red-500 to-orange-500",
    popular: true,
  },
  {
    title: "New GST E-Invoicing Thresholds for FY 2025-26",
    excerpt: "Important compliance updates for Indian businesses. Understand the revised eligibility criteria and transition requirements to avoid severe penalties.",
    date: "Feb 15, 2025",
    readTime: "4 min read",
    author: "CA Priyanka Goel, Indirect Tax Expert",
    category: "GST Compliance",
    imageAccent: "from-cyan-500 to-blue-500",
    popular: false,
  },
];

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredArticles = selectedCategory === "All"
    ? articles
    : articles.filter(art => art.category === selectedCategory);

  return (
    <div className="bg-[#0a0b0f] min-h-screen text-slate-100 font-sans selection:bg-indigo-500/30 selection:text-white pb-24 overflow-x-hidden">
      {/* Background gradients */}
      <div className="absolute top-20 right-1/4 w-[400px] h-[400px] bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/4 w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Hero Header */}
      <section className="pt-24 pb-12 text-center max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full text-xs font-semibold uppercase tracking-wider mb-6"
        >
          <BookOpen className="w-3.5 h-3.5" />
          Ledger Publications
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight"
        >
          Compliance, Auditing & <br />
          <span className="gradient-text">Financial Intelligence</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-6 text-slate-400 text-lg max-w-2xl mx-auto"
        >
          Explore tax advice, corporate audit strategies, and tech reviews of fraud prevention workflows compiled by our compliance team.
        </motion.p>
      </section>

      {/* Category Navigation */}
      <section className="max-w-7xl mx-auto px-6 flex justify-center mt-6">
        <div className="flex flex-wrap bg-slate-900/60 border border-slate-800 rounded-2xl p-1.5 gap-1.5 justify-center">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                selectedCategory === cat
                  ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Articles Grid */}
      <section className="max-w-7xl mx-auto px-6 grid gap-8 md:grid-cols-2 lg:grid-cols-3 mt-12">
        {filteredArticles.map((art, idx) => (
          <motion.div
            key={art.title}
            layout
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * idx }}
          >
            <Card variant="default" className="h-full flex flex-col justify-between group overflow-hidden">
              <div className="relative">
                {/* Decorative header gradient */}
                <div className={`h-32 bg-gradient-to-br ${art.imageAccent} opacity-20 group-hover:opacity-30 transition-opacity duration-300 relative overflow-hidden`}>
                  {/* Grid overlay */}
                  <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:14px_24px]" />
                </div>
                {art.popular && (
                  <div className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3 fill-white" />
                    Trending
                  </div>
                )}
                <div className="absolute -bottom-4 left-6 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[10px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  {art.category}
                </div>
              </div>

              <CardHeader className="pt-8 pb-4">
                <CardTitle className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-2">
                  {art.title}
                </CardTitle>
                <CardDescription className="mt-3 text-slate-400 text-xs sm:text-sm line-clamp-3 leading-relaxed">
                  {art.excerpt}
                </CardDescription>
              </CardHeader>

              <CardContent className="py-2 mt-auto">
                <div className="flex flex-col gap-2 text-slate-500 text-xs font-medium pb-4 border-b border-white/5">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-600" />
                    <span className="truncate">{art.author}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-600" />
                      {art.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-600" />
                      {art.readTime}
                    </span>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="pt-4 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-semibold group-hover:text-white transition-colors">Read Full Article</span>
                <Button variant="ghost" size="sm" className="group-hover:translate-x-1 transition-transform p-0 hover:bg-transparent">
                  <ArrowRight className="w-4 h-4 text-indigo-400" />
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </section>
    </div>
  );
}
