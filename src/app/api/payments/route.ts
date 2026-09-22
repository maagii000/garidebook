import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, unauthorized } from "@/lib/api-auth";
import { createInvoice } from "@/lib/qpay";
import { fulfillPayment, cashAfterCredit } from "@/lib/payments";
import { MAX_CREDIT_USE_PER_ORDER } from "@/lib/types";

function originOf(req: NextRequest) {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "garidebook.vercel.app";
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

// POST /api/payments { bookId, creditToUse } → { paymentId, qr, cash, ... } or { owned }
export async function POST(req: NextRequest) {
  const me = await requireUser();
  if (!me) return unauthorized();
  const { bookId, creditToUse } = await req.json();

  const book = await db.book.findUnique({ where: { id: bookId } });
  if (!book) return NextResponse.json({ error: "Ном олдсонгүй" }, { status: 404 });
  if (book.status === "sold") return NextResponse.json({ error: "Аль хэдийн зарагдсан" }, { status: 400 });
  if (book.status !== "active") return NextResponse.json({ error: "Ном идэвхтэй биш байна" }, { status: 400 });

  // Already owned (ebook re-entry)?
  const existing = await db.order.findFirst({ where: { bookId, buyerId: me.id, status: "placed" } });
  if (existing && book.pdfPath) return NextResponse.json({ owned: true, orderId: existing.id });

  const allowed = book.allowCredit ? MAX_CREDIT_USE_PER_ORDER : 0;
  const { use, cash } = cashAfterCredit(book.priceCash, creditToUse, me.credit, allowed);

  const payment = await db.payment.create({
    data: { buyerId: me.id, bookId, amount: cash, creditSpent: use, status: "PENDING" },
  });

  // Fully covered by credit → fulfill immediately (no QPay).
  if (cash <= 0) {
    const done = await fulfillPayment(payment.id);
    const fresh = await db.user.findUnique({ where: { id: me.id }, select: { credit: true } });
    return NextResponse.json({ paid: true, orderId: done.orderId, credit: fresh?.credit ?? 0 });
  }

  const origin = originOf(req);
  const inv = await createInvoice({
    senderInvoiceNo: `GB-${payment.id.slice(0, 8).toUpperCase()}`,
    description: `Garidebook: ${book.title}`.slice(0, 60),
    amount: cash,
    callbackUrl: `${origin}/api/payments/qpay-callback?pid=${payment.id}`,
  });

  await db.payment.update({ where: { id: payment.id }, data: { qpayInvoiceId: inv.invoice_id } });

  return NextResponse.json({
    paymentId: payment.id,
    cash,
    creditUsed: use,
    qr_image: inv.qr_image,
    qr_text: inv.qr_text,
    shortUrl: inv.qPay_shortUrl,
    invoiceId: inv.invoice_id,
  });
}
