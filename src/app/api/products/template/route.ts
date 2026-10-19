import * as XLSX from "xlsx";
import { requireBiz } from "@/lib/auth";

export async function GET() {
  await requireBiz();
  const aoa: (string | number)[][] = [
    ["name", "sku", "category", "unit", "quantity", "cost_price", "reorder_level", "supplier", "shelf_life_days", "expiry_date"],
    ["Merlot 750ml", "2001000000011", "Wine", "bottle", 24, 18.5, 12, "Harvest & Vine Distributors", 540, ""],
    ["Espresso Beans 1kg", "", "Coffee", "bag", 6, 14, 4, "Northside Coffee Roasters", 180, ""],
    ["Lemons 1kg", "", "Produce", "kg", 5, 3.2, 4, "Daily Fresh Produce", 21, "2026-03-01"],
  ];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = [{ wch: 26 }, { wch: 16 }, { wch: 14 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 14 }, { wch: 28 }, { wch: 16 }, { wch: 13 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Stock");
  const out = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  return new Response(out, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="backbar-stock-template.xlsx"',
    },
  });
}
