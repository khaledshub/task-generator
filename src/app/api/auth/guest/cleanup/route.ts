import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { isGuestEmail, purgeGuestUserById } from "@/lib/auth/guest";

export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ ok: true });
  }

  if (!isGuestEmail(session.user.email)) {
    return NextResponse.json({ ok: true });
  }

  await purgeGuestUserById(session.user.id);

  return NextResponse.json({ ok: true });
}
