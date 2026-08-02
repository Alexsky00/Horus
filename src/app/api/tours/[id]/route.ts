import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// PATCH /api/tours/:id
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const { name, category, duration, price, pricingMode, routeType, platforms, active, sortOrder, octoEnabled, capacity, startTimes } = body;

  const tour = await prisma.tour.update({
    where: { id: params.id },
    data: {
      ...(name !== undefined && { name }),
      ...(category !== undefined && { category }),
      ...(duration !== undefined && { duration: Number(duration) }),
      ...(price !== undefined && { price: Number(price) }),
      ...(pricingMode !== undefined && { pricingMode }),
      ...(routeType !== undefined && { routeType }),
      ...(platforms !== undefined && { platforms: typeof platforms === "string" ? platforms : JSON.stringify(platforms) }),
      ...(active !== undefined && { active }),
      ...(sortOrder !== undefined && { sortOrder: Number(sortOrder) }),
      ...(octoEnabled !== undefined && { octoEnabled: Boolean(octoEnabled) }),
      ...(capacity !== undefined && { capacity: Math.max(1, Number(capacity) || 1) }),
      ...(startTimes !== undefined && {
        startTimes: typeof startTimes === "string" ? startTimes : JSON.stringify(startTimes),
      }),
    },
  });
  return NextResponse.json(tour);
}

// DELETE /api/tours/:id
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.tour.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
