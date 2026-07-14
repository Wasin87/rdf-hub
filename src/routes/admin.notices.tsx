import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Edit3, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Notice = {
  id: string; message: string; icon: string | null; link_url: string | null;
  is_active: boolean; order_index: number;
};

export const Route = createFileRoute("/admin/notices")({
  head: () => ({ meta: [{ title: "Notice Banners — Admin FRAG AVENUE" }] }),
  component: AdminNotices,
});

function AdminNotices() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Partial<Notice>>({ message: "", icon: "✦", order_index: 0, is_active: true });

  const q = useQuery({
    queryKey: ["admin-notices"],
    queryFn: async () => {
      const { data, error } = await supabase.from("notice_banners").select("*").order("order_index");
      if (error) throw error;
      return (data ?? []) as Notice[];
    },
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin-notices"] });
    qc.invalidateQueries({ queryKey: ["notice-banners"] });
  };

  const save = async (n: Partial<Notice>) => {
    if (!n.message || n.message.trim().length < 2) return toast.error("Message required");
    if (n.id) {
      const { error } = await supabase.from("notice_banners").update({
        message: n.message, icon: n.icon ?? null, link_url: n.link_url ?? null,
        is_active: n.is_active ?? true, order_index: n.order_index ?? 0,
      }).eq("id", n.id);
      if (error) return toast.error(error.message);
      toast.success("Updated");
      setEditing(null);
    } else {
      const { error } = await supabase.from("notice_banners").insert({
        message: n.message, icon: n.icon ?? "✦", link_url: n.link_url ?? null,
        is_active: n.is_active ?? true, order_index: n.order_index ?? 0,
      });
      if (error) return toast.error(error.message);
      toast.success("Created");
      setCreating(false);
      setDraft({ message: "", icon: "✦", order_index: 0, is_active: true });
    }
    refresh();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this notice?")) return;
    const { error } = await supabase.from("notice_banners").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    refresh();
  };

  const toggle = async (n: Notice) => {
    const { error } = await supabase.from("notice_banners").update({ is_active: !n.is_active }).eq("id", n.id);
    if (error) return toast.error(error.message);
    refresh();
  };

  return (
    <div className="p-6 lg:p-10">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] track-luxury text-[color:var(--gold)]">Marketing</p>
          <h1 className="mt-1 font-display text-3xl">Notice Banners</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sliding announcements shown beneath the navbar.</p>
        </div>
        <button onClick={() => setCreating(true)} className="btn-liquid"><Plus className="h-3.5 w-3.5" /> Add Notice</button>
      </header>

      {creating && (
        <div className="mb-6 rounded-lg border border-[color:var(--gold)]/30 bg-card shadow-xl p-5">
          <h3 className="mb-3 font-display text-lg">New Notice</h3>
          <div className="grid gap-3 sm:grid-cols-[60px_1fr_120px_120px_auto]">
            <Input label="Icon" value={draft.icon ?? ""} onChange={(v) => setDraft({ ...draft, icon: v })} />
            <Input label="Message" value={draft.message ?? ""} onChange={(v) => setDraft({ ...draft, message: v })} />
            <Input label="Link URL" value={draft.link_url ?? ""} onChange={(v) => setDraft({ ...draft, link_url: v })} />
            <Input label="Order" type="number" value={String(draft.order_index ?? 0)} onChange={(v) => setDraft({ ...draft, order_index: parseInt(v) || 0 })} />
            <div className="flex items-end gap-2">
              <button onClick={() => save(draft)} className="grid h-10 w-10 place-items-center rounded-sm bg-[color:var(--gold)] text-[color:var(--gold-foreground)]"><Check className="h-4 w-4" /></button>
              <button onClick={() => setCreating(false)} className="grid h-10 w-10 place-items-center rounded-sm border border-border"><X className="h-4 w-4" /></button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {q.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {(q.data ?? []).map((n) => (
          editing === n.id ? (
            <NoticeEditRow key={n.id} notice={n} onSave={save} onCancel={() => setEditing(null)} />
          ) : (
            <div key={n.id} className="flex items-center gap-4 rounded-lg border border-border bg-card shadow-xl p-4">
              <span className="text-lg text-[color:var(--gold)]">{n.icon ?? "✦"}</span>
              <div className="flex-1">
                <div className="text-sm">{n.message}</div>
                {n.link_url && <a href={n.link_url} className="text-[10px] text-[color:var(--gold)]">{n.link_url}</a>}
              </div>
              <div className="text-[10px] track-luxury text-muted-foreground">#{n.order_index}</div>
              <button onClick={() => toggle(n)} className={`rounded-lg border px-3 py-1 shadow-xl text-[10px] track-luxury ${n.is_active ? "border-[color:var(--gold)] bg-[color:var(--gold)]/10 text-[color:var(--gold)]" : "border-border text-muted-foreground"}`}>
                {n.is_active ? "Active" : "Inactive"}
              </button>
              <button onClick={() => setEditing(n.id)} className="text-muted-foreground hover:text-[color:var(--gold)]"><Edit3 className="h-4 w-4" /></button>
              <button onClick={() => remove(n.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
            </div>
          )
        ))}
        {(q.data ?? []).length === 0 && !q.isLoading && <p className="text-sm text-muted-foreground">No notices yet.</p>}
      </div>
    </div>
  );
}

function NoticeEditRow({ notice, onSave, onCancel }: { notice: Notice; onSave: (n: Partial<Notice>) => void; onCancel: () => void }) {
  const [d, setD] = useState<Notice>(notice);
  return (
    <div className="rounded-lg border border-[color:var(--gold)]/30 bg-card shadow-xl p-4">
      <div className="grid gap-3 sm:grid-cols-[60px_1fr_120px_100px_auto]">
        <Input label="Icon" value={d.icon ?? ""} onChange={(v) => setD({ ...d, icon: v })} />
        <Input label="Message" value={d.message} onChange={(v) => setD({ ...d, message: v })} />
        <Input label="Link" value={d.link_url ?? ""} onChange={(v) => setD({ ...d, link_url: v })} />
        <Input label="Order" type="number" value={String(d.order_index)} onChange={(v) => setD({ ...d, order_index: parseInt(v) || 0 })} />
        <div className="flex items-end gap-2">
          <button onClick={() => onSave(d)} className="grid h-10 w-10 place-items-center rounded-sm bg-[color:var(--gold)] text-[color:var(--gold-foreground)]"><Check className="h-4 w-4" /></button>
          <button onClick={onCancel} className="grid h-10 w-10 place-items-center rounded-sm border border-border"><X className="h-4 w-4" /></button>
        </div>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="mb-1 block text-[10px] track-luxury text-muted-foreground">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-lg border border-border bg-background shadow-xl px-3 text-sm focus:border-[color:var(--gold)] focus:outline-none" />
    </div>
  );
}
