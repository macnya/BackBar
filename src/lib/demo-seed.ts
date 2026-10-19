import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  businesses,
  menuItems,
  products,
  recipeItems,
  stockMovements,
  suppliers,
  users,
} from "@/db/schema";

export const DEMO_EMAIL = "demo@backbar.app";
export const DEMO_PASSWORD = "demo1234";

type Sup = { name: string; contactPerson: string; phone: string; email: string };
type Prod = [
  name: string,
  sku: string,
  category: string,
  unit: string,
  qty: number,
  cost: number,
  reorder: number,
  supplierIdx: number,
  shelfDays: number | null,
  expiryOffsetDays: number | null
];

const SUPPLIERS: Sup[] = [
  { name: "Harvest & Vine Distributors", contactPerson: "Lena Ortiz", phone: "+1 555 0141", email: "orders@harvestvine.example" },
  { name: "Metro Spirits Co.", contactPerson: "Marcus Webb", phone: "+1 555 0177", email: "sales@metros.example" },
  { name: "Daily Fresh Produce", contactPerson: "Ana Reyes", phone: "+1 555 0102", email: "hello@dailyfresh.example" },
  { name: "Northside Coffee Roasters", contactPerson: "Jon Park", phone: "+1 555 0190", email: "wholesale@northsideco.example" },
];

const PRODUCTS: Prod[] = [
  ["Merlot 750ml", "2001000000011", "Wine", "bottle", 24, 18.5, 12, 0, 540, 300],
  ["Chardonnay 750ml", "2001000000028", "Wine", "bottle", 9, 16, 12, 0, 540, 200],
  ["Hazy IPA 4-pack", "2001000000035", "Beer", "pack", 15, 12, 10, 0, 90, 60],
  ["Lager 24-pack", "2001000000042", "Beer", "pack", 6, 21, 8, 0, 120, 80],
  ["Kentucky Bourbon 750ml", "2001000000059", "Spirits", "bottle", 10, 95, 4, 1, null, null],
  ["Vodka 700ml", "2001000000066", "Spirits", "bottle", 14, 28, 6, 1, null, null],
  ["London Dry Gin 700ml", "2001000000073", "Spirits", "bottle", 3, 32, 5, 1, null, null],
  ["Tonic Syrup 750ml", "2001000000080", "Bar", "bottle", 5, 9, 3, 1, 365, 300],
  ["Espresso Beans 1kg", "2001000000097", "Coffee", "bag", 6, 14, 4, 3, 180, 120],
  ["Oat Milk 1L", "2001000000103", "Dairy", "carton", 9, 2.4, 12, 2, 28, 3],
  ["Whole Milk 1L", "2001000000110", "Dairy", "carton", 11, 1.8, 10, 2, 12, 9],
  ["Basil (bunch)", "2001000000127", "Produce", "bunch", 4, 3.5, 4, 2, 5, -1],
  ["Lemons 1kg", "2001000000134", "Produce", "kg", 5, 3.2, 4, 2, 21, 9],
  ["Avocados 1kg", "2001000000141", "Produce", "kg", 4, 5.5, 6, 2, 10, 6],
  ["Baguette", "2001000000158", "Bakery", "piece", 12, 2.5, 8, 2, 2, 1],
  ["Focaccia", "2001000000165", "Bakery", "piece", 7, 4, 4, 2, 2, 1],
  ["Olive Oil 750ml", "2001000000172", "Dry goods", "bottle", 7, 15, 3, 0, 720, 500],
  ["Paper Cups 100", "2001000000189", "Packaging", "pack", 4, 8, 10, 1, null, null],
];

type Menu = [name: string, category: string, price: number, description: string, recipes: [prodIdx: number, qty: number][]];
const MENU: Menu[] = [
  ["Espresso", "Drinks", 3.8, "Double shot, house blend", [[8, 0.018]]],
  ["Flat White", "Drinks", 4.6, "Double shot with oat milk", [[8, 0.02], [9, 0.2]]],
  ["Gin & Tonic", "Drinks", 11, "London dry, house tonic, lemon", [[6, 0.05], [7, 0.05], [12, 0.02]]],
  ["Old Fashioned", "Drinks", 13, "Bourbon, demerara, orange", [[4, 0.06], [12, 0.03]]],
  ["House IPA Flight", "Drinks", 12, "Three 100ml pours", [[2, 0.1]]],
  ["House Chardonnay (glass)", "Drinks", 9, "Crisp, citrus forward", [[1, 0.125]]],
  ["Merlot (glass)", "Drinks", 8.5, "Soft red, dark fruit", [[0, 0.125]]],
  ["Avocado Toast", "Starters", 13, "Sourdough, lemon, chili", [[13, 0.18], [14, 0.15], [12, 0.02]]],
  ["Grilled Focaccia", "Starters", 8, "Olive oil, basil, flaky salt", [[15, 1], [16, 0.03]]],
];

