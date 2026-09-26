import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, unauthorized } from "@/lib/api-auth";
import { createInvoice } from "@/lib/qpay";
import { PAYMENT_PURPOSES, PURPOSE_LABEL } from "@/lib/payments";
import { bankInfo } from "@/lib/bank";

function originOf(req: NextRequest) {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "blackup.ink";
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

// POST /api/payments { bookId, method } → номын төлбөр (BOOK)
// POST /api/payments { purpose, refId?, amount, description?, method } → хураамж/гишүүнчлэл
export async function POST(req: NextRequest) {
  const me = await requireUser();
  if (!me) return unauthorized();
  const { bookId, method, purpose, refId, amount, description } = await req.json();

  // ---- Generic fee / membership payment (номгүй) ----
  if (purpose && purpose !== "BOOK") {
    if (!PAYMENT_PURPOSES.includes(purpose)) {
      return NextResponse.json({ error: "Зориулалт буруу" }, { status: 400 });
    }
    const fee = Math.floor(Number(amount) || 0);
    if (fee <= 0) return NextResponse.json({ error: "Дүн буруу" }, { status: 400 });

    const payment = await db.payment.create({
      data: {
        buyerId: me.id, bookId: null, purpose, refId: refId ?? null,
        amount: fee, creditSpent: 0, status: "PENDING",
        method: method === "transfer" ? "TRANSFER" : "QPAY",
      },
    });

    if (method === "transfer") {
      const bank = await bankInfo();
      return NextResponse.json({
        paymentId: payment.id,
        cash: fee,
        creditUsed: 0,
        transfer: true,
        bank,
        ref: `LU-${payment.id.slice(0, 8).toUpperCase()}`,
      });
    }

    const origin = originOf(req);
    let inv;
    try {
      inv = await createInvoice({
        senderInvoiceNo: `LU-${payment.id.slice(0, 8).toUpperCase()}`,
        description: (description || PURPOSE_LABEL[purpose as keyof typeof PURPOSE_LABEL]).slice(0, 60),
        amount: fee,
        callbackUrl: `${origin}/api/payments/qpay-callback?pid=${payment.id}`,
      });
    } catch (e) {
      await db.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } }).catch(() => {});
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "QPay холбогдохгүй байна. Шилжүүлгээр оролдоно уу." },
        { status: 503 }
      );
    }
    await db.payment.update({ where: { id: payment.id }, data: { qpayInvoiceId: inv.invoice_id } });
    return NextResponse.json({
      paymentId: payment.id,
      cash: fee,
      creditUsed: 0,
      qr_image: inv.qr_image,
      qr_text: inv.qr_text,
      shortUrl: inv.qPay_shortUrl,
      invoiceId: inv.invoice_id,
      bankApps: inv.urls ?? [],
    });
  }

  const book = await db.book.findUnique({ where: { id: bookId } });
  if (!book) return NextResponse.json({ error: "Ном олдсонгүй" }, { status: 404 });
  if (book.status === "sold") return NextResponse.json({ error: "Аль хэдийн зарагдсан" }, { status: 400 });
  if (book.status !== "active") return NextResponse.json({ error: "Ном идэвхтэй биш байна" }, { status: 400 });

  // Already owned (ebook re-entry)?
  const existing = await db.order.findFirst({ where: { bookId, buyerId: me.id, status: "placed" } });
  if (existing && book.pdfPath) return NextResponse.json({ owned: true, orderId: existing.id });

  const use = 0;
  const cash = book.priceCash;

  const payment = await db.payment.create({
    data: {
      buyerId: me.id, bookId, amount: cash, creditSpent: 0, status: "PENDING",
      method: method === "transfer" ? "TRANSFER" : "QPAY",
    },
  });

  // Manual bank transfer → admin confirms later.
  if (method === "transfer") {
    const bank = await bankInfo();
    return NextResponse.json({
      paymentId: payment.id,
      cash,
      creditUsed: use,
      transfer: true,
      bank,
      ref: `LU-${payment.id.slice(0, 8).toUpperCase()}`,
    });
  }

  const origin = originOf(req);
  let inv;
  try {
    inv = await createInvoice({
      senderInvoiceNo: `LU-${payment.id.slice(0, 8).toUpperCase()}`,
      description: `LevelUp: ${book.title}`.slice(0, 60),
      amount: cash,
      callbackUrl: `${origin}/api/payments/qpay-callback?pid=${payment.id}`,
    });
  } catch (e) {
    await db.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } }).catch(() => {});
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "QPay холбогдохгүй байна. Шилжүүлгээр оролдоно уу." },
      { status: 503 }
    );
  }

  await db.payment.update({ where: { id: payment.id }, data: { qpayInvoiceId: inv.invoice_id } });

  return NextResponse.json({
    paymentId: payment.id,
    cash,
    creditUsed: use,
    qr_image: inv.qr_image,
    qr_text: inv.qr_text,
    shortUrl: inv.qPay_shortUrl,
    invoiceId: inv.invoice_id,
    bankApps: inv.urls ?? [],
  });
}
