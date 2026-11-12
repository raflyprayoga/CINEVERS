import { NextRequest, NextResponse } from "next/server";
import { tmdb } from "@/lib/tmdb";
export async function GET(request:NextRequest,{params}:{params:Promise<{id:string}>}) {
 const {id}=await params; const type=request.nextUrl.searchParams.get("type")==="tv"?"tv":"movie";
 const [rawMovie,videos,credits,similar]=await Promise.all([tmdb<Record<string,unknown>>(`/${type}/${id}`),tmdb(`/${type}/${id}/videos`),tmdb(`/${type}/${id}/credits`),tmdb(`/${type}/${id}/similar`)]);
 const movie=rawMovie?{...rawMovie,title:rawMovie.title??rawMovie.name,release_date:rawMovie.release_date??rawMovie.first_air_date,media_type:type}:null;
 return NextResponse.json({movie,videos,credits,similar,configured:!!process.env.TMDB_API_KEY});
}
