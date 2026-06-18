import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, BellOff } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/dashboard/notifications")({
  head: () => ({ meta: [{ title: "Notifications — RDF" }] }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["notifications", user?.id], enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("notifications").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["notifications"] });
  };
  return (
    <DashboardShell title="Notifications" description="Order updates, exclusive previews and private invitations.">
      {(q.data?.length ?? 0) === 0 ? (
        <div className="grid place-items-center rounded-sm border border-dashed border-border py-16 text-center">
          <BellOff className="h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">All quiet — no notifications yet.</p>
        </div>
      ) : (
        <ul className="divide-y divide-border rounded-sm border border-border bg-card">
          {q.data!.map((n: { id: string; title: string; body: string | null; is_read: boolean; created_at: string }) => (
            <li key={n.id} className={`flex gap-3 p-4 ${!n.is_read ? "bg-[color:var(--gold)]/5" : ""}`} onClick={() => !n.is_read && markRead(n.id)}>
              <Bell className={`mt-0.5 h-4 w-4 ${!n.is_read ? "text-[color:var(--gold)]" : "text-muted-foreground"}`} />
              <div className="flex-1">
                <div className="font-medium">{n.title}</div>
                {n.body && <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>}
                <div className="mt-1 text-[11px] text-muted-foreground">{new Date(n.created_at).toLocaleString()}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </DashboardShell>
  );
}
