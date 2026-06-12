import { NextRequest, NextResponse } from "next/server";
import { deleteItem, getItem, markViewed, updateItem } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  if (body.viewed) {
    markViewed(Number(id));
    return NextResponse.json({ item: getItem(Number(id)) });
  }
  const item = updateItem(Number(id), body);
  if (!item) return NextResponse.json({ error: "introuvable" }, { status: 404 });
  return NextResponse.json({ item });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  deleteItem(Number(id));
  return NextResponse.json({ ok: true });
}
