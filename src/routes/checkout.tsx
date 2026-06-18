import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ShoppingBag, ShieldCheck } from "lucide-react";
import { useCart } from "@/stores/cart";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatBDT } from "@/lib/format";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — RDF" }] }),
  component: CheckoutPage,
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
  notes: z.string().max(400).optional(),
});

function CheckoutPage() {
  const items = useCart((s) => s.items);
  const subtotal = useCart((s) => s.subtotal());
  const clear = useCart((s) => s.clear);
  const { user, loading } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const shipping = subtotal >= 5000 ? 0 : 120;
  const total = subtotal + shipping;

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
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
    setSubmitting(true);
    try {
      const { data: order, error } = await supabase.from("orders").insert({
        user_id: user.id,
        address_snapshot: data,
        subtotal, shipping, total,
        payment_method: "cod",
        notes: data.notes ?? null,
      }).select("id, order_number").single();
      if (error) throw error;

      const { error: itemsErr } = await supabase.from("order_items").insert(items.map((i) => ({
        order_id: order.id,
        product_id: i.productId,
        variant_id: i.variantId,
        product_name: i.productName,
        brand_name: i.brandName,
        size_ml: i.sizeMl,
        unit_price: i.price,
        quantity: i.quantity,
        image_url: i.imageUrl,
      })));
      if (itemsErr) throw itemsErr;

      clear();
      toast.success("Order placed", { description: `Order ${order.order_number} confirmed.` });
      window.location.assign("/dashboard/orders");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Could not place order");
    } finally { setSubmitting(false); }
  });

  return (
    <div className="container-luxury py-12 lg:py-16">
      <h1 className="mb-2 font-display text-4xl"><span className="gold-text">Checkout</span></h1>
      <p className="text-sm text-muted-foreground">Cash on Delivery • Authenticity guaranteed</p>

      <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_400px]">
        <motion.form onSubmit={onSubmit} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
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
          <div>
            <label className="mb-1.5 block text-[10px] track-luxury text-muted-foreground">Order Notes (optional)</label>
            <textarea {...form.register("notes")} rows={3} className="w-full rounded-sm border border-border bg-background p-3 text-sm focus:border-[color:var(--gold)] focus:outline-none" />
          </div>
          <button type="submit" disabled={submitting} className="btn-liquid w-full">
            {submitting ? "Placing order…" : `Place Order — ${formatBDT(total)}`}
          </button>
          <p className="flex items-center gap-2 text-[11px] text-muted-foreground"><ShieldCheck className="h-3.5 w-3.5 text-[color:var(--gold)]" /> Secure & encrypted. Pay on delivery.</p>
        </motion.form>

        <aside className="rounded-sm border border-[color:var(--gold)]/20 bg-section p-6">
          <h2 className="mb-4 font-display text-xl">Order Summary</h2>
          <div className="space-y-3">
            {items.map((i) => (
              <div key={i.variantId} className="flex gap-3">
                <img src={i.imageUrl} alt={i.productName} className="h-14 w-14 rounded-sm object-cover" />
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
            <div className="flex justify-between font-display text-xl"><span>Total</span><span className="text-[color:var(--gold)]">{formatBDT(total)}</span></div>
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
