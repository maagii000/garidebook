import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, unauthorized } from "@/lib/api-auth";
import { ageOf } from "@/lib/profile";

// GET /api/users/me — танилцуулга (эзэмшигчид бүх талбар + нас)
export async function GET() {
  const me = await requireUser();
  if (!me) return unauthorized();
  const u = await db.user.findUnique({ where: { id: me.id } });
  if (!u) return unauthorized();
  return NextResponse.json({
    me: {
      name: u.name,
      nickname: u.nickname ?? "",
      bio: u.bio ?? "",
      school: u.school ?? "",
      interests: u.interests ?? "",
      lookingFor: u.lookingFor ?? "study",
      lastName: u.lastName ?? "",
      firstName: u.firstName ?? "",
      birthDate: u.birthDate ?? "",
      age: ageOf(u.birthDate ?? ""),
    },
  });
}

// PATCH /api/users/me — овог/нэр/төрсөн өдөр ЗААВАЛ
export async function PATCH(req: NextRequest) {
  const me = await requireUser();
  if (!me) return unauthorized();
  const { nickname, bio, school, interests, lookingFor, lastName, firstName, birthDate } = await req.json();

  const ln = String(lastName ?? "").trim().slice(0, 40);
  const fn = String(firstName ?? "").trim().slice(0, 40);
  const bd = String(birthDate ?? "").trim();
  const errors: Record<string, string> = {};
  if (!ln) errors.lastName = "Овог заавал";
  if (!fn) errors.firstName = "Нэр заавал";
  if (ageOf(bd) === null) errors.birthDate = "Төрсөн өдөр буруу (YYYY-MM-DD)";
  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ error: "Заавал талбарууд дутуу", fields: errors }, { status: 400 });
  }

  await db.user.update({
    where: { id: me.id },
    data: {
      nickname: String(nickname || "").trim().slice(0, 30) || null,
      bio: String(bio || "").trim().slice(0, 300),
      school: String(school || "").trim().slice(0, 80),
      interests: String(interests || "").trim().slice(0, 120),
      lookingFor: lookingFor === "business" ? "business" : "study",
      lastName: ln,
      firstName: fn,
      birthDate: bd,
    },
  });
  return NextResponse.json({ ok: true, age: ageOf(bd) });
}
