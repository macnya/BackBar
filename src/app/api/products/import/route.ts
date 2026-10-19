import { and, eq } from "drizzle-orm";
import * as XLSX from "xlsx";
import { db } from "@/db";
import { products, suppliers, stockMovements } from "@/db/schema";
import { requireBiz } from "@/lib/auth";
import { randomSku, toDateStr, toNumber } from "@/lib/sku";

const HEADER_MAP: Record<string, string> = {
  name: "name",
  product: "name",
  productname: "name",
  item: "name",
  itemname: "name",
  sku: "sku",
  code: "sku",
  barcode: "sku",
  productcode: "sku",
  category: "category",
  unit: "unit",
  quantity: "quantity",
  qty: "quantity",
  stock: "quantity",
  onhand: "quantity",
  costprice: "cost",
  cost: "cost",
  unitcost: "cost",
  price: "cost",
  reorderlevel: "reorder",
  reorder: "reorder",
  min: "reorder",
  minimum: "reorder",
  supplier: "supplier",
  shelflifes: "shelf",
  shelflife: "shelf",
  shelflifedays: "shelf",
  expirydate: "expiry",
  expiry: "expiry",
  bestbefore: "expiry",
};

type ParsedRow = {
  row: number;
  name: string;
  sku: string;
  category: string;
  unit: string;
  quantity: number | null;
  cost: number | null;
  reorder: number | null;
  supplier: string;
  shelf: number | null;
  expiry: string | null;
  status: "created" | "updated" | "skipped" | "error";
  message: string;
};

