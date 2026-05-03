import path from "node:path";

import dotenv from "dotenv";

dotenv.config({
  path: path.resolve(process.cwd(), "../../apps/server/.env"),
});

const products = [
  {
    id: "prod-eco-tote",
    slug: "recycled-canvas-tote",
    name: "Recycled Canvas Tote",
    description: "A durable everyday tote made from reclaimed canvas scraps.",
    category: "Accessories",
    priceCents: 24900,
    stock: 18,
    imageUrl: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=900&q=80",
    ecoBadge: "Recycled material",
    sellerName: "Green Loop Studio",
    featured: true,
  },
  {
    id: "prod-bamboo-brush",
    slug: "bamboo-toothbrush-set",
    name: "Bamboo Toothbrush Set",
    description: "Four biodegradable toothbrushes packed in plastic-free kraft boxes.",
    category: "Personal Care",
    priceCents: 15900,
    stock: 42,
    imageUrl: "https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?auto=format&fit=crop&w=900&q=80",
    ecoBadge: "Plastic-free",
    sellerName: "Kind Earth Co.",
    featured: true,
  },
  {
    id: "prod-steel-bottle",
    slug: "stainless-travel-bottle",
    name: "Stainless Travel Bottle",
    description: "Insulated reusable bottle for market days, school, and commutes.",
    category: "Kitchen",
    priceCents: 38900,
    stock: 25,
    imageUrl: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=900&q=80",
    ecoBadge: "Reusable",
    sellerName: "Refill Goods",
    featured: true,
  },
  {
    id: "prod-notebook",
    slug: "recycled-paper-notebook",
    name: "Recycled Paper Notebook",
    description: "A simple dotted notebook made with post-consumer recycled paper.",
    category: "Stationery",
    priceCents: 9900,
    stock: 60,
    imageUrl: "https://images.unsplash.com/photo-1531346680769-a1d79b57de5c?auto=format&fit=crop&w=900&q=80",
    ecoBadge: "Post-consumer paper",
    sellerName: "Paper Again",
    featured: false,
  },
  {
    id: "prod-desk-lamp",
    slug: "restored-desk-lamp",
    name: "Restored Desk Lamp",
    description: "A pre-loved desk lamp inspected, cleaned, and fitted with an LED bulb.",
    category: "Home",
    priceCents: 49900,
    stock: 7,
    imageUrl: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=80",
    ecoBadge: "Second life item",
    sellerName: "Circular Home",
    featured: false,
  },
  {
    id: "prod-wood-chair",
    slug: "refinished-wooden-chair",
    name: "Refinished Wooden Chair",
    description: "Solid wooden chair repaired by local makers and ready for daily use.",
    category: "Furniture",
    priceCents: 125000,
    stock: 3,
    imageUrl: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=900&q=80",
    ecoBadge: "Locally restored",
    sellerName: "Barangay Woodworks",
    featured: false,
  },
] as const;

const [{ createDb }, { product }] = await Promise.all([import("."), import("./schema/commerce")]);
const db = createDb();

await db
  .insert(product)
  .values(products)
  .onConflictDoNothing({ target: product.id });

console.log(`Seeded ${products.length} EcoExchange products.`);
