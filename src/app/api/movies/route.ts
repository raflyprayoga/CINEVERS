import { NextRequest, NextResponse } from "next/server";
import { tmdb } from "@/lib/tmdb";
export async function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams;
  const q = p.get("q");
  const path = q ? "/search/multi" : p.get("category") === "series" ? "/tv/popular" : "/trending/movie/week";
  const data = await tmdb<{ results: Array<Record<string, unknown>> }>(path, q ? { query:q, include_adult:"false" } : {});
  const results=(data?.results ?? []).map((item)=>({ ...item, title:item.title ?? item.name ?? "Untitled", media_type:item.media_type ?? (p.get("category")==="series"?"tv":"movie") }));
  return NextResponse.json({ results, configured:!!process.env.TMDB_API_KEY });
}
