import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { ProductForm, type ProductFormInitial } from "@/components/admin/ProductForm";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/edit-product/$id")({
  ssr: false,
  head: () => ({ meta: [{ title: "Edit Product — Admin FRAG AVENUE" }] }),
  component: EditProduct,
});

function EditProduct() {
  const { id } = Route.useParams();
  const q = useQuery({
    queryKey: ["admin-edit-product", id],
    queryFn: async (): Promise<ProductFormInitial> => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          id, name, slug, brand_id, category_id, collection_id, description,
          notes_top, notes_heart, notes_base, image_url, base_price, discount_percent,
          is_new, is_featured, is_limited, is_active,
          images:product_images(id, image_url, sort_order),
          variants:product_variants(id, size_ml, price, stock)
        `)
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      const imgs = (data.images ?? []).slice().sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
      return {
        ...data,
        images: imgs.map((i: any) => ({ id: i.id, url: i.image_url, sort_order: i.sort_order })),
        variants: (data.variants ?? []).map((v: any) => ({ id: v.id, size_ml: v.size_ml, price: Number(v.price), stock: v.stock })),
      } as ProductFormInitial;
    },
  });

  return (
    <div className="p-6 lg:p-10">
      <header className="mb-6">
        <Link to="/admin/products" className="inline-flex items-center gap-1 text-[10px] track-luxury text-muted-foreground hover:text-[color:var(--gold)]">
          <ChevronLeft className="h-3 w-3" /> Back to products
        </Link>
        <h1 className="mt-2 font-display text-3xl"><span className="gold-text">Edit Product</span></h1>
        {q.data?.name && <p className="mt-1 text-sm text-muted-foreground">{q.data.name}</p>}
      </header>
      {q.isLoading ? (
        <div className="rounded-sm border border-border bg-card p-10 text-center text-sm text-muted-foreground">Loading…</div>
      ) : q.data ? (
        <ProductForm mode={{ kind: "edit", id }} initial={q.data} />
      ) : (
        <div className="rounded-sm border border-border bg-card p-10 text-center text-sm text-muted-foreground">Product not found.</div>
      )}
    </div>
  );
}
