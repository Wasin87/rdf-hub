import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, ShieldCheck, Truck, Smartphone, Copy, Ticket, X, Check, Loader2 } from "lucide-react";
import { useCart } from "@/stores/cart";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatBDT } from "@/lib/format";
import { useQuery } from "@tanstack/react-query";


import { SafeImage } from "@/components/SafeImage";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — FRAG AVENUE" }] }),
  component: CheckoutPage,
});

const DEFAULT_PAYMENT_NUMBER = "Not set";

type PaymentMethod = "cod" | "bkash" | "nagad" | "rocket";


const baseSchema = z.object({
  full_name: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(8).max(20),
  line1: z.string().trim().min(3).max(140),
  line2: z.string().trim().max(140).optional(),
  city: z.string().trim().min(2).max(60),
  state: z.string().trim().max(60).optional(),
  postal_code: z.string().trim().min(3).max(15),
  country: z.string().trim().min(2).max(60),
  notes: z.string().max(400).optional(),
});

function CheckoutPage() {
  const items = useCart((s) => s.items);
  const subtotal = useCart((s) => s.subtotal());
  const clear = useCart((s) => s.clear);
  const { user, loading } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>("cod");
  const [txnId, setTxnId] = useState("");
  const [paymentPhone, setPaymentPhone] = useState("");
  const [methodErr, setMethodErr] = useState<string | null>(null);

  const shipping = subtotal >= 5000 ? 0 : 120;
  const total = subtotal + shipping;
  const isMobilePayment = method !== "cod";

  const paymentSettingsQ = useQuery({
    queryKey: ["payment_numbers"],
    queryFn: async () => {
      const [b, n, r] = await Promise.all([
        supabase.rpc("get_payment_number", { _method: "bkash" }),
        supabase.rpc("get_payment_number", { _method: "nagad" }),
        supabase.rpc("get_payment_number", { _method: "rocket" }),
      ]);
      return {
        bkash_number: (b.data as string | null) ?? "",
        nagad_number: (n.data as string | null) ?? "",
        rocket_number: (r.data as string | null) ?? "",
      };
    },
  });

  const paymentNumberFor = (m: PaymentMethod): string => {
    const s = paymentSettingsQ.data;
    if (m === "bkash") return s?.bkash_number || DEFAULT_PAYMENT_NUMBER;
    if (m === "nagad") return s?.nagad_number || DEFAULT_PAYMENT_NUMBER;
    if (m === "rocket") return s?.rocket_number || DEFAULT_PAYMENT_NUMBER;
    return "";
  };



  const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: typeof Truck; description: string }[] = [
    { id: "cod", label: "Cash on Delivery", icon: Truck, description: "Pay when your fragrance arrives." },
    { id: "bkash", label: "bKash", icon: Smartphone, description: `Send Money to ${paymentNumberFor("bkash")}` },
    { id: "nagad", label: "Nagad", icon: Smartphone, description: `Send Money to ${paymentNumberFor("nagad")}` },
    { id: "rocket", label: "Rocket", icon: Smartphone, description: `Send Money to ${paymentNumberFor("rocket")}` },
  ];
  const activePaymentNumber = isMobilePayment ? paymentNumberFor(method) : "";


  const form = useForm<z.infer<typeof baseSchema>>({
    resolver: zodResolver(baseSchema),
    defaultValues: { country: "Bangladesh" },
  });

  if (loading) return <div className="container-luxury py-24 text-center text-muted-foreground">Loading…</div>;
  if (!user) return (
    <div className="container-luxury grid place-items-center py-24 text-center">
      <h1 className="font-display text-3xl">Sign in to checkout</h1>
      <p className="mt-2 text-sm text-muted-foreground">Track your order and access your purchases anytime.</p>
      <Link to="/auth" search={{ mode: "login", redirect: "/checkout" } as never} className="btn-liquid mt-6 inline-flex">Sign In</Link>
    </div>
  );

  if (items.length === 0) return (
    <div className="container-luxury grid place-items-center py-24 text-center">
      <ShoppingBag className="h-10 w-10 text-muted-foreground" />
      <h1 className="mt-4 font-display text-3xl">Your cart is empty</h1>
      <Link to="/shop" className="btn-liquid mt-6 inline-flex">Begin shopping</Link>
    </div>
  );

  const onSubmit = form.handleSubmit(async (data) => {
    setMethodErr(null);
    if (isMobilePayment) {
      if (!txnId.trim() || txnId.trim().length < 6) { setMethodErr("Enter the transaction ID from your payment confirmation"); return; }
      if (!paymentPhone.trim() || paymentPhone.trim().length < 8) { setMethodErr("Enter the phone number you paid from"); return; }
    }
    setSubmitting(true);
    try {
      const { data: rows, error } = await supabase.rpc("place_order", {
        _address: data,
        _items: items.map((i) => ({ variant_id: i.variantId, quantity: i.quantity })),
        _payment_method: method,
        _txn_id: isMobilePayment ? txnId.trim() : "",
        _payment_phone: isMobilePayment ? paymentPhone.trim() : "",
        _notes: data.notes ?? "",
      });
      if (error) throw error;
      const order = Array.isArray(rows) ? rows[0] : rows;
      if (!order?.id) throw new Error("Order could not be created");

      clear();
      toast.success("Order placed", { description: `Order ${order.order_number} confirmed.` });
      window.location.assign("/dashboard/orders");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Could not place order");
    } finally { setSubmitting(false); }
  });

  return (
    <div className="container-luxury py-12 lg:py-16">
      <h1 className="mb-2 font-display text-4xl font-bold text-foreground">Checkout</h1>
      <p className="text-sm text-muted-foreground">Authenticity guaranteed · Secure payment</p>

      <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_400px]">
        <motion.form onSubmit={onSubmit} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-7">
          <section className="space-y-5">
            <h2 className="font-display text-xl">Shipping Details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full Name" {...form.register("full_name")} error={form.formState.errors.full_name?.message} />
              <Field label="Phone" {...form.register("phone")} error={form.formState.errors.phone?.message} />
            </div>
            <Field label="Address Line 1" {...form.register("line1")} error={form.formState.errors.line1?.message} />
            <Field label="Address Line 2 (optional)" {...form.register("line2")} />
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="City" {...form.register("city")} error={form.formState.errors.city?.message} />
              <Field label="State / Division" {...form.register("state")} />
              <Field label="Postal Code" {...form.register("postal_code")} error={form.formState.errors.postal_code?.message} />
            </div>
            <Field label="Country" {...form.register("country")} />
          </section>

          <section className="space-y-4">
            <h2 className="font-display text-xl">Payment Method</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {PAYMENT_METHODS.map((m) => {
                const Icon = m.icon;
                const active = method === m.id;
                return (
                  <button type="button" key={m.id} onClick={() => setMethod(m.id)}
                    className={`flex items-start gap-3 rounded-sm border p-3 text-left transition-all ${active ? "border-[color:var(--gold)] bg-[color:var(--gold)]/5" : "border-border hover:border-[color:var(--gold)]/40"}`}>
                    <Icon className={`mt-0.5 h-4 w-4 ${active ? "text-[color:var(--gold)]" : "text-muted-foreground"}`} />
                    <div>
                      <div className={`text-sm font-medium ${active ? "text-[color:var(--gold)]" : ""}`}>{m.label}</div>
                      <div className="text-[11px] text-muted-foreground">{m.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            <AnimatePresence>
              {isMobilePayment && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden">
                  <div className="rounded-sm border border-[color:var(--gold)]/30 bg-section p-4">
                    <p className="text-xs text-muted-foreground">Send the total to the merchant number below, then enter the Transaction ID and the phone you paid from.</p>
                    <div className="mt-3 flex items-center gap-2 rounded-sm border border-[color:var(--gold)]/30 bg-card px-3 py-2">
                      <Smartphone className="h-4 w-4 text-[color:var(--gold)]" />
                      <span className="font-display text-lg tracking-wider">{activePaymentNumber}</span>
                      <button type="button" onClick={() => { navigator.clipboard.writeText(activePaymentNumber); toast.success("Number copied"); }} className="ml-auto text-muted-foreground hover:text-[color:var(--gold)]">

                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-[10px] track-luxury text-muted-foreground">Transaction ID</label>
                        <input value={txnId} onChange={(e) => setTxnId(e.target.value)} placeholder="e.g. 9F8H2K1L"
                          className="h-11 w-full rounded-sm border border-border bg-background px-3 text-sm uppercase tracking-wider focus:border-[color:var(--gold)] focus:outline-none" />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-[10px] track-luxury text-muted-foreground">Sender Phone</label>
                        <input value={paymentPhone} onChange={(e) => setPaymentPhone(e.target.value)} placeholder="01XXXXXXXXX"
                          className="h-11 w-full rounded-sm border border-border bg-background px-3 text-sm focus:border-[color:var(--gold)] focus:outline-none" />
                      </div>
                    </div>
                    {methodErr && <p className="mt-2 text-[11px] text-destructive">{methodErr}</p>}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          <div>
            <label className="mb-1.5 block text-[10px] track-luxury text-muted-foreground">Order Notes (optional)</label>
            <textarea {...form.register("notes")} rows={3} className="w-full rounded-sm border border-border bg-background p-3 text-sm focus:border-[color:var(--gold)] focus:outline-none" />
          </div>
          <button type="submit" disabled={submitting} className="btn-liquid w-full">
            {submitting ? "Placing order…" : `Place Order — ${formatBDT(total)}`}
          </button>
          <p className="flex items-center gap-2 text-[11px] text-muted-foreground"><ShieldCheck className="h-3.5 w-3.5 text-[color:var(--gold)]" /> Secure & encrypted. Order tracking available in your dashboard.</p>
        </motion.form>

        <aside className="h-fit rounded-sm border border-[color:var(--gold)]/20 bg-section p-6">
          <h2 className="mb-4 font-display text-xl">Order Summary</h2>
          <div className="space-y-3">
            {items.map((i) => (
              <div key={i.variantId} className="flex gap-3">
                <SafeImage src={i.imageUrl} alt={i.productName} wrapperClassName="h-14 w-14 rounded-sm" className="h-14 w-14 object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] track-luxury text-muted-foreground">{i.brandName}</div>
                  <div className="truncate text-sm">{i.productName}</div>
                  <div className="text-xs text-muted-foreground">{i.sizeMl}ml × {i.quantity}</div>
                </div>
                <div className="shrink-0 text-sm">{formatBDT(i.price * i.quantity)}</div>
              </div>
            ))}
          </div>
          <div className="mt-5 space-y-2 border-t border-border pt-5 text-sm">
            <Row label="Subtotal" value={formatBDT(subtotal)} />
            <Row label="Shipping" value={shipping === 0 ? "Free" : formatBDT(shipping)} />
            <div className="my-3 hairline" />
            <div className="flex justify-between text-xl font-semibold"><span>Total</span><span className="text-[color:var(--gold)]">{formatBDT(total)}</span></div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between"><span className="text-muted-foreground">{label}</span><span>{value}</span></div>;
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