type Move = [prodIdx: number, daysAgo: number, change: number, type: "in" | "out" | "adjust", method: "manual" | "scan" | "excel", note: string];
const MOVES: Move[] = [
  [0, 12, 12, "in", "excel", "Weekly wine delivery"],
  [1, 12, 12, "in", "excel", "Weekly wine delivery"],
  [2, 12, 8, "in", "excel", "Weekly beer delivery"],
  [3, 11, 12, "in", "excel", "Weekly beer delivery"],
  [8, 10, 4, "in", "manual", "Coffee restock"],
  [5, 9, 6, "in", "manual", "Spirits order"],
  [10, 8, 12, "in", "scan", "Fresh delivery check-in"],
  [1, 5, -3, "out", "scan", "Service usage"],
  [2, 3, -6, "out", "scan", "Service usage"],
  [4, 4, -1, "out", "scan", "Service usage"],
  [6, 6, -1, "out", "scan", "Service usage"],
  [9, 4, -3, "out", "scan", "Service usage"],
  [11, 3, -1, "adjust", "manual", "Wilted — written off"],
  [13, 1, -0.8, "out", "scan", "Service usage"],
  [12, 1, -0.5, "out", "scan", "Service usage"],
  [14, 2, -2, "out", "manual", "Breakfast service"],
  [15, 1, -4, "out", "scan", "Lunch service"],
  [17, 7, -2, "out", "manual", "Breakfast service"],
];

function iso(daysAgo: number) {
  return new Date(Date.now() - daysAgo * 86400000).toISOString();
}
function isoPlus(days: number) {
  return new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
}

export async function seedDemo(): Promise<{ user: { id: number }; business: { id: number; name: string } }> {
  const [existing] = await db.select().from(users).where(eq(users.email, DEMO_EMAIL)).limit(1);
  if (existing) {
    const [biz] = await db.select().from(businesses).where(eq(businesses.ownerId, existing.id)).limit(1);
    return { user: existing, business: biz! };
  }

  const [user] = await db
    .insert(users)
    .values({ name: "Demo Owner", email: DEMO_EMAIL, passwordHash: bcrypt.hashSync(DEMO_PASSWORD, 10) })
    .returning();

  const [business] = await db
    .insert(businesses)
    .values({
      ownerId: user.id,
      name: "Copper & Oak — Bistro & Bar",
      type: "bistro",
      address: "14 Foundry Lane, Portland",
      phone: "+1 555 0135",
    })
    .returning();

  const supIds: number[] = [];
  for (const s of SUPPLIERS) {
    const [row] = await db.insert(suppliers).values({ businessId: business.id, ...s }).returning();
    supIds.push(row.id);
  }

  const prodIds: number[] = [];
  for (const p of PRODUCTS) {
    const [row] = await db
      .insert(products)
      .values({
        businessId: business.id,
        name: p[0],
        sku: p[1],
        category: p[2],
        unit: p[3],
        quantity: p[4],
        costPrice: p[5],
        reorderLevel: p[6],
        supplierId: supIds[p[7]],
        shelfLifeDays: p[8],
        expiryDate: p[9] === null ? null : isoPlus(p[9]),
      })
      .returning();
    prodIds.push(row.id);
  }

  const now = Date.now();
  for (const p of PRODUCTS) {
    await db.insert(stockMovements).values({
      businessId: business.id,
      productId: prodIds[p[0] ? PRODUCTS.indexOf(p as Prod) : 0] ,
      change: p[4],
      type: "in",
      method: "system",
      note: "Opening stock",
      createdAt: new Date(now - 14 * 86400000),
    });
  }
  for (const [pi, daysAgo, change, type, method, note] of MOVES) {
    await db.insert(stockMovements).values({
      businessId: business.id,
      productId: prodIds[pi],
      change,
      type,
      method,
      note,
      createdAt: new Date(now - daysAgo * 86400000 - (now % 3600000)),
    });
  }

  for (const m of MENU) {
    const [item] = await db
      .insert(menuItems)
      .values({
        businessId: business.id,
        name: m[0],
        category: m[1],
        price: m[2],
        description: m[3],
        available: true,
      })
      .returning();
    for (const [pi, qty] of m[4]) {
      await db.insert(recipeItems).values({ menuItemId: item.id, productId: prodIds[pi], quantity: qty });
    }
  }

  return { user, business };
}
