import { NextRequest, NextResponse } from "next/server";
import { createItem, listCategories, listItems } from "@/lib/db";

export async function GET() {
  return NextResponse.json({ items: listItems(), categories: listCategories() });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.title || typeof body.title !== "string") {
    return NextResponse.json({ error: "title requis" }, { status: 400 });
  }
  const item = createItem({
    type: body.type === "idea" ? "idea" : "video",
    url: body.url ?? null,
    platform: body.platform ?? null,
    video_id: body.video_id ?? null,
    title: body.title.trim(),
    description: (body.description ?? "").trim(),
    author: body.author ?? null,
    thumbnail: body.thumbnail ?? null,
    category: body.category || null,
    tags: Array.isArray(body.tags) ? body.tags : [],
  });
  return NextResponse.json({ item }, { status: 201 });
}
