import { getDatabase, type CategoryDocument, type ProductDocument } from "@/lib/database";

export type Product = {
  id: string;
  name: string;
  description: string;
  image: string;
  price: number;
  types: string[];
  vegMenu?: boolean;
};

export const products: Product[] = [
  { id: "steamed-veg", name: "Steamed Veg Momos", description: "Classic steamed momos with mixed vegetables and herbs.", image: "classic_momo.jpg", price: 120, types: ["veg", "paneer"] },
  { id: "paneer", name: "Paneer Momos", description: "Stuffed with spiced paneer and fresh herbs.", image: "cheese_momo.jpg", price: 160, types: ["veg", "paneer"] },
  { id: "cheese-corn", name: "Cheese Corn Momos", description: "Creamy cheese and sweet corn filling.", image: "cheese_corn.jpg", price: 170, types: ["veg", "special"] },
  { id: "chicken", name: "Classic Chicken Momos", description: "Juicy minced chicken with aromatic spices.", image: "chicken_steam.jpg", price: 180, types: ["nonveg", "chicken"] },
  { id: "butter-chicken", name: "Butter Chicken Momos", description: "Rich butter chicken filling with creamy sauce.", image: "butter_chicken.jpg", price: 220, types: ["nonveg", "chicken", "special"] },
  { id: "tandoori", name: "Tandoori Momos", description: "Grilled momos with smoky tandoori marinade.", image: "tandoori_momo.jpg", price: 200, types: ["special"] },
  { id: "achari-paneer", name: "Achari Paneer Momos", description: "Spiced paneer with pickle-inspired seasoning.", image: "classic_momo.jpg", price: 190, types: ["veg", "paneer", "special"] },
  { id: "spicy-chicken", name: "Spicy Chicken Momos", description: "Extra spicy chicken momos with chili sauce.", image: "spicy_chicken.jpg", price: 190, types: ["nonveg", "chicken"] },
  { id: "mushroom-truffle", name: "Mushroom Truffle Momos", description: "Premium mushrooms with truffle oil essence.", image: "mushroom.jpg", price: 240, types: ["special", "veg"] },
  { id: "thai-chicken", name: "Thai Chicken Momos", description: "Thai-spiced chicken with lemongrass and basil.", image: "chilli_momo.jpg", price: 210, types: ["special", "nonveg", "chicken"] },
  { id: "chilli-veg", name: "Chilli Veg Momos", description: "Veg momos tossed in spicy chilli sauce.", image: "chilli_veg.jpg", price: 150, types: ["veg", "special"] },
  { id: "chilli-chicken", name: "Chilli Chicken Momos", description: "Chicken momos tossed in bold chilli sauce.", image: "chilli_momo.jpg", price: 190, types: ["nonveg", "special"] },
  { id: "fried-veg", name: "Fried Veg Momos", description: "Crispy shallow-fried vegetable momos.", image: "fried_veg.jpg", price: 140, types: ["veg"] },
  { id: "fried-chicken", name: "Fried Chicken Momos", description: "Crispy fried chicken momos with a crunchy shell.", image: "fried_veg.jpg", price: 180, types: ["nonveg"] },
  { id: "gravy-veg", name: "Gravy Veg Momos", description: "Soft veg momos served in a rich gravy.", image: "gravy_momo.jpg", price: 160, types: ["veg", "special"] },
  { id: "gravy-chicken", name: "Gravy Chicken Momos", description: "Chicken momos bathed in flavorful gravy.", image: "gravy_momo.jpg", price: 200, types: ["nonveg", "special"] },
  { id: "jhol-veg", name: "Jhol Veg Momos", description: "Traditional jhol-style veg momos with tangy broth.", image: "jhol_momo.jpg", price: 170, types: ["veg", "special"] },
  { id: "jhol-chicken", name: "Jhol Chicken Momos", description: "Chicken momos served in a spicy-tangy jhol.", image: "jhol_nonveg.jpg", price: 210, types: ["nonveg", "special"] },
  { id: "kurkure-veg", name: "Kurkure Veg Momos", description: "Crunchy kurkure-coated veg momos for extra bite.", image: "kurkure_veg.jpg", price: 180, types: ["veg", "special"] },
  { id: "kurkure-chicken", name: "Kurkure Chicken Momos", description: "Chicken momos with a crunchy kurkure coating.", image: "kurkure_nonveg.jpg", price: 220, types: ["nonveg", "special"] },
  { id: "kfc-veg", name: "KFC Style Veg Momos", description: "Veg momos with KFC-inspired coating and spices.", image: "kurkure_veg.jpg", price: 160, types: ["veg", "special"] },
  { id: "kfc-chicken", name: "KFC Style Chicken Momos", description: "Chicken momos with KFC-style crispy seasoning.", image: "kfc_momo.jpg", price: 220, types: ["nonveg", "special"] },
  { id: "schezwan-veg", name: "Schezwan Veg Momos", description: "Veg momos drenched in spicy Schezwan sauce.", image: "schezwan_momo.jpg", price: 160, types: ["veg", "special"] },
  { id: "schezwan-chicken", name: "Schezwan Chicken Momos", description: "Chicken momos tossed in fiery Schezwan sauce.", image: "schezwan_nonveg.jpg", price: 200, types: ["nonveg", "special"] },
  { id: "classic-veg-momo", name: "Classic Veg Momo", description: "", image: "classic_momo.jpg", price: 8.99, types: ["veg"], vegMenu: true },
  { id: "chilli-veg-momo", name: "Chilli Veg Momo", description: "", image: "chilli_veg.jpg", price: 9.49, types: ["veg"], vegMenu: true },
  { id: "cheese-veg-momo", name: "Cheese Veg Momo", description: "", image: "cheese_momo.jpg", price: 10.49, types: ["veg"], vegMenu: true },
  { id: "fried-veg-momo", name: "Fried Veg Momo", description: "", image: "fried_veg.jpg", price: 9.99, types: ["veg"], vegMenu: true },
  { id: "kurkure-veg-momo", name: "Kurkure Veg Momo", description: "", image: "kurkure_veg.jpg", price: 11.49, types: ["veg"], vegMenu: true },
  { id: "gravy-veg-momo", name: "Gravy Veg Momo", description: "", image: "gravy_momo.jpg", price: 10.99, types: ["veg"], vegMenu: true },
  { id: "schezwan-paneer-momo", name: "Schezwan Paneer Momo", description: "", image: "schezwan_momo.jpg", price: 11.99, types: ["veg"], vegMenu: true },
  { id: "jhol-momo", name: "Jhol Momo", description: "", image: "jhol_momo.jpg", price: 12.49, types: ["veg"], vegMenu: true },
];

