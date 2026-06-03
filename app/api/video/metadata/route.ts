import { NextResponse } from "next/server";
import { fetchVideoMetadata } from "@/lib/youtube/metadata";
import { extractVideoSource } from "@/lib/youtube/utils";
import { requireUser } from "@/server/actions/auth-helpers";

export async function GET(request: Request) {
  await requireUser();
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url") ?? "";
  const source = extractVideoSource(url);

  if (!source) {
    return NextResponse.json(
      { ok: false, message: "Поддерживаются ссылки на YouTube и VK Video." },
      { status: 400 },
    );
  }

  const result = await fetchVideoMetadata(source);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