function normKey(k: unknown) {
  return String(k ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

export async function POST(req: Request) {
  const { business } = await requireBiz();
  const form = await req.formData().catch(() => null);
  if (!form) return Response.json({ ok: false, error: "Expected a form upload." }, { status: 400 });

  const file = form.get("file");
  const commit = form.get("commit") === "1";
  if (!(file instanceof File) || file.size === 0) {
    return Response.json({ ok: false, error: "Please choose an Excel or CSV file." }, { status: 400 });
  }

  let wb: XLSX.WorkBook;
  try {
    const buf = await file.arrayBuffer();
    wb = XLSX.read(buf, { type: "array" });
  } catch {
    return Response.json({ ok: false, error: "Could not read the file. Use .xlsx, .xls or .csv." }, { status: 400 });
  }

  const sheet = wb.Sheets[wb.SheetNames[0]];
  if (!sheet) return Response.json({ ok: false, error: "The file has no sheets." }, { status: 400 });

  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null });
  if (raw.length === 0) {
    return Response.json({ ok: false, error: "No data rows found. Download the template to see the expected format." }, { status: 400 });
  }
  if (raw.length > 2000) {
    return Response.json({ ok: false, error: "Maximum 2000 rows per import." }, { status: 400 });
  }

  const first = raw[0];
  const keyMap: Record<string, string> = {};
  for (const k of Object.keys(first)) {
    const m = HEADER_MAP[normKey(k)];
    if (m) keyMap[k] = m;
  }
  if (!Object.values(keyMap).includes("name")) {
    return Response.json(
      { ok: false, error: 'Could not find a "name" column. Download the template — the first column must be the product name.' },
      { status: 400 }
    );
  }

  const pick = (r: Record<string, unknown>, f: string): unknown => {
    const key = Object.keys(r).find((k) => keyMap[k] === f);
    return key ? r[key] : null;
  };

  const rows: ParsedRow[] = raw.map((r, i) => {
    const name = String(pick(r, "name") ?? "").trim();
    if (!name) return { row: i + 2, name: "", sku: "", category: "", unit: "", quantity: null, cost: null, reorder: null, supplier: "", shelf: null, expiry: null, status: "skipped", message: "No product name — row skipped." };
    const q = pick(r, "quantity");
    return {
      row: i + 2,
      name,
      sku: String(pick(r, "sku") ?? "").trim(),
      category: String(pick(r, "category") ?? "").trim(),
      unit: String(pick(r, "unit") ?? "").trim(),
      quantity: q === null || q === "" || q === 0 ? null : toNumber(q),
      cost: pick(r, "cost") === null ? null : toNumber(pick(r, "cost")),
      reorder: pick(r, "reorder") === null ? null : toNumber(pick(r, "reorder")),
      supplier: String(pick(r, "supplier") ?? "").trim(),
      shelf: pick(r, "shelf") === null ? null : Math.round(toNumber(pick(r, "shelf"))),
      expiry: toDateStr(pick(r, "expiry")),
      status: "created",
      message: "",
    };
  });

  const [existingProducts, existingSuppliers] = await Promise.all([
    db.select().from(products).where(eq(products.businessId, business.id)),
    db.select().from(suppliers).where(eq(suppliers.businessId, business.id)),
  ]);
  const bySku = new Map(existingProducts.map((p) => [p.sku, p]));
  const byName = new Map(existingProducts.map((p) => [p.name.toLowerCase(), p]));
  const suppliersByName = new Map(existingSuppliers.map((s) => [s.name.toLowerCase(), s]));
  const usedSkus = new Set(existingProducts.map((p) => p.sku));
  const newSuppliers: string[] = [];

  // On commit, create any missing suppliers first so products can link to them.
  if (commit) {
    for (const row of rows) {
      if (row.supplier && !suppliersByName.has(row.supplier.toLowerCase())) {
        const [s] = await db
          .insert(suppliers)
          .values({ businessId: business.id, name: row.supplier })
          .returning();
        suppliersByName.set(row.supplier.toLowerCase(), s);
        newSuppliers.push(row.supplier);
      }
    }
  } else {
    for (const row of rows) {
      if (row.supplier && !suppliersByName.has(row.supplier.toLowerCase()) && !newSuppliers.includes(row.supplier)) {
        newSuppliers.push(row.supplier);
      }
    }
  }

  let created = 0;
  let updated = 0;

  for (const row of rows) {
    const matchSku = row.sku ? bySku.get(row.sku) : undefined;
    const matchName = byName.get(row.name.toLowerCase());
    const target = matchSku ?? matchName;

    if (target) {
      row.status = "updated";
      row.message = `Updates “${target.name}”${target.id === matchName?.id && matchSku ? ` (matched by code ${target.sku})` : ""}`;
      updated++;
      if (commit) {
        const patch: Record<string, unknown> = { updatedAt: new Date() };
        if (row.category) patch.category = row.category;
        if (row.unit) patch.unit = row.unit;
        if (row.cost !== null) patch.costPrice = row.cost;
        if (row.reorder !== null) patch.reorderLevel = row.reorder;
        if (row.shelf !== null) patch.shelfLifeDays = row.shelf;
        if (row.expiry) patch.expiryDate = row.expiry;
        if (row.supplier) {
          const s = suppliersByName.get(row.supplier.toLowerCase());
          if (s) patch.supplierId = s.id;
        }
        let withQty = (await db.update(products).set(patch).where(eq(products.id, target.id)).returning())[0];
        if (row.quantity !== null && Math.abs(row.quantity - target.quantity) > 0.0001) {
          withQty = (await db.update(products).set({ quantity: row.quantity, updatedAt: new Date() }).where(eq(products.id, target.id)).returning())[0];
          await db.insert(stockMovements).values({
            businessId: business.id,
            productId: target.id,
            change: row.quantity - target.quantity,
            type: row.quantity >= target.quantity ? "in" : "out",
            method: "excel",
            note: "Excel import",
          });
        }
        bySku.set(withQty.sku, withQty);
        byName.set(withQty.name.toLowerCase(), withQty);
      }
    } else {
      row.status = "created";
      row.message = `Adds “${row.name}”`;
      created++;
      if (commit) {
        let sku = row.sku;
        if (!sku || usedSkus.has(sku)) {
          sku = randomSku();
          while (usedSkus.has(sku)) sku = randomSku();
        }
        const sup = row.supplier ? suppliersByName.get(row.supplier.toLowerCase()) : undefined;
        const [p] = await db
          .insert(products)
          .values({
            businessId: business.id,
            name: row.name,
            sku,
            category: row.category || "Uncategorized",
            unit: row.unit || "unit",
            quantity: row.quantity ?? 0,
            costPrice: row.cost ?? 0,
            reorderLevel: row.reorder ?? 0,
            supplierId: sup?.id ?? null,
            shelfLifeDays: row.shelf,
            expiryDate: row.expiry,
          })
          .returning();
        usedSkus.add(sku);
        bySku.set(sku, p);
        byName.set(row.name.toLowerCase(), p);
        if ((row.quantity ?? 0) > 0) {
          await db.insert(stockMovements).values({
            businessId: business.id,
            productId: p.id,
            change: row.quantity as number,
            type: "in",
            method: "excel",
            note: "Excel import",
          });
        }
      }
    }
  }

  return Response.json({
    ok: true,
    committed: commit,
    total: rows.length,
    created,
    updated,
    skipped: rows.filter((r) => r.status === "skipped").length,
    newSuppliers,
    rows,
  });
}
