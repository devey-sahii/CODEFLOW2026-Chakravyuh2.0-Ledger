"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Building2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Shield,
  BarChart3,
  FileCheck,
  Settings,
  ChevronRight,
} from "lucide-react";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { app } from "@/lib/firebase";
import { useAuthStore } from "@/store/auth-store";

const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// ─── Schemas ───────────────────────────────────────────────────────────────

const step1Schema = z
  .object({
    full_name: z.string().min(2, "Full name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[0-9]/, "Must contain at least one number"),
    confirm_password: z.string(),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

const step2Schema = z.object({
  org_name: z.string().min(2, "Organization name is required"),
  gstin: z
    .string()
    .optional()
    .refine(
      (v) => !v || /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(v),
      "Invalid GSTIN format"
    ),
  subscription_plan: z.enum(["starter", "professional", "enterprise"]),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;

// ─── Role data ───────────────────────────────────────────────────────────────

const roles = [
  {
    id: "employee",
    label: "Employee",
    desc: "Submit and track expense claims",
    icon: <User className="w-6 h-6" />,
    color: "from-blue-500/20 to-cyan-500/20",
    border: "border-blue-500/30",
  },
  {
    id: "finance_manager",
    label: "Finance Manager",
    desc: "Review claims, manage budgets",
    icon: <BarChart3 className="w-6 h-6" />,
    color: "from-indigo-500/20 to-violet-500/20",
    border: "border-indigo-500/30",
  },
  {
    id: "auditor",
    label: "Auditor",
    desc: "Audit expenses, detect fraud",
    icon: <FileCheck className="w-6 h-6" />,
    color: "from-amber-500/20 to-orange-500/20",
    border: "border-amber-500/30",
  },
  {
    id: "admin",
    label: "Admin",
    desc: "Full platform access & settings",
    icon: <Settings className="w-6 h-6" />,
    color: "from-emerald-500/20 to-teal-500/20",
    border: "border-emerald-500/30",
  },
];

const plans = [
  { id: "starter", label: "Starter", price: "₹999/mo", users: "Up to 10 users" },
  { id: "professional", label: "Professional", price: "₹2,999/mo", users: "Up to 50 users" },
  { id: "enterprise", label: "Enterprise", price: "Custom", users: "Unlimited users" },
];

// ─── Step animations ─────────────────────────────────────────────────────────

const stepVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 60 : -60,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.35, ease: "easeOut" as const },
  },
  exit: (dir: number) => ({
    x: dir > 0 ? -60 : 60,
    opacity: 0,
    transition: { duration: 0.25, ease: "easeIn" as const },
  }),
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("employee");
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);
  const [step2Data, setStep2Data] = useState<Step2Data | null>(null);

  const {
    register: reg1,
    handleSubmit: hs1,
    formState: { errors: e1 },
  } = useForm<Step1Data>({ resolver: zodResolver(step1Schema) });

  const {
    register: reg2,
    handleSubmit: hs2,
    formState: { errors: e2 },
    watch: watch2,
    setValue: sv2,
  } = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: { subscription_plan: "professional" },
  });

  const selectedPlan = watch2("subscription_plan");

  const nextStep = (d: number) => {
    setDirection(d);
    setStep((s) => s + d);
  };

  const onStep1 = (data: Step1Data) => {
    setStep1Data(data);
    nextStep(1);
  };

  const onStep2 = (data: Step2Data) => {
    setStep2Data(data);
    nextStep(1);
  };

  const processSignup = async (data: Step1Data & Step2Data) => {
    setIsLoading(true);
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );
      const token = await userCredential.user.getIdToken();
      document.cookie = `access_token=${token}; path=/; max-age=86400`;
      
      useAuthStore.getState().setUser({
        id: userCredential.user.uid,
        email: userCredential.user.email || data.email,
        full_name: data.full_name || userCredential.user.displayName || "User",
        role: selectedRole as any,
        organization_id: "org-id",
        avatar_url: userCredential.user.photoURL || null,
        department: "Finance",
        employee_id: "EMP-001",
        phone: userCredential.user.phoneNumber || null,
        is_active: true,
        is_verified: userCredential.user.emailVerified,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_login_at: new Date().toISOString(),
      });
      useAuthStore.getState().setTokens(token, token);
      
      console.log("User created:", userCredential.user);
      console.log("Organization data:", {
        org_name: data.org_name,
        gstin: data.gstin,
        subscription_plan: data.subscription_plan,
      });
      window.location.href = "/dashboard";
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, provider);
      const token = await result.user.getIdToken();
      document.cookie = `access_token=${token}; path=/; max-age=86400`;
      
      useAuthStore.getState().setUser({
        id: result.user.uid,
        email: result.user.email || "",
        full_name: result.user.displayName || "User",
        role: "admin",
        organization_id: "org-id",
        avatar_url: result.user.photoURL || null,
        department: "Finance",
        employee_id: "EMP-001",
        phone: result.user.phoneNumber || null,
        is_active: true,
        is_verified: result.user.emailVerified,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_login_at: new Date().toISOString(),
      });
      useAuthStore.getState().setTokens(token, token);
      window.location.href = "/dashboard";
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const progressPct = ((step - 1) / 2) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold text-white">Create account</h1>
        <p className="text-slate-400 text-sm">
          Step {step} of 3 — {step === 1 ? "Account Information" : step === 2 ? "Organization Setup" : "Select Your Role"}
        </p>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-500">
          {["Account Info", "Organization", "Your Role"].map((label, i) => (
            <div
              key={i}
              className={`flex items-center gap-1 transition-colors ${
                step > i + 1
                  ? "text-emerald-400"
                  : step === i + 1
                  ? "text-indigo-400"
                  : "text-slate-600"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold border transition-all ${
                  step > i + 1
                    ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                    : step === i + 1
                    ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-400"
                    : "border-slate-700 text-slate-600"
                }`}
              >
                {step > i + 1 ? <CheckCircle2 className="w-3 h-3" /> : i + 1}
              </div>
              <span className="hidden sm:inline">{label}</span>
            </div>
          ))}
        </div>
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full"
            initial={false}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="relative overflow-hidden" style={{ minHeight: 320 }}>
        <AnimatePresence mode="wait" custom={direction}>
          {/* ─ Step 1 ─ */}
          {step === 1 && (
            <motion.form
              key="step1"
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              onSubmit={hs1(onStep1)}
              className="space-y-4"
            >
              <motion.div variants={itemVariants} initial="hidden" animate="visible" className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    {...reg1("full_name")}
                    type="text"
                    placeholder="Rajesh Kumar"
                    className="w-full pl-10 pr-4 py-3 rounded-xl input-dark text-sm placeholder:text-slate-600"
                  />
                </div>
                {e1.full_name && <p className="text-xs text-red-400">{e1.full_name.message}</p>}
              </motion.div>

              <motion.div variants={itemVariants} initial="hidden" animate="visible" style={{ transitionDelay: "0.05s" }} className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    {...reg1("email")}
                    type="email"
                    placeholder="you@company.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl input-dark text-sm placeholder:text-slate-600"
                  />
                </div>
                {e1.email && <p className="text-xs text-red-400">{e1.email.message}</p>}
              </motion.div>

              <motion.div variants={itemVariants} initial="hidden" animate="visible" style={{ transitionDelay: "0.1s" }} className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    {...reg1("password")}
                    type={showPassword ? "text" : "password"}
                    placeholder="Min 8 chars, 1 uppercase, 1 number"
                    className="w-full pl-10 pr-12 py-3 rounded-xl input-dark text-sm placeholder:text-slate-600"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {e1.password && <p className="text-xs text-red-400">{e1.password.message}</p>}
              </motion.div>

              <motion.div variants={itemVariants} initial="hidden" animate="visible" style={{ transitionDelay: "0.15s" }} className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    {...reg1("confirm_password")}
                    type={showConfirm ? "text" : "password"}
                    placeholder="Repeat password"
                    className="w-full pl-10 pr-12 py-3 rounded-xl input-dark text-sm placeholder:text-slate-600"
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {e1.confirm_password && <p className="text-xs text-red-400">{e1.confirm_password.message}</p>}
              </motion.div>

              <button type="submit" className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-indigo-500/25 mt-2">
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            </motion.form>
          )}

          {/* ─ Step 2 ─ */}
          {step === 2 && (
            <motion.form
              key="step2"
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              onSubmit={hs2(onStep2)}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Organization Name</label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    {...reg2("org_name")}
                    type="text"
                    placeholder="Acme Pvt Ltd"
                    className="w-full pl-10 pr-4 py-3 rounded-xl input-dark text-sm placeholder:text-slate-600"
                  />
                </div>
                {e2.org_name && <p className="text-xs text-red-400">{e2.org_name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">
                  GSTIN{" "}
                  <span className="text-slate-600 font-normal">(Optional)</span>
                </label>
                <input
                  {...reg2("gstin")}
                  type="text"
                  placeholder="22AAAAA0000A1Z5"
                  className="w-full px-4 py-3 rounded-xl input-dark text-sm placeholder:text-slate-600 font-mono uppercase"
                />
                {e2.gstin && <p className="text-xs text-red-400">{e2.gstin.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Subscription Plan</label>
                <div className="grid grid-cols-3 gap-2">
                  {plans.map((plan) => (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => sv2("subscription_plan", plan.id as "starter" | "professional" | "enterprise")}
                      className={`relative flex flex-col items-start p-3 rounded-xl border transition-all duration-200 text-left ${
                        selectedPlan === plan.id
                          ? "border-indigo-500/60 bg-indigo-500/10"
                          : "border-slate-700/50 bg-slate-800/30 hover:border-slate-600"
                      }`}
                    >
                      {plan.id === "professional" && (
                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] px-2 py-0.5 rounded-full bg-indigo-600 text-white font-medium">Popular</span>
                      )}
                      <span className="text-xs font-bold text-white">{plan.label}</span>
                      <span className="text-[11px] text-indigo-400 font-semibold mt-0.5">{plan.price}</span>
                      <span className="text-[10px] text-slate-500 mt-0.5">{plan.users}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => nextStep(-1)}
                  className="flex items-center gap-1.5 px-4 py-3 rounded-xl border border-slate-700 bg-slate-800/50 text-slate-400 text-sm font-medium hover:bg-slate-800 transition-all"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-indigo-500/25"
                >
                  Continue <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.form>
          )}

          {/* ─ Step 3 ─ */}
          {step === 3 && (
            <motion.div
              key="step3"
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="space-y-4"
            >
              <p className="text-sm text-slate-400">Select your primary role in the organization</p>
              <div className="grid grid-cols-2 gap-2">
                {roles.map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedRole(role.id)}
                    className={`relative flex flex-col items-start gap-2 p-4 rounded-xl border transition-all duration-200 text-left ${
                      selectedRole === role.id
                        ? `border-indigo-500/60 bg-gradient-to-br ${role.color}`
                        : "border-slate-700/50 bg-slate-800/30 hover:border-slate-600"
                    }`}
                  >
                    {selectedRole === role.id && (
                      <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center">
                        <CheckCircle2 className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <div className={`text-slate-400 ${selectedRole === role.id ? "text-indigo-400" : ""}`}>
                      {role.icon}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">{role.label}</div>
                      <div className="text-xs text-slate-500 mt-0.5 leading-relaxed">{role.desc}</div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => nextStep(-1)}
                  className="flex items-center gap-1.5 px-4 py-3 rounded-xl border border-slate-700 bg-slate-800/50 text-slate-400 text-sm font-medium hover:bg-slate-800 transition-all"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (step1Data && step2Data) {
                      processSignup({ ...step1Data, ...step2Data });
                    }
                  }}
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-indigo-500/25 disabled:opacity-70"
                >
                  {isLoading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</>
                  ) : (
                    <><Shield className="w-4 h-4" /> Create Account <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="mt-6 text-center text-sm text-zinc-400">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-indigo-400 hover:text-indigo-300">
          Sign in
        </Link>
      </div>
      <div className="flex items-center my-6">
          <div className="flex-grow border-t border-zinc-700/50"></div>
          <span className="mx-4 text-xs text-zinc-400">OR</span>
          <div className="flex-grow border-t border-zinc-700/50"></div>
        </div>
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 border border-zinc-700/50 rounded-lg hover:bg-zinc-800/50 transition-colors duration-200 text-sm font-medium"
        >
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
          </svg>
          <span>Sign up with Google</span>
        </button>
    </motion.div>
  );
}

