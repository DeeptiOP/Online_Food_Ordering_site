import type { Metadata } from "next";
import { getCategories, getProducts } from "@/lib/catalog";
import { ProductGrid } from "@/components/MenuGrid";

export const metadata: Metadata = { title: "All Momos | Momo Delights" };

export default async function MenuPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const params = await searchParams;
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);
  const supported = new Set(categories.map((category) => category.id));
  const initialFilters = (params.filter ?? "").toLowerCase().split(",").filter((filter) => supported.has(filter));
  const menuProducts = products.filter((product) => !product.vegMenu);

  return (
    <main>
      <section className="menu" id="menu">
        <div className="container">
          <div className="heading"><h2>All Momos</h2><hr /><p>Explore our complete menu — click Add to Cart to start your order.</p></div>
          <ProductGrid products={menuProducts} categories={categories} showFilters initialFilters={initialFilters} />
        </div>
      </section>
    </main>
  );
}
