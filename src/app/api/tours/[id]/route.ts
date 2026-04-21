import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// PATCH /api/tours/:id
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const { name, category, duration, price, pricingMode, routeType, platforms, active, sortOrder } = body;

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
    },
  });
  return NextResponse.json(tour);
}

// DELETE /api/tours/:id
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.tour.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
