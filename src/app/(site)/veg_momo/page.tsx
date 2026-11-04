import type { Metadata } from "next";
import { getProducts } from "@/lib/catalog";
import { VegProductList } from "@/components/MenuGrid";

export const metadata: Metadata = { title: "Veg Momos | Momo Delights" };

export default async function VegMenuPage() {
  const products = await getProducts();
  return (
    <main className="veg-menu-page">
      <h1>Veg Momos</h1>
      <VegProductList products={products.filter((product) => product.vegMenu)} />
    </main>
  );
}
