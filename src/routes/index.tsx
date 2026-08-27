import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  fetchBanners,
  fetchBrands,
  fetchProducts,
  fetchFeaturedReviews,
} from "@/lib/catalog";

import { HeroSlider } from "@/components/HeroSlider";
import { BrandMarquee } from "@/components/BrandMarquee";
import { CollectionGrid } from "@/components/CollectionGrid";
import { ProductSection } from "@/components/ProductSection";
import { ReviewsSlider } from "@/components/ReviewsSlider";
import { TrustSection } from "@/components/TrustSection";
import { AttarBanner } from "@/components/AttarBanner";
import { HotSellSection } from "@/components/HotSellSection";

export const Route = createFileRoute("/")({
  head: () => ({
    title: "FRAG AVENUE | Authentic Luxury Perfume Decants in Bangladesh",

    meta: [
      {
        name: "description",
        content:
          "Shop authentic luxury perfume decants in Bangladesh. Explore Dior, Chanel, Tom Ford, Creed, Maison Francis Kurkdjian, Xerjoff, Louis Vuitton and more. Available in 3ml, 5ml, 10ml & 30ml.",
      },

      {
        name: "keywords",
        content:
          "FRAG AVENUE, perfume Bangladesh, luxury perfume, perfume decants, Dior, Chanel, Tom Ford, Creed, Xerjoff, Louis Vuitton, niche fragrance",
      },

      {
        name: "robots",
        content: "index,follow",
      },

      {
        name: "author",
        content: "FRAG AVENUE",
      },

      {
        name: "theme-color",
        content: "#000000",
      },

      // Open Graph
      {
        property: "og:type",
        content: "website",
      },
      {
        property: "og:site_name",
        content: "FRAG AVENUE",
      },
      {
        property: "og:title",
        content: "FRAG AVENUE | Authentic Luxury Perfume Decants",
      },
      {
        property: "og:description",
        content:
          "Luxury perfume decants from Dior, Chanel, Creed, Tom Ford, Louis Vuitton and more.",
      },
      {
        property: "og:url",
        content: "https://fragavenue.com",
      },
      {
        property: "og:image",
        content: "https://fragavenue.com/og-image.jpg",
      },

      // Twitter
      {
        name: "twitter:card",
        content: "summary_large_image",
      },
      {
        name: "twitter:title",
        content: "FRAG AVENUE | Luxury Perfume Decants",
      },
      {
        name: "twitter:description",
        content:
          "Authentic luxury perfume decants in Bangladesh.",
      },
      {
        name: "twitter:image",
        content: "https://fragavenue.com/og-image.jpg",
      },
    ],

    links: [
      {
        rel: "canonical",
        href: "https://fragavenue.com",
      },
    ],
  }),

  component: HomePage,
});

function HomePage() {
  const banners = useQuery({
    queryKey: ["banners"],
    queryFn: fetchBanners,
  });

  const brands = useQuery({
    queryKey: ["brands"],
    queryFn: fetchBrands,
  });

  const newArrivals = useQuery({
    queryKey: ["products", "new"],
    queryFn: () => fetchProducts({ isNew: true, limit: 10 }),
  });

  const discounts = useQuery({
    queryKey: ["products", "discount"],
    queryFn: () => fetchProducts({ isDiscounted: true, limit: 10 }),
  });

  const atorProducts = useQuery({
    queryKey: ["products", "ator"],
    queryFn: () => fetchProducts({ categorySlug: "ator" }),
  });

  const reviews = useQuery({
    queryKey: ["reviews", "featured"],
    queryFn: fetchFeaturedReviews,
  });

  return (
    <>
      {banners.data && <HeroSlider banners={banners.data} />}

      <CollectionGrid />

      <AttarBanner />

      <HotSellSection />

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
            <Link to="/shop" className="btn-liquid">
              All Products
            </Link>
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
            <Link to="/shop" className="btn-liquid">
              All Products
            </Link>
          </div>
        </div>
      )}

      {atorProducts.data && atorProducts.data.data.length > 0 && (
        <>
          <ProductSection
            eyebrow="Attar Atelier"
            title="Premium Attar Products"
            description="Alcohol-free attars crafted from oud, amber and rose."
            products={atorProducts.data.data.slice(0, 10)}
            viewAllSearch={{ category: "ator" }}
          />

          <div className="container-luxury -mt-4 flex justify-center pb-10 md:pb-14">
            <Link to="/shop" className="btn-liquid">
              All Products
            </Link>
          </div>
        </>
      )}

      {brands.data && brands.data.length > 0 && (
        <BrandMarquee brands={brands.data} />
      )}

      <TrustSection />

      {reviews.data && <ReviewsSlider reviews={reviews.data} />}
    </>
  );
}