import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Mail, Lock, User, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Logo } from "@/components/Logo";

const searchSchema = z.object({ mode: z.enum(["login", "register"]).default("login").optional(), redirect: z.string().optional() });

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(6, "At least 6 characters").max(100),
});
const registerSchema = loginSchema.extend({
  full_name: z.string().trim().min(2, "Enter your full name").max(80),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Sign In — RDF" }, { name: "description", content: "Sign in or create an account at RDF — Rezoan's Decant & Fragrance." }] }),
  component: AuthPage,
});

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">(search.mode ?? "login");
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(mode === "login" ? loginSchema : registerSchema) as never,
  });

  const resolvePostAuthDest = async (): Promise<string> => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return "/";
    const [rolesRes, profileRes] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", u.user.id),
      supabase.from("profiles").select("must_change_password").eq("id", u.user.id).maybeSingle(),
    ]);
    if (profileRes.data?.must_change_password) return "/reset-password";
    const isAdmin = (rolesRes.data ?? []).some((r) => r.role === "admin");
    if (isAdmin) return "/admin";
    return search.redirect ?? "/dashboard";
  };

  const onSubmit = form.handleSubmit(async (data) => {
    setSubmitting(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email: data.email, password: data.password });
        if (error) throw error;
        toast.success("Welcome back");
      } else {
        const { error } = await supabase.auth.signUp({
          email: data.email, password: data.password,
          options: { emailRedirectTo: `${window.location.origin}/`, data: { full_name: data.full_name } },
        });
        if (error) throw error;
        toast.success("Account created");
      }
      navigate({ to: await resolvePostAuthDest() });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  });

  const google = async () => {
    setSubmitting(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
      if (result.error) throw result.error;
      if (result.redirected) return;
      navigate({ to: await resolvePostAuthDest() });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Google sign-in failed");
    } finally { setSubmitting(false); }
  };

  return (
    <div className="container-luxury grid min-h-[calc(100dvh-200px)] place-items-center py-16">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Link to="/" className="mb-8 inline-flex items-center gap-2 text-[11px] track-luxury text-muted-foreground hover:text-[color:var(--gold)]">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to home
        </Link>
        <div className="mb-8 flex flex-col items-center"><Logo /></div>

        <div className="rounded-sm border border-[color:var(--gold)]/20 bg-card p-8 shadow-card">
          <h1 className="text-center font-display text-3xl"><span className="gold-text">{mode === "login" ? "Welcome Back" : "Join the Maison"}</span></h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">{mode === "login" ? "Sign in to continue your journey." : "Create an account to begin."}</p>

          <button onClick={google} disabled={submitting} className="mt-7 flex h-11 w-full items-center justify-center gap-3 rounded-sm border border-border bg-background text-sm font-medium transition-colors hover:border-[color:var(--gold)] hover:text-[color:var(--gold)] disabled:opacity-50">
            <svg viewBox="0 0 24 24" className="h-4 w-4"><path fill="#FFC107" d="M21.8 10.04h-9.79v3.92h5.61c-.24 1.5-1.83 4.4-5.61 4.4-3.38 0-6.13-2.8-6.13-6.26S8.63 5.84 12 5.84c1.92 0 3.21.82 3.95 1.52l2.69-2.59C16.97 3.16 14.7 2.16 12 2.16 6.51 2.16 2.07 6.6 2.07 12.1S6.51 22.04 12 22.04c6.91 0 11.5-4.86 11.5-11.7 0-.79-.08-1.39-.21-1.99l-1.49.69z"/></svg>
            Continue with Google
          </button>

          <div className="my-6 flex items-center gap-3"><div className="h-px flex-1 bg-border" /><span className="text-[10px] track-luxury text-muted-foreground">Or with email</span><div className="h-px flex-1 bg-border" /></div>

          <form onSubmit={onSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="mb-1.5 block text-[10px] track-luxury text-muted-foreground">Full Name</label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input {...form.register("full_name")} className="h-11 w-full rounded-sm border border-border bg-background pl-9 pr-3 text-sm focus:border-[color:var(--gold)] focus:outline-none" />
                </div>
                {form.formState.errors.full_name && <p className="mt-1 text-[11px] text-destructive">{form.formState.errors.full_name.message}</p>}
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-[10px] track-luxury text-muted-foreground">Email</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input type="email" autoComplete="email" {...form.register("email")} className="h-11 w-full rounded-sm border border-border bg-background pl-9 pr-3 text-sm focus:border-[color:var(--gold)] focus:outline-none" />
              </div>
              {form.formState.errors.email && <p className="mt-1 text-[11px] text-destructive">{form.formState.errors.email.message}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] track-luxury text-muted-foreground">Password</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} {...form.register("password")} className="h-11 w-full rounded-sm border border-border bg-background pl-9 pr-3 text-sm focus:border-[color:var(--gold)] focus:outline-none" />
              </div>
              {form.formState.errors.password && <p className="mt-1 text-[11px] text-destructive">{form.formState.errors.password.message}</p>}
            </div>
            <button type="submit" disabled={submitting} className="btn-liquid w-full">
              {submitting ? "Please wait…" : mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            {mode === "login" ? "New to RDF? " : "Already have an account? "}
            <button type="button" onClick={() => { setMode(mode === "login" ? "register" : "login"); form.reset(); }} className="font-medium text-[color:var(--gold)] hover:underline">
              {mode === "login" ? "Create an account" : "Sign in"}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
