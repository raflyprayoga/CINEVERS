import { NextRequest, NextResponse } from "next/server";
import { tmdb } from "@/lib/tmdb";
export async function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams;
  const q = p.get("q");
  const category=p.get("category");
  const page=Math.max(1,Number(p.get("page")??1)||1);
  const query=q?.trim();
  // TMDB trending only supports day/week windows. Use its current popularity ranking for the monthly Top 10 panel.
  const path=query?"/search/multi":category==="series"?"/tv/popular":category==="movies"?"/movie/popular":"/trending/movie/week";
  const data=await tmdb<{results:Array<Record<string,unknown>>;total_pages?:number}>(path,{page:String(page),...(query?{query,include_adult:"false"}:{})});
  const results=(data?.results??[]).map(item=>({...item,title:item.title??item.name??"Untitled",media_type:item.media_type??(category==="series"?"tv":"movie")}));
  return NextResponse.json({results,page,totalPages:data?.total_pages??1,configured:!!(process.env.TMDB_API_KEY||process.env.TMDB_ACCESS_TOKEN)});
}
