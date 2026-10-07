import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { CheckCircle2, Truck, ShieldCheck, Clock, Sparkles, ShoppingBag, ArrowRight } from "lucide-react";
import { z } from "zod";

const searchSchema = z.object({
  order: z.string().optional(),
  total: z.string().optional(),
  method: z.string().optional(),
});

export const Route = createFileRoute("/order-confirmed")({
  staticData: { sitemap: false },
  head: () => ({ meta: [{ title: "Order Confirmed — FRAG AVENUE" }, { name: "robots", content: "noindex,nofollow" }] }),
  validateSearch: (s) => searchSchema.parse(s),
  component: OrderConfirmedPage,
});

function OrderConfirmedPage() {
  const { order, total, method } = Route.useSearch();
  const isMobile = method && method !== "cod";

  return (
    <div className="container-luxury py-16 lg:py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="mx-auto max-w-3xl"
      >
        {/* Success icon */}
        <div className="mb-8 flex flex-col items-center text-center">
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
            className="relative mb-6"
          >
            <div className="absolute inset-0 animate-ping rounded-full bg-[color:var(--gold)]/20" />
            <div className="relative grid h-24 w-24 place-items-center rounded-full border border-[color:var(--gold)]/40 bg-[color:var(--gold)]/10">
              <CheckCircle2 className="h-12 w-12 text-[color:var(--gold)]" strokeWidth={1.5} />
            </div>
          </motion.div>

          <h1 className="font-display text-4xl font-bold text-foreground sm:text-5xl">
            Order Confirmed <span className="text-[color:var(--gold)]">Successfully</span>
          </h1>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
            Thank you for choosing FRAG AVENUE. Your fragrance journey is on its way — a beautifully crafted experience awaits your doorstep.
          </p>

          {order && (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm">
              <span className="rounded-sm border border-[color:var(--gold)]/30 bg-[color:var(--gold)]/5 px-3 py-1.5">
                Order ID: <span className="ml-1 font-mono font-semibold text-[color:var(--gold)]">#{order}</span>
              </span>
              {total && (
                <span className="rounded-sm border border-border bg-section px-3 py-1.5">
                  Total: <span className="ml-1 font-semibold text-[color:var(--gold)]">৳ {Number(total).toLocaleString()}</span>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Info cards */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <InfoCard
            icon={<Truck className="h-5 w-5" />}
            title="Fast Delivery — Within 7 Days"
            description="Your order will be carefully packed and dispatched. Expect it at your doorstep within 3–7 business days across Bangladesh."
          />
          <InfoCard
            icon={<ShieldCheck className="h-5 w-5" />}
            title="100% Authentic. Guaranteed."
            description="Every bottle is sourced through verified channels. Our authenticity promise protects every purchase."
          />
          <InfoCard
            icon={isMobile ? <Clock className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
            title={isMobile ? "Payment Verification in Progress" : "Cash on Delivery Confirmed"}
            description={isMobile
              ? "Our team will verify your Transaction ID shortly. Once confirmed, your order enters processing and is shipped promptly."
              : "Keep the exact amount ready. Our courier partner will collect payment upon delivery — no advance required."}
          />
          <InfoCard
            icon={<Sparkles className="h-5 w-5" />}
            title="Track Every Step"
            description="Real-time status updates — Confirmed, Packed, Out for Delivery, Delivered — are available in your dashboard at any time."
          />
        </div>

        {/* Timeline */}
        <div className="mt-10 rounded-sm border border-[color:var(--gold)]/20 bg-section p-6">
          <h2 className="mb-5 font-display text-xl">What Happens Next</h2>
          <ol className="space-y-4">
            <Step n={1} title="Order Received" body="Your order has been placed and is visible in your dashboard." />
            <Step n={2} title={isMobile ? "Transaction Verified by Admin" : "Order Confirmed by Admin"}
              body={isMobile
                ? "Our team matches your Transaction ID with the payment received. This typically takes a few hours."
                : "Our team reviews the order and confirms it for fulfilment."} />
            <Step n={3} title="Packed with Care" body="Your fragrance is packed in secure, protective packaging worthy of a luxury house." />
            <Step n={4} title="Dispatched & Delivered" body="A trusted courier partner delivers to your address within 3–7 business days." />
          </ol>
        </div>

        {/* Actions */}
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link to="/shop" className="btn-liquid inline-flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" /> Shop Now
          </Link>
          <Link
            to="/dashboard/orders"
            className="inline-flex items-center gap-2 rounded-sm border border-border bg-background px-6 py-3 text-sm font-medium transition-colors hover:border-[color:var(--gold)] hover:text-[color:var(--gold)]"
          >
            View Order Status <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Need help? Contact our concierge — we're here to make your fragrance journey unforgettable.
        </p>
      </motion.div>
    </div>
  );
}

function InfoCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="group rounded-sm border border-border bg-card p-5 transition-all hover:border-[color:var(--gold)]/40 hover:shadow-lg">
      <div className="mb-3 inline-grid h-10 w-10 place-items-center rounded-sm bg-[color:var(--gold)]/10 text-[color:var(--gold)]">
        {icon}
      </div>
      <h3 className="mb-1.5 font-display text-base font-semibold">{title}</h3>
      <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <li className="flex gap-4">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[color:var(--gold)]/40 bg-[color:var(--gold)]/10 font-mono text-xs font-bold text-[color:var(--gold)]">
        {n}
      </div>
      <div>
        <div className="font-medium text-foreground">{title}</div>
        <div className="text-xs text-muted-foreground">{body}</div>
      </div>
    </li>
  );
}
