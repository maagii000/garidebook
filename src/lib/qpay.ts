// QPay V2 client (sandbox + production via env).
// Docs: 250624 V2 API with Ebarimt 3.0 (xlsx). Verified on sandbox 2026-09-22.

const HOST = process.env.QPAY_HOST || "https://merchant-sandbox.qpay.mn";
const USER = process.env.QPAY_USERNAME || "";
const PASS = process.env.QPAY_PASSWORD || "";
const INVOICE_CODE = process.env.QPAY_INVOICE_CODE || "TEST_INVOICE";
const EB_INVOICE_CODE = process.env.QPAY_EB_INVOICE_CODE || "TEST_EB_INVOICE";

// Sandbox удаашрал/тасалдалд UI гацахгүй: 20с timeout + тодорхой алдаа.
const TIMEOUT_MS = 20_000;

async function timedFetch(url: string, init: RequestInit): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      throw new Error("QPay холбогдохгүй байна (20с хүлээлээ). Шилжүүлгээр оролдоно уу.");
    }
    throw new Error(`QPay сүлжээний алдаа: ${e instanceof Error ? e.message : "unknown"}`);
  } finally {
    clearTimeout(t);
  }
}

let tokenCache: { token: string; exp: number } | null = null;

async function getToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.exp - 60_000) return tokenCache.token;
  if (!USER || !PASS) throw new Error("QPay тохиргоо дутуу байна (QPAY_USERNAME/PASSWORD). Админд мэдэгдэнэ үү.");
  const basic = Buffer.from(`${USER}:${PASS}`).toString("base64");
  const r = await timedFetch(`${HOST}/v2/auth/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${basic}` },
  });
  if (!r.ok) throw new Error(`QPay нэвтрэхэд алдаа (${r.status}). Шилжүүлгээр оролдоно уу.`);
  const d = await r.json();
  tokenCache = { token: d.access_token, exp: d.expires_in * 1000 };
  return d.access_token;
}

async function api<T>(path: string, init: RequestInit & { bearer?: string } = {}): Promise<T> {
  const token = init.bearer ?? (await getToken());
  const r = await timedFetch(`${HOST}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(init.headers || {}) },
  });
  const text = await r.text();
  let data: T;
  try {
    data = JSON.parse(text) as T;
  } catch {
    throw new Error(`QPay ${path} bad response (${r.status}): ${text.slice(0, 200)}`);
  }
  if (!r.ok) throw new Error(`QPay ${path} failed (${r.status}): ${text.slice(0, 300)}`);
  return data;
}

export interface QPayInvoice {
  invoice_id: string;
  qr_text: string;
  qr_image: string;
  qPay_shortUrl: string;
  urls: { name: string; description: string; logo: string; link: string }[];
}

export async function createInvoice(opts: {
  senderInvoiceNo: string;
  description: string;
  amount: number;
  callbackUrl: string;
  receiverCode?: string;
}): Promise<QPayInvoice> {
  return api<QPayInvoice>("/v2/invoice", {
    method: "POST",
    body: JSON.stringify({
      invoice_code: INVOICE_CODE,
      sender_invoice_no: opts.senderInvoiceNo,
      invoice_receiver_code: opts.receiverCode ?? "terminal",
      invoice_description: opts.description,
      amount: opts.amount,
      callback_url: opts.callbackUrl,
    }),
  });
}

export interface QPayCheckRow {
  payment_id: string;
  payment_status: string;
  payment_amount: number;
  payment_date?: string;
}

export async function checkInvoice(invoiceId: string): Promise<{ count: number; rows: QPayCheckRow[] }> {
  return api("/v2/payment/check", {
    method: "POST",
    body: JSON.stringify({
      object_type: "INVOICE",
      object_id: invoiceId,
      offset: { page_number: 1, page_limit: 10 },
    }),
  });
}

export async function cancelInvoice(invoiceId: string): Promise<unknown> {
  return api(`/v2/invoice/${invoiceId}`, { method: "DELETE" });
}

// Ebarimt: try v3 (xlsx table), fallback to v2 (postman collection).
export async function createEbarimt(paymentId: string, receiverType = "CITIZEN", receiver?: string): Promise<{ id?: string; [k: string]: unknown }> {
  const body: Record<string, string> = { payment_id: paymentId, ebarimt_receiver_type: receiverType };
  if (receiver) body.ebarimt_receiver = receiver;
  const paths = [process.env.QPAY_EB_PATH || "/v2/ebarimt_v3/create", "/v2/ebarimt/create", "/v2/ebarimt_v3/create"];
  let lastErr: unknown = null;
  for (const p of new Set(paths)) {
    try {
      return await api(p, { method: "POST", body: JSON.stringify(body) });
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}

export function qpayEnv() {
  return { host: HOST, invoiceCode: INVOICE_CODE, ebInvoiceCode: EB_INVOICE_CODE };
}