export type Category = { id: string; name: string };

export const defaultCategories: Category[] = [
  { id: "veg", name: "Vegetarian" },
  { id: "nonveg", name: "Non-Vegetarian" },
  { id: "paneer", name: "Paneer" },
  { id: "chicken", name: "Chicken" },
  { id: "special", name: "Special" },
];

let seedPromise: Promise<void> | undefined;

async function ensureCatalogSeeded() {
  if (!seedPromise) {
    seedPromise = (async () => {
      const db = await getDatabase();
      const settings = db.collection("settings");
      if (await settings.findOne({ key: "default_catalog_v1" })) return;

      const categoryCollection = db.collection<CategoryDocument>("categories");
      const productCollection = db.collection<ProductDocument>("products");
      await Promise.all(defaultCategories.map((category) =>
        categoryCollection.updateOne({ id: category.id }, { $setOnInsert: category }, { upsert: true }),
      ));
      await Promise.all(products.map((product) =>
        productCollection.updateOne({ id: product.id }, { $setOnInsert: product }, { upsert: true }),
      ));
      await settings.updateOne(
        { key: "default_catalog_v1" },
        { $setOnInsert: { key: "default_catalog_v1", initializedAt: new Date() } },
        { upsert: true },
      );
    })().catch((error: unknown) => {
      seedPromise = undefined;
      throw error;
    });
  }
  await seedPromise;
}

export async function getProducts(): Promise<Product[]> {
  await ensureCatalogSeeded();
  const db = await getDatabase();
  return db.collection<ProductDocument>("products")
    .find({}, { projection: { _id: 0 } })
    .sort({ name: 1 })
    .toArray();
}

export async function getCategories(): Promise<Category[]> {
  await ensureCatalogSeeded();
  const db = await getDatabase();
  return db.collection<CategoryDocument>("categories")
    .find({}, { projection: { _id: 0 } })
    .sort({ name: 1 })
    .toArray();
}

export async function getProduct(id: string): Promise<Product | undefined> {
  await ensureCatalogSeeded();
  const db = await getDatabase();
  return (await db.collection<ProductDocument>("products").findOne({ id })) ?? undefined;
}

export const homeProductIds = [
  "steamed-veg",
  "paneer",
  "cheese-corn",
  "chicken",
  "butter-chicken",
  "tandoori",
  "schezwan-veg",
  "gravy-veg",
  "jhol-veg",
];

export async function getCartItems(cart: { id: string; quantity: number }[]) {
  if (!cart.length) return [];
  const catalog = await getProducts();
  const byId = new Map(catalog.map((product) => [product.id, product]));
  return cart.flatMap(({ id, quantity }) => {
    const product = byId.get(id);
    return product ? [{ ...product, quantity }] : [];
  });
}

export function cartTotals(items: { price: number; quantity: number }[]) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const delivery_fee = subtotal >= 30 ? 0 : 2;
  return {
    subtotal,
    delivery_fee,
    total: subtotal + delivery_fee,
    free_delivery_remaining: Math.max(0, 30 - subtotal),
  };
}
