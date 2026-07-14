import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ShieldCheck, ShieldOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Profile = { id: string; full_name: string | null; phone: string | null; created_at: string };
type RoleRow = { user_id: string; role: "admin" | "customer" };

export const Route = createFileRoute("/admin/users")({
  head: () => ({ meta: [{ title: "Users — Admin FRAG AVENUE" }] }),
  component: AdminUsers,
});

function AdminUsers() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const [profilesRes, rolesRes] = await Promise.all([
        supabase.from("profiles").select("id, full_name, phone, created_at").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      if (profilesRes.error) throw profilesRes.error;
      if (rolesRes.error) throw rolesRes.error;
      const roles = new Map<string, Set<string>>();
      (rolesRes.data ?? []).forEach((r: RoleRow) => {
        if (!roles.has(r.user_id)) roles.set(r.user_id, new Set());
        roles.get(r.user_id)!.add(r.role);
      });
      return (profilesRes.data ?? []).map((p: Profile) => ({ ...p, roles: Array.from(roles.get(p.id) ?? []) }));
    },
  });

  const toggleAdmin = async (userId: string, isAdmin: boolean) => {
    if (isAdmin) {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "admin");
      if (error) return toast.error(error.message);
      toast.success("Admin removed");
    } else {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "admin" });
      if (error) return toast.error(error.message);
      toast.success("Promoted to admin");
    }
    qc.invalidateQueries({ queryKey: ["admin-users"] });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-10">
      <header className="mb-6">
        <p className="text-[11px] track-luxury text-[color:var(--gold)]">Access</p>
        <h1 className="mt-1 font-display text-2xl sm:text-3xl">Users ({(q.data ?? []).length})</h1>
      </header>
      <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-xl">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-section text-left text-[10px] track-luxury text-muted-foreground">
            <tr><th className="p-3">Name</th><th className="p-3">Phone</th><th className="p-3">Joined</th><th className="p-3">Roles</th><th className="p-3 text-right">Actions</th></tr>
          </thead>
          <tbody>
            {(q.data ?? []).map((u) => {
              const isAdmin = u.roles.includes("admin");
              return (
                <tr key={u.id} className="border-b border-border/50 last:border-0">
                  <td className="p-3 font-medium">{u.full_name ?? "—"}<div className="text-[10px] text-muted-foreground">{u.id.slice(0, 8)}</div></td>
                  <td className="p-3 text-muted-foreground">{u.phone ?? "—"}</td>
                  <td className="p-3 text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      {u.roles.map((r) => <span key={r} className={`rounded-lg border px-2 py-0.5 shadow-xl text-[10px] track-luxury ${r === "admin" ? "border-[color:var(--gold)] bg-[color:var(--gold)]/10 text-[color:var(--gold)]" : "border-border text-muted-foreground"}`}>{r}</span>)}
                    </div>
                  </td>
                  <td className="p-3 text-right">
                    <button onClick={() => toggleAdmin(u.id, isAdmin)} className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 shadow-xl text-[10px] track-luxury hover:border-[color:var(--gold)] hover:text-[color:var(--gold)]">
                      {isAdmin ? <><ShieldOff className="h-3 w-3" /> Revoke Admin</> : <><ShieldCheck className="h-3 w-3" /> Make Admin</>}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
