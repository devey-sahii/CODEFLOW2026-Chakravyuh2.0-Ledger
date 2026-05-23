"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Phone, MapPin, CheckCircle, Send, Headphones, Building, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ContactFormData {
  fullName: string;
  email: string;
  phone: string;
  orgName: string;
  subject: string;
  message: string;
}

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContactFormData>();

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setIsSuccess(true);
    reset();
  };

  return (
    <div className="bg-[#0a0b0f] min-h-screen text-slate-100 font-sans selection:bg-indigo-500/30 selection:text-white pb-24 overflow-x-hidden">
      {/* Decorative radial glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Hero Header */}
      <section className="pt-24 pb-12 text-center max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full text-xs font-semibold uppercase tracking-wider mb-6"
        >
          <Headphones className="w-3.5 h-3.5" />
          Support & Sales Inquiry
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight"
        >
          Get In Touch With <br />
          <span className="gradient-text">Our Team</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-6 text-slate-400 text-lg max-w-2xl mx-auto"
        >
          Have questions about compliance thresholds, pricing, or custom deployment modules? Reach out and we'll reply shortly.
        </motion.p>
      </section>

      {/* Contact Content Container */}
      <section className="max-w-6xl mx-auto px-6 grid gap-12 lg:grid-cols-5 items-start mt-8">
        {/* Left Column: Office Details */}
        <div className="lg:col-span-2 space-y-8">
          <h2 className="text-2xl font-bold text-white">Contact Information</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Our specialized enterprise representatives are active Monday through Friday, 9:00 AM to 6:00 PM IST.
          </p>

          <div className="space-y-6">
            <div className="flex gap-4 p-5 bg-slate-900/40 border border-white/5 rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-slate-500 uppercase font-semibold">Corporate Email</span>
                <span className="text-sm font-bold text-white block mt-1">sales@ledger-ai.in</span>
                <span className="text-xs text-slate-400 mt-0.5 block">support@ledger-ai.in</span>
              </div>
            </div>

            <div className="flex gap-4 p-5 bg-slate-900/40 border border-white/5 rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-slate-500 uppercase font-semibold">Call or WhatsApp</span>
                <span className="text-sm font-bold text-white block mt-1">+91 22 6245 9800</span>
                <span className="text-xs text-slate-400 mt-0.5 block">Mon-Fri · 9 AM - 6 PM IST</span>
              </div>
            </div>

            <div className="flex gap-4 p-5 bg-slate-900/40 border border-white/5 rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-slate-500 uppercase font-semibold">HQ Office Location</span>
                <span className="text-sm font-bold text-white block mt-1">Ledger AI Technologies Pvt. Ltd.</span>
                <span className="text-xs text-slate-400 mt-1 leading-relaxed block">
                  Level 8, Maker Maxity, Bandra Kurla Complex (BKC),<br />
                  Mumbai, Maharashtra, 400051, India
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Contact Form */}
        <div className="lg:col-span-3">
          <Card variant="default" className="relative overflow-hidden">
            <CardHeader className="border-b border-white/5 pb-6">
              <CardTitle className="text-xl font-bold">Submit a Message</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Fill in the details below and an integration engineer will get in touch.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <AnimatePresence mode="wait">
                {!isSuccess ? (
                  <motion.form
                    key="form"
                    onSubmit={handleSubmit(onSubmit)}
                    className="space-y-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="fullName" className="text-xs font-semibold text-slate-400 block mb-1.5">Full Name</label>
                        <input
                          id="fullName"
                          type="text"
                          placeholder="Rohan Kapoor"
                          {...register("fullName", { required: "Full name is required" })}
                          className={`w-full bg-slate-950 border rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors ${
                            errors.fullName ? "border-red-500/50" : "border-slate-800"
                          }`}
                        />
                        {errors.fullName && (
                          <span className="text-[10px] text-red-400 mt-1 block">{errors.fullName.message}</span>
                        )}
                      </div>

                      <div>
                        <label htmlFor="email" className="text-xs font-semibold text-slate-400 block mb-1.5">Corporate Email</label>
                        <input
                          id="email"
                          type="email"
                          placeholder="rohan@company.in"
                          {...register("email", {
                            required: "Email is required",
                            pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: "Invalid email address" },
                          })}
                          className={`w-full bg-slate-950 border rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors ${
                            errors.email ? "border-red-500/50" : "border-slate-800"
                          }`}
                        />
                        {errors.email && (
                          <span className="text-[10px] text-red-400 mt-1 block">{errors.email.message}</span>
                        )}
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="phone" className="text-xs font-semibold text-slate-400 block mb-1.5">Phone Number</label>
                        <input
                          id="phone"
                          type="tel"
                          placeholder="+91 98765 43210"
                          {...register("phone", { required: "Phone number is required" })}
                          className={`w-full bg-slate-950 border rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors ${
                            errors.phone ? "border-red-500/50" : "border-slate-800"
                          }`}
                        />
                        {errors.phone && (
                          <span className="text-[10px] text-red-400 mt-1 block">{errors.phone.message}</span>
                        )}
                      </div>

                      <div>
                        <label htmlFor="orgName" className="text-xs font-semibold text-slate-400 block mb-1.5">Organization Name</label>
                        <input
                          id="orgName"
                          type="text"
                          placeholder="TechCorp Solutions"
                          {...register("orgName", { required: "Organization name is required" })}
                          className={`w-full bg-slate-950 border rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors ${
                            errors.orgName ? "border-red-500/50" : "border-slate-800"
                          }`}
                        />
                        {errors.orgName && (
                          <span className="text-[10px] text-red-400 mt-1 block">{errors.orgName.message}</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <label htmlFor="subject" className="text-xs font-semibold text-slate-400 block mb-1.5">Inquiry Subject</label>
                      <input
                        id="subject"
                        type="text"
                        placeholder="Requesting Enterprise Demo & SLA details"
                        {...register("subject", { required: "Subject is required" })}
                        className={`w-full bg-slate-950 border rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors ${
                          errors.subject ? "border-red-500/50" : "border-slate-800"
                        }`}
                      />
                      {errors.subject && (
                        <span className="text-[10px] text-red-400 mt-1 block">{errors.subject.message}</span>
                      )}
                    </div>

                    <div>
                      <label htmlFor="message" className="text-xs font-semibold text-slate-400 block mb-1.5">Message Content</label>
                      <textarea
                        id="message"
                        rows={4}
                        placeholder="Tell us about your average monthly receipts volume, current ERP tools..."
                        {...register("message", { required: "Message is required" })}
                        className={`w-full bg-slate-950 border rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors ${
                          errors.message ? "border-red-500/50" : "border-slate-800"
                        }`}
                      />
                      {errors.message && (
                        <span className="text-[10px] text-red-400 mt-1 block">{errors.message.message}</span>
                      )}
                    </div>

                    <Button
                      type="submit"
                      variant="primary"
                      fullWidth
                      loading={isSubmitting}
                      loadingText="Sending Message..."
                      className="mt-6 flex items-center justify-center gap-2"
                    >
                      Send Inquiry Message
                      <Send className="w-4 h-4" />
                    </Button>
                  </motion.form>
                ) : (
                  <motion.div
                    key="success"
                    className="py-12 text-center flex flex-col items-center"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 100 }}
                  >
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6">
                      <CheckCircle className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Message Sent Successfully!</h3>
                    <p className="text-slate-400 text-sm max-w-sm leading-relaxed mb-8">
                      Thank you for contacting Ledger AI. A support representative will email or call you within 2 hours.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsSuccess(false);
                      }}
                      className="flex items-center gap-2"
                    >
                      Submit Another Message
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
