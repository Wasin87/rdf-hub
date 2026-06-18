import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { MapPin, Plus, Trash2, Star } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/dashboard/addresses")({
  head: () => ({ meta: [{ title: "Addresses — RDF" }] }),
  component: AddressesPage,
});

const schema = z.object({
  full_name: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(8).max(20),
  line1: z.string().trim().min(3).max(140),
  line2: z.string().trim().max(140).optional(),
  city: z.string().trim().min(2).max(60),
  state: z.string().trim().max(60).optional(),
  postal_code: z.string().trim().min(3).max(15),
  country: z.string().trim().min(2).max(60),
});

function AddressesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { country: "Bangladesh" } });

  const list = useQuery({
    queryKey: ["addresses", user?.id], enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("addresses").select("*").eq("user_id", user!.id).order("is_default", { ascending: false }).order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    const { error } = await supabase.from("addresses").insert({ ...data, user_id: user!.id });
    if (error) { toast.error(error.message); return; }
    toast.success("Address added");
    setAdding(false); form.reset({ country: "Bangladesh" });
    qc.invalidateQueries({ queryKey: ["addresses"] });
  });

  const remove = async (id: string) => {
    const { error } = await supabase.from("addresses").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["addresses"] });
  };

  const setDefault = async (id: string) => {
    await supabase.from("addresses").update({ is_default: false }).eq("user_id", user!.id);
    const { error } = await supabase.from("addresses").update({ is_default: true }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Default address updated");
    qc.invalidateQueries({ queryKey: ["addresses"] });
  };

  return (
    <DashboardShell title="Addresses" description="Manage where your fragrances are delivered.">
      <div className="mb-5 flex justify-end">
        <button onClick={() => setAdding((a) => !a)} className="inline-flex items-center gap-2 rounded-sm border border-[color:var(--gold)] px-4 py-2 text-[11px] track-luxury text-[color:var(--gold)] hover:bg-[color:var(--gold)] hover:text-[color:var(--gold-foreground)]">
          <Plus className="h-3.5 w-3.5" /> {adding ? "Cancel" : "Add address"}
        </button>
      </div>

      {adding && (
        <form onSubmit={onSubmit} className="mb-8 space-y-4 rounded-sm border border-[color:var(--gold)]/20 bg-card p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full Name" {...form.register("full_name")} error={form.formState.errors.full_name?.message} />
            <Field label="Phone" {...form.register("phone")} error={form.formState.errors.phone?.message} />
          </div>
          <Field label="Address Line 1" {...form.register("line1")} error={form.formState.errors.line1?.message} />
          <Field label="Address Line 2" {...form.register("line2")} />
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="City" {...form.register("city")} error={form.formState.errors.city?.message} />
            <Field label="State / Division" {...form.register("state")} />
            <Field label="Postal Code" {...form.register("postal_code")} error={form.formState.errors.postal_code?.message} />
          </div>
          <Field label="Country" {...form.register("country")} />
          <button type="submit" className="btn-liquid">Save Address</button>
        </form>
      )}

      {list.data?.length === 0 && !adding && (
        <div className="grid place-items-center rounded-sm border border-dashed border-border py-16 text-center">
          <MapPin className="h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">No addresses yet.</p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {list.data?.map((a: { id: string; full_name: string; phone: string; line1: string; line2: string | null; city: string; state: string | null; postal_code: string; country: string; is_default: boolean }) => (
          <div key={a.id} className="rounded-sm border border-border bg-card p-5">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-[10px] track-luxury text-muted-foreground">Address</div>
              {a.is_default && <span className="inline-flex items-center gap-1 text-[10px] track-luxury text-[color:var(--gold)]"><Star className="h-3 w-3 fill-current" /> Default</span>}
            </div>
            <div className="font-medium">{a.full_name}</div>
            <p className="mt-1 text-sm text-muted-foreground">
              {a.line1}{a.line2 && `, ${a.line2}`}<br />
              {a.city}{a.state && `, ${a.state}`} {a.postal_code}<br />
              {a.country} • {a.phone}
            </p>
            <div className="mt-4 flex gap-2">
              {!a.is_default && <button onClick={() => setDefault(a.id)} className="text-[11px] track-luxury text-[color:var(--gold)] hover:underline">Set default</button>}
              <button onClick={() => remove(a.id)} className="ml-auto inline-flex items-center gap-1 text-[11px] track-luxury text-destructive hover:underline">
                <Trash2 className="h-3 w-3" /> Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}

const Field = (props: { label: string; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) => {
  const { label, error, ...rest } = props;
  return (
    <div>
      <label className="mb-1.5 block text-[10px] track-luxury text-muted-foreground">{label}</label>
      <input {...rest} className="h-11 w-full rounded-sm border border-border bg-background px-3 text-sm focus:border-[color:var(--gold)] focus:outline-none" />
      {error && <p className="mt-1 text-[11px] text-destructive">{error}</p>}
    </div>
  );
};
