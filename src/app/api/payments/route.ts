import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, unauthorized } from "@/lib/api-auth";
import { createInvoice } from "@/lib/qpay";
import { fulfillPayment, cashAfterCredit, PAYMENT_PURPOSES, PURPOSE_LABEL } from "@/lib/payments";
import { bankInfo } from "@/lib/bank";
import { MAX_CREDIT_USE_PER_ORDER } from "@/lib/types";

function originOf(req: NextRequest) {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "blackup.ink";
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

// POST /api/payments { bookId, creditToUse, method } → номын төлбөр (BOOK)
// POST /api/payments { purpose: UPLOAD_FEE|AD_FEE|MEMBERSHIP, refId?, amount, description?, method } → хураамж/гишүүнчлэл
export async function POST(req: NextRequest) {
  const me = await requireUser();
  if (!me) return unauthorized();
  const { bookId, creditToUse, method, purpose, refId, amount, description } = await req.json();

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
        ref: `GB-${payment.id.slice(0, 8).toUpperCase()}`,
      });
    }

    const origin = originOf(req);
    const inv = await createInvoice({
      senderInvoiceNo: `GB-${payment.id.slice(0, 8).toUpperCase()}`,
      description: (description || PURPOSE_LABEL[purpose as keyof typeof PURPOSE_LABEL]).slice(0, 60),
      amount: fee,
      callbackUrl: `${origin}/api/payments/qpay-callback?pid=${payment.id}`,
    });
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

  const allowed = book.allowCredit ? MAX_CREDIT_USE_PER_ORDER : 0;
  const { use, cash } = cashAfterCredit(book.priceCash, creditToUse, me.credit, allowed);

  const payment = await db.payment.create({
    data: {
      buyerId: me.id, bookId, amount: cash, creditSpent: use, status: "PENDING",
      method: method === "transfer" ? "TRANSFER" : "QPAY",
    },
  });

  // Fully covered by credit → fulfill immediately (no payment provider).
  if (cash <= 0) {
    const done = await fulfillPayment(payment.id);
    const fresh = await db.user.findUnique({ where: { id: me.id }, select: { credit: true } });
    return NextResponse.json({ paid: true, orderId: done.orderId, credit: fresh?.credit ?? 0 });
  }

  // Manual bank transfer → admin confirms later.
  if (method === "transfer") {
    const bank = await bankInfo();
    return NextResponse.json({
      paymentId: payment.id,
      cash,
      creditUsed: use,
      transfer: true,
      bank,
      ref: `GB-${payment.id.slice(0, 8).toUpperCase()}`,
    });
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
    bankApps: inv.urls ?? [],
  });
}
