import { db } from "./db";
import { checkInvoice, createEbarimt } from "./qpay";
import { CREDIT_TO_MNT } from "./types";

// Payment PENDING → QPay шалгах → PAID бол fulfill (idempotent).
// Returns payment with fresh status.
export async function syncPayment(paymentId: string) {
  const payment = await db.payment.findUnique({
    where: { id: paymentId },
    include: { book: true },
  });
  if (!payment) throw new Error("Төлбөр олдсонгүй");
  if (payment.status === "PAID") return payment;
  if (payment.status !== "PENDING" || !payment.qpayInvoiceId) return payment;

  const check = await checkInvoice(payment.qpayInvoiceId);
  const paid = (check.rows || []).find(
    (r) => r.payment_status === "PAID" && Number(r.payment_amount) >= payment.amount
  );
  if (!paid) return payment;

  return fulfillPayment(paymentId, paid.payment_id);
}

export async function fulfillPayment(paymentId: string, qpayPaymentId?: string) {
  return db.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { id: paymentId },
      include: { book: true },
    });
    if (!payment) throw new Error("Төлбөр олдсонгүй");
    if (payment.status === "PAID") return payment;

    const use = payment.creditSpent;
    if (use > 0) {
      const buyer = await tx.user.findUnique({ where: { id: payment.buyerId } });
      if (!buyer || buyer.credit < use) throw new Error("Кредит хүрэлцэхгүй байна");
      await tx.user.update({ where: { id: payment.buyerId }, data: { credit: { decrement: use } } });
      await tx.creditTx.create({
        data: { userId: payment.buyerId, amount: -use, reason: "Худалдан авалтад зарцуулсан", bookId: payment.bookId },
      });
    }

    const order = await tx.order.create({
      data: {
        bookId: payment.bookId,
        buyerId: payment.buyerId,
        cashPaid: payment.amount,
        creditSpent: use,
      },
    });

    // Physical P2P book → mark sold. Ebooks stay active for other buyers.
    if (!payment.book.pdfPath) {
      await tx.book.update({ where: { id: payment.bookId }, data: { status: "sold" } });
    }

    let ebarimtId: string | undefined;
    if (payment.amount > 0 && qpayPaymentId) {
      try {
        const eb = await createEbarimt(qpayPaymentId, "CITIZEN");
        ebarimtId = (eb as { id?: string }).id;
      } catch {
        // Ebarimt needs QPay activation; admin can retry from console.
        ebarimtId = undefined;
      }
    }

    return tx.payment.update({
      where: { id: paymentId },
      data: {
        status: "PAID",
        paidAt: new Date(),
        qpayPaymentId: qpayPaymentId ?? payment.qpayPaymentId,
        ebarimtId,
        orderId: order.id,
      },
      include: { book: true },
    });
  });
}

export function cashAfterCredit(priceCash: number, creditToUse: number, buyerCredit: number, maxUse: number) {
  const use = Math.max(0, Math.min(Math.floor(Number(creditToUse) || 0), buyerCredit, maxUse, Math.floor(priceCash / CREDIT_TO_MNT)));
  return { use, cash: priceCash - use * CREDIT_TO_MNT };
}
