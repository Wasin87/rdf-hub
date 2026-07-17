import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Camera, Mail, Phone, User as UserIcon, Lock, Save, ShieldCheck, Shield, Smartphone, Trash2, Loader2 } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { appStorageImageUrl, IMAGE_BUCKETS, isAcceptedImage, getStoragePathFromAppUrl } from "@/lib/catalog";



export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "My Profile — FRAG AVENUE" }, { name: "description", content: "Manage your personal information, avatar and password." }] }),
  component: ProfilePage,
});

const profileSchema = z.object({
  full_name: z.string().trim().min(2, "Name is too short").max(80),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  avatar_url: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || v.startsWith("/") || /^https?:\/\//i.test(v), {
      message: "Must be a valid URL",
    }),
});
type ProfileForm = z.infer<typeof profileSchema>;

const passwordSchema = z.object({
  password: z.string().min(8, "At least 8 characters"),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Passwords do not match" });
type PasswordForm = z.infer<typeof passwordSchema>;

function ProfilePage() {
  const { user } = useAuth();
  const { isAdmin } = useRole();
  const qc = useQueryClient();
  const [savingPwd, setSavingPwd] = useState(false);
  const [payment, setPayment] = useState({ bkash: "", nagad: "", rocket: "" });
  const [savingPayment, setSavingPayment] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [deletingAvatar, setDeletingAvatar] = useState(false);
  const avatarFileRef = useRef<HTMLInputElement>(null);

  const paymentQ = useQuery({
    queryKey: ["payment_settings"],
    enabled: isAdmin,
    queryFn: async () => (await supabase.from("payment_settings").select("*").eq("id", "global").maybeSingle()).data,
  });
  useEffect(() => {
    if (paymentQ.data) setPayment({
      bkash: paymentQ.data.bkash_number ?? "",
      nagad: paymentQ.data.nagad_number ?? "",
      rocket: paymentQ.data.rocket_number ?? "",
    });
  }, [paymentQ.data]);

  const savePayment = async () => {
    setSavingPayment(true);
    const { error } = await supabase.from("payment_settings").upsert({
      id: "global",
      bkash_number: payment.bkash.trim() || null,
      nagad_number: payment.nagad.trim() || null,
      rocket_number: payment.rocket.trim() || null,
      updated_by: user?.id ?? null,
    });
    setSavingPayment(false);
    if (error) return toast.error(error.message);
    toast.success("Payment numbers updated");
    qc.invalidateQueries({ queryKey: ["payment_settings"] });
  };

  const clearPaymentField = async (field: "bkash" | "nagad" | "rocket") => {
    const patch = field === "bkash" ? { bkash_number: null } : field === "nagad" ? { nagad_number: null } : { rocket_number: null };
    const { error } = await supabase.from("payment_settings").update({ ...patch, updated_by: user?.id ?? null }).eq("id", "global");

    if (error) return toast.error(error.message);
    setPayment((p) => ({ ...p, [field]: "" }));
    toast.success(`${field} number removed`);
    qc.invalidateQueries({ queryKey: ["payment_settings"] });
  };


  const profileQ = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle()).data,
  });

  const form = useForm<ProfileForm>({ resolver: zodResolver(profileSchema), defaultValues: { full_name: "", phone: "", avatar_url: "" } });
  useEffect(() => {
    if (profileQ.data) form.reset({
      full_name: profileQ.data.full_name ?? "",
      phone: profileQ.data.phone ?? "",
      avatar_url: profileQ.data.avatar_url ?? "",
    });
  }, [profileQ.data]);

  const avatarUrl = form.watch("avatar_url");
  const fullName = form.watch("full_name");
  const initials = (fullName || user?.email || "U").split(/\s+/).map((s) => s[0]).slice(0, 2).join("").toUpperCase();

  const save = form.handleSubmit(async (data) => {
    if (!user) return;
    const { error } = await supabase.from("profiles").update({
      full_name: data.full_name,
      phone: data.phone || null,
      avatar_url: data.avatar_url || null,
    }).eq("id", user.id);
    if (error) return toast.error(error.message);
    toast.success("Profile updated");
    qc.invalidateQueries({ queryKey: ["profile"] });
  });

  const pwdForm = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema), defaultValues: { password: "", confirm: "" } });
  const changePassword = pwdForm.handleSubmit(async (data) => {
    setSavingPwd(true);
    const { error } = await supabase.auth.updateUser({ password: data.password });
    setSavingPwd(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated");
    pwdForm.reset({ password: "", confirm: "" });
  });

  return (
    <DashboardShell title="My Profile" description="Update your personal details, avatar and security.">
      <div className="space-y-8">
        {/* Header card */}
        <div className="rounded-lg border border-border bg-card p-6 shadow-xl">
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
            <div className="relative">
              <div className="grid h-24 w-24 place-items-center overflow-hidden rounded-full border border-[color:var(--gold)]/40 bg-section text-lg font-display text-[color:var(--gold)] shadow-xl">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={fullName || "avatar"} className="h-full w-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                ) : (
                  <span>{initials}</span>
                )}
              </div>
              <span className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full border border-border bg-background shadow-xl">
                <Camera className="h-3.5 w-3.5 text-[color:var(--gold)]" />
              </span>
            </div>
            <div className="text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <div className="font-display text-xl">{fullName || "Your name"}</div>
                {isAdmin ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-[color:var(--gold)]/50 bg-[color:var(--gold)]/10 px-2 py-0.5 text-[10px] font-semibold track-luxury text-[color:var(--gold)]">
                    <Shield className="h-3 w-3" /> Admin
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5 text-[10px] font-semibold track-luxury text-muted-foreground">
                    <UserIcon className="h-3 w-3" /> Customer
                  </span>
                )}
              </div>
              <div className="mt-1 flex flex-wrap justify-center gap-2 text-xs text-muted-foreground sm:justify-start">
                <span className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1 shadow-xl"><Mail className="h-3 w-3" /> {user?.email}</span>
                {profileQ.data?.phone && (
                  <span className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1 shadow-xl"><Phone className="h-3 w-3" /> {profileQ.data.phone}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Personal info */}
        <form onSubmit={save} className="space-y-5 rounded-lg border border-border bg-card p-6 shadow-xl">
          <div className="flex items-center gap-2">
            <UserIcon className="h-4 w-4 text-[color:var(--gold)]" />
            <h2 className="font-display text-lg">Personal Information</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[10px] track-luxury text-muted-foreground">Full Name</label>
              <input {...form.register("full_name")} className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm shadow-xl focus:border-[color:var(--gold)] focus:outline-none" />
              {form.formState.errors.full_name && <p className="mt-1 text-[11px] text-destructive">{form.formState.errors.full_name.message}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] track-luxury text-muted-foreground">Email (read-only)</label>
              <input value={user?.email ?? ""} disabled className="h-11 w-full rounded-lg border border-border bg-section px-3 text-sm text-muted-foreground shadow-xl" />
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] track-luxury text-muted-foreground">Phone</label>
              <input {...form.register("phone")} placeholder="+1 555 123 4567" className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm shadow-xl focus:border-[color:var(--gold)] focus:outline-none" />
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] track-luxury text-muted-foreground">Avatar URL</label>
              <input {...form.register("avatar_url")} placeholder="https://…" className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm shadow-xl focus:border-[color:var(--gold)] focus:outline-none" />
              {form.formState.errors.avatar_url && <p className="mt-1 text-[11px] text-destructive">{form.formState.errors.avatar_url.message}</p>}
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={form.formState.isSubmitting} className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-xs font-semibold shadow-xl transition hover:-translate-y-0.5 hover:border-[color:var(--gold)] hover:text-[color:var(--gold)] disabled:opacity-60">
              <Save className="h-3.5 w-3.5" /> {form.formState.isSubmitting ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>

        {/* Admin-only: Payment method numbers */}
        {isAdmin && (
          <div className="space-y-5 rounded-lg border border-[color:var(--gold)]/40 bg-card p-6 shadow-xl">
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-[color:var(--gold)]" />
              <h2 className="font-display text-lg">Payment Method Numbers</h2>
              <span className="ml-2 rounded-full border border-[color:var(--gold)]/50 bg-[color:var(--gold)]/10 px-2 py-0.5 text-[9px] font-semibold track-luxury text-[color:var(--gold)]">Admin only</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              These numbers are shown to customers on the checkout page when they choose bKash, Nagad or Rocket. Leave a field empty to hide it.
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              {(["bkash", "nagad", "rocket"] as const).map((k) => (
                <div key={k}>
                  <label className="mb-1.5 block text-[10px] track-luxury text-muted-foreground capitalize">{k} Number</label>
                  <div className="flex gap-2">
                    <input
                      value={payment[k]}
                      onChange={(e) => setPayment((p) => ({ ...p, [k]: e.target.value }))}
                      placeholder="01XXXXXXXXX"
                      className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm shadow-xl focus:border-[color:var(--gold)] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => clearPaymentField(k)}
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-border bg-background text-muted-foreground shadow-xl transition hover:border-destructive hover:text-destructive"
                      aria-label={`Remove ${k} number`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={savePayment}
                disabled={savingPayment}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-xs font-semibold shadow-xl transition hover:-translate-y-0.5 hover:border-[color:var(--gold)] hover:text-[color:var(--gold)] disabled:opacity-60"
              >
                <Save className="h-3.5 w-3.5" /> {savingPayment ? "Saving…" : "Save Payment Numbers"}
              </button>
            </div>
          </div>
        )}


        {/* Security */}
        <form onSubmit={changePassword} className="space-y-5 rounded-lg border border-border bg-card p-6 shadow-xl">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-[color:var(--gold)]" />
            <h2 className="font-display text-lg">Security</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[10px] track-luxury text-muted-foreground">New Password</label>
              <input type="password" {...pwdForm.register("password")} className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm shadow-xl focus:border-[color:var(--gold)] focus:outline-none" />
              {pwdForm.formState.errors.password && <p className="mt-1 text-[11px] text-destructive">{pwdForm.formState.errors.password.message}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] track-luxury text-muted-foreground">Confirm Password</label>
              <input type="password" {...pwdForm.register("confirm")} className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm shadow-xl focus:border-[color:var(--gold)] focus:outline-none" />
              {pwdForm.formState.errors.confirm && <p className="mt-1 text-[11px] text-destructive">{pwdForm.formState.errors.confirm.message}</p>}
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={savingPwd} className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-xs font-semibold shadow-xl transition hover:-translate-y-0.5 hover:border-[color:var(--gold)] hover:text-[color:var(--gold)] disabled:opacity-60">
              <ShieldCheck className="h-3.5 w-3.5" /> {savingPwd ? "Updating…" : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </DashboardShell>
  );
}
