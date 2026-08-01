import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchBanners, fetchBrands, fetchProducts, fetchFeaturedReviews } from "@/lib/catalog";
import { HeroSlider } from "@/components/HeroSlider";
import { BrandMarquee } from "@/components/BrandMarquee";
import { CollectionGrid } from "@/components/CollectionGrid";
import { ProductSection } from "@/components/ProductSection";
import { ReviewsSlider } from "@/components/ReviewsSlider";
import { TrustSection } from "@/components/TrustSection";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FRAG AVENUE — Luxury Perfume Decants" },
      { name: "description", content: "FRAG AVENUE Authentic luxury fragrance decants from the world's most prestigious houses. Dior, Chanel, Tom Ford, Creed and more — 3ml to 30ml." },
      { property: "og:title", content: "FRAG AVENUE — Luxury Perfume Decants" },
      { property: "og:description", content: "FRAG AVENUE Authentic luxury fragrance decants from the world's most prestigious houses." },
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
      <CollectionGrid />
      {newArrivals.data && (
        <>
          <ProductSection
            eyebrow="Fresh from the Atelier"
            title="New Arrivals"
            description="The latest fragrances to enter our boutique."
            products={newArrivals.data.data}
            viewAllSearch={{ filter: "new" }}
          />
          <div className="container-luxury -mt-4 flex justify-center pb-10 md:pb-14">
            <Link to="/shop" className="btn-liquid">All Products</Link>
          </div>
        </>
      )}
      {discounts.data && discounts.data.data.length > 0 && (
        <div className="bg-section">
          <ProductSection
            eyebrow="Special Acquisitions"
            title="Discounted Products"
            description="Exceptional pieces, briefly available at a refined price."
            products={discounts.data.data}
            viewAllSearch={{ filter: "discount" }}
          />
          <div className="container-luxury -mt-4 flex justify-center pb-10 md:pb-14">
            <Link to="/shop" className="btn-liquid">All Products</Link>
          </div>
        </div>
      )}
      {brands.data && brands.data.length > 0 && <BrandMarquee brands={brands.data} />}
      <TrustSection />
      {reviews.data && <ReviewsSlider reviews={reviews.data} />}
    </>
  );
}
