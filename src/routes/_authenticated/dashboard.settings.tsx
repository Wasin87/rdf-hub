import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { LogOut } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/dashboard/settings")({
  head: () => ({ meta: [{ title: "Settings — RDF" }] }),
  component: SettingsPage,
});

const schema = z.object({
  full_name: z.string().trim().min(2).max(80),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
});

function SettingsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const profileQ = useQuery({
    queryKey: ["profile", user?.id], enabled: !!user,
    queryFn: async () => (await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle()).data,
  });

  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });
  useEffect(() => {
    if (profileQ.data) form.reset({ full_name: profileQ.data.full_name ?? "", phone: profileQ.data.phone ?? "" });
  }, [profileQ.data]);

  const save = form.handleSubmit(async (data) => {
    const { error } = await supabase.from("profiles").update({ full_name: data.full_name, phone: data.phone || null }).eq("id", user!.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Profile updated");
    qc.invalidateQueries({ queryKey: ["profile"] });
  });

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  };

  return (
    <DashboardShell title="Settings" description="Manage your account details and preferences.">
      <div className="grid gap-8 lg:grid-cols-2">
        <form onSubmit={save} className="space-y-4 rounded-sm border border-border bg-card p-6">
          <h2 className="font-display text-lg">Profile</h2>
          <div>
            <label className="mb-1.5 block text-[10px] track-luxury text-muted-foreground">Email</label>
            <input value={user?.email ?? ""} disabled className="h-11 w-full rounded-sm border border-border bg-section px-3 text-sm text-muted-foreground" />
          </div>
          <div>
            <label className="mb-1.5 block text-[10px] track-luxury text-muted-foreground">Full Name</label>
            <input {...form.register("full_name")} className="h-11 w-full rounded-sm border border-border bg-background px-3 text-sm focus:border-[color:var(--gold)] focus:outline-none" />
            {form.formState.errors.full_name && <p className="mt-1 text-[11px] text-destructive">{form.formState.errors.full_name.message}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-[10px] track-luxury text-muted-foreground">Phone</label>
            <input {...form.register("phone")} className="h-11 w-full rounded-sm border border-border bg-background px-3 text-sm focus:border-[color:var(--gold)] focus:outline-none" />
          </div>
          <button type="submit" className="btn-liquid">Save</button>
        </form>

        <div className="space-y-4 rounded-sm border border-destructive/30 bg-card p-6">
          <h2 className="font-display text-lg">Session</h2>
          <p className="text-sm text-muted-foreground">Sign out of your account on this device.</p>
          <button onClick={signOut} className="inline-flex items-center gap-2 rounded-sm border border-destructive/40 px-4 py-2.5 text-sm text-destructive hover:bg-destructive hover:text-destructive-foreground">
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </div>
    </DashboardShell>
  );
}
