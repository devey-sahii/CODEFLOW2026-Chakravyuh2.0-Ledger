"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { getAuth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { app } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth-store";

const Chrome = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    width="16"
    height="16"
    {...props}
  >
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      fill="#EA4335"
    />
  </svg>
);

const auth = getAuth(app);
const provider = new GoogleAuthProvider();

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { rememberMe: false },
  });

  const fillDemoCredentials = () => {
    setValue("email", "admin@company.in");
    setValue("password", "password123");
  };

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      // Mock login for demo credentials so the user can see the dashboard immediately
      if (data.email === "admin@company.in" && data.password === "password123") {
        await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay
        // Clear old role selection so user must re-select role each login
        document.cookie = "selected_role=; path=/; max-age=0";
        document.cookie = "access_token=demo-token; path=/; max-age=86400";
        
        useAuthStore.getState().setUser({
          id: "demo-user-id",
          email: "admin@company.in",
          full_name: "Corporate Admin",
          role: "admin",
          organization_id: "demo-org-id",
          avatar_url: null,
          department: "Finance",
          employee_id: "EMP-001",
          phone: "+91 99999 99999",
          is_active: true,
          is_verified: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_login_at: new Date().toISOString(),
        });
        useAuthStore.getState().setTokens("demo-token", "demo-refresh-token");
        window.location.href = "/select-role";
        return;
      }
      
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      const token = await userCredential.user.getIdToken();
      // Clear old role selection so user must re-select role each login
      document.cookie = "selected_role=; path=/; max-age=0";
      document.cookie = `access_token=${token}; path=/; max-age=86400`;
      
      useAuthStore.getState().setUser({
        id: userCredential.user.uid,
        email: userCredential.user.email || data.email,
        full_name: userCredential.user.displayName || "User",
        role: "employee",
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
      window.location.href = "/select-role";
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
      // Clear old role selection so user must re-select role each login
      document.cookie = "selected_role=; path=/; max-age=0";
      document.cookie = `access_token=${token}; path=/; max-age=86400`;
      
      useAuthStore.getState().setUser({
        id: result.user.uid,
        email: result.user.email || "",
        full_name: result.user.displayName || "User",
        role: "employee",
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
      window.location.href = "/select-role";
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Heading */}
      <motion.div variants={itemVariants} className="space-y-1">
        <h1 className="text-3xl font-bold text-white">Welcome back</h1>
        <p className="text-slate-400 text-sm font-semibold">
          Sign in to your LEDGER AI account
        </p>
      </motion.div>

      {/* Demo Button */}
      <motion.div variants={itemVariants}>
        <Button
          type="button"
          onClick={fillDemoCredentials}
          variant="glass-primary"
          fullWidth
        >
          <Sparkles className="w-4 h-4" />
          Use Demo Credentials
        </Button>
      </motion.div>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-xl bg-red-500/10 border-2 border-red-500 text-red-400 text-sm font-bold"
        >
          {error}
        </motion.div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email */}
        <motion.div variants={itemVariants} className="space-y-1.5">
          <label className="text-sm font-bold text-slate-300">
            Email address
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              {...register("email")}
              type="email"
              placeholder="you@company.com"
              autoComplete="email"
              className="w-full pl-10 pr-4 py-3 rounded-xl input-dark text-sm placeholder:text-slate-600 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          {errors.email && (
            <p className="text-xs text-red-400 font-semibold">{errors.email.message}</p>
          )}
        </motion.div>

        {/* Password */}
        <motion.div variants={itemVariants} className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-slate-300">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-bold transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              {...register("password")}
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="current-password"
              className="w-full pl-10 pr-12 py-3 rounded-xl input-dark text-sm placeholder:text-slate-600 focus:ring-2 focus:ring-indigo-500/20"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-red-400 font-semibold">{errors.password.message}</p>
          )}
        </motion.div>

        {/* Remember me */}
        <motion.div variants={itemVariants} className="flex items-center gap-2">
          <input
            {...register("rememberMe")}
            type="checkbox"
            id="rememberMe"
            className="w-4 h-4 rounded border-2 border-black bg-slate-800 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0 cursor-pointer accent-indigo-600"
          />
          <label
            htmlFor="rememberMe"
            className="text-sm text-slate-400 cursor-pointer font-semibold"
          >
            Remember me for 30 days
          </label>
        </motion.div>

        {/* Submit */}
        <motion.div variants={itemVariants}>
          <Button
            type="submit"
            loading={isLoading}
            loadingText="Signing in..."
            variant="primary"
            fullWidth
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Sign in to Dashboard
          </Button>
        </motion.div>
      </form>

      {/* Divider */}
      <motion.div variants={itemVariants} className="flex items-center gap-3">
        <div className="flex-1 h-0.5 bg-black" />
        <span className="text-xs text-slate-500 font-bold">
          OR CONTINUE WITH
        </span>
        <div className="flex-1 h-0.5 bg-black" />
      </motion.div>

      {/* Google OAuth */}
      <motion.div variants={itemVariants}>
        <Button
          type="button"
          onClick={handleGoogleSignIn}
          variant="outline"
          fullWidth
          leftIcon={<Chrome className="w-4 h-4" />}
        >
          Continue with Google
        </Button>
      </motion.div>

      {/* Sign up link */}
      <motion.p
        variants={itemVariants}
        className="text-center text-sm text-slate-500 font-semibold"
      >
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors"
        >
          Sign up for free
        </Link>
      </motion.p>
    </motion.div>
  );
}

