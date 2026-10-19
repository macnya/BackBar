import {
  pgTable,
  serial,
  text,
  integer,
  real,
  boolean,
  date,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// RLS prevents the Supabase Data API's anon/authenticated roles from reading
// these server-owned tables. The app accesses them only through its private
// DATABASE_URL; do not add public policies unless the access model changes.
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();

export const businesses = pgTable("businesses", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  name: text("name").notNull(),
  type: text("type").notNull().default("restaurant"), // restaurant | bar | bistro
  address: text("address").default(""),
  phone: text("phone").default(""),
  currency: text("currency").notNull().default("USD"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();

export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  contactPerson: text("contact_person").default(""),
  phone: text("phone").default(""),
  email: text("email").default(""),
  address: text("address").default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();

export const products = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    businessId: integer("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    sku: text("sku").notNull(),
    category: text("category").notNull().default("Uncategorized"),
    unit: text("unit").notNull().default("unit"),
    quantity: real("quantity").notNull().default(0),
    costPrice: real("cost_price").notNull().default(0),
    reorderLevel: real("reorder_level").notNull().default(0),
    supplierId: integer("supplier_id").references(() => suppliers.id, { onDelete: "set null" }),
    shelfLifeDays: integer("shelf_life_days"),
    expiryDate: date("expiry_date"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    bizIdx: index("products_biz_idx").on(t.businessId),
    bizSkuUq: uniqueIndex("products_biz_sku_uq").on(t.businessId, t.sku),
  })
).enableRLS();

export const stockMovements = pgTable(
  "stock_movements",
  {
    id: serial("id").primaryKey(),
    businessId: integer("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
    productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    change: real("change").notNull(), // signed: positive in, negative out
    type: text("type").notNull(), // in | out | adjust
    method: text("method").notNull().default("manual"), // manual | scan | excel | system
    note: text("note").default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    bizIdx: index("movements_biz_idx").on(t.businessId),
    prodIdx: index("movements_prod_idx").on(t.productId),
  })
).enableRLS();

export const menuItems = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description").default(""),
  category: text("category").notNull().default("Food"),
  price: real("price").notNull().default(0),
  available: boolean("available").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();

export const recipeItems = pgTable(
  "recipe_items",
  {
    id: serial("id").primaryKey(),
    menuItemId: integer("menu_item_id").notNull().references(() => menuItems.id, { onDelete: "cascade" }),
    productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    quantity: real("quantity").notNull().default(1),
  },
  (t) => ({
    menuProdUq: uniqueIndex("recipe_menu_prod_uq").on(t.menuItemId, t.productId),
  })
).enableRLS();
