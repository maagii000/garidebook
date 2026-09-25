import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, unauthorized } from "@/lib/api-auth";
import { UPLOAD_FEE } from "@/lib/payments";

const hubInclude = { owner: { select: { name: true } } };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toMaterial(m: any, access = false) {
  return {
    id: m.id,
    title: m.title,
    subject: m.subject,
    description: m.description,
    fileName: m.fileName,
    fileSize: m.fileSize,
    price: m.price,
    kind: m.kind ?? "",
    downloads: m.downloads ?? 0,
    status: m.status,
    ownerName: m.owner?.name ?? "—",
    createdAt: m.createdAt,
    canAccess: access,
  };
}

export async function materialAccess(userId: string | null, isAdmin: boolean, m: { price: number; ownerId: string; id: string }) {
  if (m.price <= 0) return true;
  if (!userId) return false;
  if (isAdmin || m.ownerId === userId) return true;
  const has = await db.materialAccess.findUnique({
    where: { userId_materialId: { userId, materialId: m.id } },
  });
  if (has) return true;
  // Lazy grant: MATERIAL зориулалттай PAID төлбөр байвал эрх олгоно
  const paid = await db.payment.findFirst({
    where: { buyerId: userId, purpose: "MATERIAL", refId: m.id, status: "PAID" },
  });
  if (paid) {
    await db.materialAccess.upsert({
      where: { userId_materialId: { userId, materialId: m.id } },
      update: {},
      create: { userId, materialId: m.id },
    });
    return true;
  }
  return false;
}

// GET /api/hub?mine=1&q=&subject=&kind=  (+ ?subjects=1 → distinct subjects)
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  if (sp.get("subjects") === "1") {
    const rows = await db.material.findMany({
      where: { status: "active" },
      select: { subject: true },
      distinct: ["subject"],
      take: 50,
    });
    return NextResponse.json({
      subjects: rows.map((r) => r.subject).filter((s) => s && s.trim()),
    });
  }
  const mine = sp.get("mine") === "1";
  const q = sp.get("q")?.trim();
  const subject = sp.get("subject")?.trim();
  const kind = sp.get("kind")?.trim();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (mine) {
    const me = await requireUser();
    if (!me) return unauthorized();
    where.ownerId = me.id;
  } else {
    where.status = "active";
  }
  if (subject) where.subject = subject;
  if (kind) where.kind = kind;
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { subject: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }

  const rows = await db.material.findMany({
    where,
    include: hubInclude,
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return NextResponse.json(
    { materials: rows.map((m) => toMaterial(m)) },
    mine ? undefined : { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
  );
}

// POST /api/hub — 3,900₮ хураамж төлсний дараа материал нийтлэх
export async function POST(req: NextRequest) {
  const me = await requireUser();
  if (!me) return unauthorized();
  const { title, subject, description, filePath, fileName, fileSize, price, kind, paymentId } = await req.json();

  if (!title?.trim()) {
    return NextResponse.json({ error: "Гарчиг шаардлагатай" }, { status: 400 });
  }
  if (!filePath) {
    return NextResponse.json({ error: "Файл оруулна уу" }, { status: 400 });
  }

  const pay = await db.payment.findUnique({ where: { id: paymentId } });
  if (
    !pay || pay.buyerId !== me.id || pay.purpose !== "UPLOAD_FEE" ||
    pay.status !== "PAID" || pay.amount < UPLOAD_FEE
  ) {
    return NextResponse.json({ error: "Эхлээд 3,900₮ оруулах хураамж төлнө үү" }, { status: 402 });
  }

  const m = await db.material.create({
    data: {
      title: title.trim(),
      subject: (subject || "").trim(),
      description: (description || "").trim(),
      filePath,
      fileName: fileName || "file",
      fileSize: Math.floor(Number(fileSize) || 0),
      price: Math.max(0, Math.floor(Number(price) || 0)),
      kind: String(kind || "").slice(0, 40),
      status: "pending",
      feePaid: true,
      paymentId: pay.id,
      ownerId: me.id,
    },
    include: hubInclude,
  });
  await db.payment.update({ where: { id: pay.id }, data: { refId: m.id } });
  return NextResponse.json({ material: toMaterial(m, true) });
}
