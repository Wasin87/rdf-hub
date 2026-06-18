import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchBanners, fetchBrands, fetchProducts, fetchFeaturedReviews } from "@/lib/catalog";
import { HeroSlider } from "@/components/HeroSlider";
import { BrandMarquee } from "@/components/BrandMarquee";
import { CollectionGrid } from "@/components/CollectionGrid";
import { ProductSection } from "@/components/ProductSection";
import { ReviewsSlider } from "@/components/ReviewsSlider";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RDF — Rezoan's Decant & Fragrance | Luxury Perfume Decants" },
      { name: "description", content: "Authentic luxury fragrance decants from the world's most prestigious houses. Dior, Chanel, Tom Ford, Creed and more — 3ml to 30ml." },
      { property: "og:title", content: "RDF — Rezoan's Decant & Fragrance" },
      { property: "og:description", content: "Authentic luxury fragrance decants from the world's most prestigious houses." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const banners = useQuery({ queryKey: ["banners"], queryFn: fetchBanners });
  const brands = useQuery({ queryKey: ["brands"], queryFn: fetchBrands });
  const newArrivals = useQuery({ queryKey: ["products", "new"], queryFn: () => fetchProducts({ isNew: true, limit: 10 }) });
  const discounts = useQuery({ queryKey: ["products", "discount"], queryFn: () => fetchProducts({ isDiscounted: true, limit: 10 }) });
  const reviews = useQuery({ queryKey: ["reviews", "featured"], queryFn: fetchFeaturedReviews });

  return (
    <>
      {banners.data && <HeroSlider banners={banners.data} />}
      {brands.data && brands.data.length > 0 && <BrandMarquee brands={brands.data} />}
      <CollectionGrid />
      {newArrivals.data && (
        <ProductSection
          eyebrow="Fresh from the Atelier"
          title="New Arrivals"
          description="The latest fragrances to enter our boutique."
          products={newArrivals.data.data}
          viewAllSearch={{ filter: "new" }}
        />
      )}
      {discounts.data && discounts.data.data.length > 0 && (
        <div className="bg-section">
          <ProductSection
            eyebrow="Special Acquisitions"
            title="The Discount Edit"
            description="Exceptional pieces, briefly available at a refined price."
            products={discounts.data.data}
            viewAllSearch={{ filter: "discount" }}
          />
        </div>
      )}
      {reviews.data && <ReviewsSlider reviews={reviews.data} />}
    </>
  );
}
