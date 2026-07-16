import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Lock, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Logo } from "@/components/Logo";

const schema = z.object({
  password: z.string().min(8, "Use at least 8 characters").max(120),
  confirm: z.string(),
}).refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Passwords don't match" });

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({ meta: [{ title: "Reset Password — FRAG AVENUE" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  if (loading) return <div className="container-luxury py-24 text-center text-muted-foreground">Loading…</div>;

  const onSubmit = form.handleSubmit(async (data) => {
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: data.password });
      if (error) throw error;
      if (user) {
        await supabase.from("profiles").update({ must_change_password: false }).eq("id", user.id);
      }
      toast.success("Password updated");
      navigate({ to: "/admin" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update password");
    } finally { setSubmitting(false); }
  });

  return (
    <div className="container-luxury grid min-h-[calc(100dvh-200px)] place-items-center py-16">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center"><Logo compact /></div>
        <div className="rounded-sm border border-[color:var(--gold)]/20 bg-card p-8 shadow-card">
          <h1 className="text-center font-display text-3xl font-bold text-foreground">Set a New Password</h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">For your security, please choose a fresh password before continuing.</p>
          <form onSubmit={onSubmit} className="mt-7 space-y-4">
            <Field label="New Password" icon={<Lock className="h-3.5 w-3.5" />} type="password" {...form.register("password")} error={form.formState.errors.password?.message} />
            <Field label="Confirm Password" icon={<ShieldCheck className="h-3.5 w-3.5" />} type="password" {...form.register("confirm")} error={form.formState.errors.confirm?.message} />
            <button type="submit" disabled={submitting} className="btn-liquid w-full">{submitting ? "Saving…" : "Update Password"}</button>
          </form>
        </div>
      </div>
    </div>
  );
}

function Field({ label, icon, error, ...rest }: { label: string; icon: React.ReactNode; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="mb-1.5 block text-[10px] track-luxury text-muted-foreground">{label}</label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</span>
        <input {...rest} className="h-11 w-full rounded-sm border border-border bg-background pl-9 pr-3 text-sm focus:border-[color:var(--gold)] focus:outline-none" />
      </div>
      {error && <p className="mt-1 text-[11px] text-destructive">{error}</p>}
    </div>
  );
}
