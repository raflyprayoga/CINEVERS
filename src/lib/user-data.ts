import { createClient } from "@/lib/supabase/client";
import type { Movie } from "@/types/movie";

async function context() {
  const db=createClient(); if(!db)return null;
  const {data:{user}}=await db.auth.getUser(); if(!user)return null;
  const {data:profile}=await db.from("profiles").select("id").eq("user_id",user.id).limit(1).maybeSingle();
  return profile?{db,profileId:profile.id}:null;
}
async function movieRow(movie:Movie, db:NonNullable<ReturnType<typeof createClient>>) {
  if(!db)return null;
  const {data:existing}=await db.from("movies").select("id").eq("tmdb_id",movie.id).maybeSingle();
  if(existing)return existing.id as string;
  const {data,error}=await db.from("movies").insert({tmdb_id:movie.id,title:movie.title,overview:movie.overview??"",poster_path:movie.poster_path,backdrop_path:movie.backdrop_path,release_date:(movie.release_date||movie.first_air_date)||null,rating:movie.vote_average??null,media_type:movie.media_type??"movie"}).select("id").single();
  if(error)throw error; return data.id as string;
}
export async function persistWatchlist(movie:Movie, action:"add"|"remove") {
  const ctx=await context();if(!ctx)return;
  const id=await movieRow(movie,ctx.db);if(!id)return;
  if(action==="add"){const {error}=await ctx.db.from("watchlist").upsert({profile_id:ctx.profileId,movie_id:id},{onConflict:"profile_id,movie_id"});if(error)throw error;}
  else {const {error}=await ctx.db.from("watchlist").delete().eq("profile_id",ctx.profileId).eq("movie_id",id);if(error)throw error;}
}
export async function readWatchlist():Promise<Movie[]|null> {
  const ctx=await context();if(!ctx)return null;
  const {data,error}=await ctx.db.from("watchlist").select("movie:movies(*)").eq("profile_id",ctx.profileId).order("created_at",{ascending:false});
  if(error)return null;
  type RelatedMovie={id:string;tmdb_id:number;title:string;overview:string;poster_path:string|null;backdrop_path:string|null;release_date:string|null;rating:number|null;media_type:"movie"|"tv"};
  const rows=(data??[]) as unknown as Array<{movie:RelatedMovie|null}>;
  return rows.flatMap(({movie})=>movie?[{...movie,id:movie.tmdb_id,title:movie.title,release_date:movie.release_date??undefined,vote_average:movie.rating??undefined} as Movie]:[]);
}
export async function savePlayback(tmdbId:number,progress:number,duration:number) {
  const ctx=await context();if(!ctx)return;
  const {data:movie}=await ctx.db.from("movies").select("id").eq("tmdb_id",tmdbId).maybeSingle();if(!movie)return;
  const {error}=await ctx.db.from("watch_history").upsert({profile_id:ctx.profileId,movie_id:movie.id,progress_seconds:Math.floor(progress),duration_seconds:Math.floor(duration),completed:duration>0&&progress/duration>.92,updated_at:new Date().toISOString()},{onConflict:"profile_id,movie_id"});if(error)throw error;
}
export async function readPlayback(tmdbId:number) {
  const ctx=await context();if(!ctx)return 0;
  const {data:movie}=await ctx.db.from("movies").select("id").eq("tmdb_id",tmdbId).maybeSingle();if(!movie)return 0;
  const {data}=await ctx.db.from("watch_history").select("progress_seconds,completed").eq("profile_id",ctx.profileId).eq("movie_id",movie.id).maybeSingle();return data?.completed?0:data?.progress_seconds??0;
}
