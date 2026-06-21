import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { ProductForm } from "@/components/admin/ProductForm";

export const Route = createFileRoute("/admin/add-product")({
  ssr: false,
  head: () => ({ meta: [{ title: "Add Product — Admin FRAG AVENUE" }] }),
  component: AddProduct,
});

function AddProduct() {
  return (
    <div className="p-6 lg:p-10">
      <header className="mb-6">
        <Link to="/admin/products" className="inline-flex items-center gap-1 text-[10px] track-luxury text-muted-foreground hover:text-[color:var(--gold)]">
          <ChevronLeft className="h-3 w-3" /> Back to products
        </Link>
        <h1 className="mt-2 font-display text-3xl"><span className="gold-text">Add Product</span></h1>
        <p className="mt-1 text-sm text-muted-foreground">Create a new fragrance with images, variants, and metadata.</p>
      </header>
      <ProductForm mode={{ kind: "create" }} />
    </div>
  );
}
