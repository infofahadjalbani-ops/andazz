import { redisPipeline } from "@/lib/redis";

const catalog = new Map([
  ["rust-signal-hoodie", { name: "RUST SIGNAL HOODIE", price: 3650 }],
  ["olive-chaos-hoodie", { name: "OLIVE CHAOS HOODIE", price: 3850 }],
  ["noir-signal-sweat", { name: "NOIR SIGNAL SWEAT", price: 3250 }],
  ["afterdark-tee", { name: "AFTERDARK OVERSIZED TEE", price: 2150 }],
  ["ash-noise-sweat", { name: "ASH NOISE SWEATSHIRT", price: 3150 }],
]);

type OrderItemInput = { id?: unknown; size?: unknown; qty?: unknown };
type OrderInput = {
  customerName?: unknown; phone?: unknown; email?: unknown; address?: unknown;
  city?: unknown; notes?: unknown; paymentMethod?: unknown;
  paymentReference?: unknown; items?: unknown;
};

const clean = (value: unknown, max = 250) => typeof value === "string" ? value.trim().slice(0, max) : "";

export async function POST(request: Request) {
  if(request.headers.get("origin") && request.headers.get("origin")!==new URL(request.url).origin) return Response.json({error:"Forbidden"},{status:403});
  try {
    const body = await request.json() as OrderInput;
    const customerName = clean(body.customerName, 100);
    const phone = clean(body.phone, 30);
    const email = clean(body.email, 150);
    const address = clean(body.address, 400);
    const city = clean(body.city, 80);
    const notes = clean(body.notes, 500);
    const paymentMethod = clean(body.paymentMethod, 30);
    const paymentReference = clean(body.paymentReference, 100);

    if (!customerName || !phone || !address || !city) {
      return Response.json({ error: "Name, phone, address and city are required." }, { status: 400 });
    }
    if (!['cod', 'bank_transfer'].includes(paymentMethod)) {
      return Response.json({ error: "Choose a valid payment method." }, { status: 400 });
    }
    if (paymentMethod === 'bank_transfer' && !paymentReference) {
      return Response.json({ error: "Transaction/reference number is required for bank transfer." }, { status: 400 });
    }
    if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > 25) {
      return Response.json({ error: "Your bag is empty or invalid." }, { status: 400 });
    }

    const items = (body.items as OrderItemInput[]).map((item) => {
      const id = clean(item.id, 80);
      const size = clean(item.size, 4);
      const qty = Number(item.qty);
      const product = catalog.get(id);
      if (!product || !['S', 'M', 'L', 'XL'].includes(size) || !Number.isInteger(qty) || qty < 1 || qty > 99) {
        throw new Error("INVALID_ITEM");
      }
      return { id, name: product.name, size, qty, unitPrice: product.price, lineTotal: product.price * qty };
    });
    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
    const id = `AND-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0, 4).toUpperCase()}`;

    const now = new Date().toISOString();
    const order = {
      id, customerName, phone, email: email || null, address, city,
      notes: notes || null, paymentMethod,
      paymentReference: paymentReference || null, subtotal,
      status: "new", items, createdAt: now, updatedAt: now,
    };
    await redisPipeline([
      ["SET", `andazz:order:${id}`, JSON.stringify(order)],
      ["ZADD", "andazz:orders", Date.now(), id],
    ]);

    return Response.json({ order: { id, subtotal, status: "new" } }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_ITEM") {
      return Response.json({ error: "One or more bag items are invalid." }, { status: 400 });
    }
    console.error("order-create", error);
    return Response.json({ error: "Order could not be placed. Please try again." }, { status: 500 });
  }
}
