import { db } from "./db";
import { checkInvoice, createEbarimt } from "./qpay";

export const PAYMENT_PURPOSES = ["BOOK", "UPLOAD_FEE", "AD_FEE", "MEMBERSHIP", "MATERIAL"] as const;
export type PaymentPurpose = (typeof PAYMENT_PURPOSES)[number];

export const PURPOSE_LABEL: Record<PaymentPurpose, string> = {
  BOOK: "Номын төлбөр",
  UPLOAD_FEE: "Файл оруулах хураамж",
  AD_FEE: "Зар байршуулах хураамж",
  MEMBERSHIP: "Гишүүнчлэл",
  MATERIAL: "Материал худалдан авалт",
};

// Тогтмол хураамжууд (₮)
export const AD_FEE = 500;
export const UPLOAD_FEE = 3900;
export const MEMBERSHIP_PRICES = { BASE: 9900, PRO: 19900 } as const;
export type MembershipPlan = keyof typeof MEMBERSHIP_PRICES;

// Payment PENDING → QPay шалгах → PAID бол fulfill (idempotent).
// Returns payment with fresh status.
export async function syncPayment(paymentId: string) {
  const payment = await db.payment.findUnique({
    where: { id: paymentId },
    include: { book: true },
  });
  if (!payment) throw new Error("Төлбөр олдсонгүй");
  if (payment.status === "PAID") return payment;
  // Manual bank transfer: only admin confirm fulfills (no QPay check).
  if (payment.method === "TRANSFER") return payment;
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

    // Номноос бусад зориулалт: төлбөрийг PAID болгоод хаах (side-effect-ийг
    // зориулалтын модулиуд — hub/ads/membership — гүйцэтгэнэ).
    if (payment.purpose !== "BOOK") {
      let ebarimtId: string | undefined;
      if (payment.amount > 0 && qpayPaymentId) {
        try {
          const eb = await createEbarimt(qpayPaymentId, "CITIZEN");
          ebarimtId = (eb as { id?: string }).id;
        } catch {
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
        },
        include: { book: true },
      });
    }

    if (!payment.bookId || !payment.book) throw new Error("Ном олдсонгүй");

    const order = await tx.order.create({
      data: {
        bookId: payment.bookId,
        buyerId: payment.buyerId,
        cashPaid: payment.amount,
        creditSpent: 0,
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
