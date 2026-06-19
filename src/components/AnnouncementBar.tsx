import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

type Notice = { id: string; message: string; icon: string | null; link_url: string | null };

async function fetchNotices(): Promise<Notice[]> {
  const { data, error } = await supabase
    .from("notice_banners")
    .select("id, message, icon, link_url, is_active, starts_at, ends_at, order_index")
    .eq("is_active", true)
    .order("order_index");
  if (error) return [];
  const now = Date.now();
  return (data ?? []).filter((n) => {
    const startsAt = n.starts_at as string | null;
    const endsAt = n.ends_at as string | null;
    if (startsAt && new Date(startsAt).getTime() > now) return false;
    if (endsAt && new Date(endsAt).getTime() < now) return false;
    return true;
  }) as Notice[];
}

const FALLBACK: Notice[] = [
  { id: "f1", message: "Complimentary shipping on orders over ৳ 5,000", icon: "✦", link_url: null },
  { id: "f2", message: "Authenticity guaranteed — sourced direct from boutiques", icon: "✧", link_url: null },
  { id: "f3", message: "Now offering 3ml • 6ml • 10ml • 15ml • 30ml decants", icon: "✦", link_url: null },
];

export function AnnouncementBar() {
  const { data } = useQuery({ queryKey: ["notice-banners"], queryFn: fetchNotices, staleTime: 60_000 });
  const notices = data && data.length > 0 ? data : FALLBACK;
  const loop = [...notices, ...notices, ...notices];
  return (
    <div className="border-b border-[color:var(--gold)]/20 bg-foreground text-background">
      <div className="container-luxury flex h-9 items-center justify-center overflow-hidden">
        <motion.div
          className="flex gap-16"
          animate={{ x: [0, -1200] }}
          transition={{ repeat: Infinity, duration: 38, ease: "linear" }}
        >
          {loop.map((m, i) => {
            const inner = (
              <span className="whitespace-nowrap text-[10px] track-luxury text-background/85">
                <span className="text-[color:var(--gold-soft)]">{m.icon ?? "✦"}</span> {m.message}
              </span>
            );
            return m.link_url ? (
              <a key={`${m.id}-${i}`} href={m.link_url} className="hover:text-[color:var(--gold-soft)]">{inner}</a>
            ) : (
              <span key={`${m.id}-${i}`}>{inner}</span>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
