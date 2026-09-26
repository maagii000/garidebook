import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, forbidden } from "@/lib/api-auth";
import { ageOf } from "@/lib/profile";

// GET /api/admin/users?q= — бүх хэрэглэгчийн хувийн мэдээлэл (зөвхөн админ)
export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return forbidden("Админ эрх шаардлагатай");
  const q = req.nextUrl.searchParams.get("q")?.trim();

  const users = await db.user.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { nickname: { contains: q, mode: "insensitive" } },
            { lastName: { contains: q, mode: "insensitive" } },
            { firstName: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    select: {
      id: true,
      name: true,
      email: true,
      nickname: true,
      lastName: true,
      firstName: true,
      birthDate: true,
      school: true,
      bio: true,
      interests: true,
      lookingFor: true,
      role: true,
      createdAt: true,
      memberships: {
        where: { status: "ACTIVE", endsAt: { gt: new Date() } },
        select: { plan: true, endsAt: true },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json({
    users: users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      nickname: u.nickname,
      lastName: u.lastName,
      firstName: u.firstName,
      birthDate: u.birthDate,
      age: ageOf(u.birthDate ?? ""),
      school: u.school,
      bio: u.bio,
      interests: u.interests,
      lookingFor: u.lookingFor,
      role: u.role,
      plan: u.memberships[0]?.plan ?? null,
      planEnds: u.memberships[0]?.endsAt ?? null,
      createdAt: u.createdAt,
    })),
  });
}
