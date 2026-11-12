import { createClient } from "@/lib/supabase/client";
import type { Movie } from "@/types/movie";
const PENDING_WATCHLIST_KEY="cineverse-pending-watchlist";
export function notifyWatchlistError(error:unknown){
  const detail=describeError(error);
  const missingSchema=detail.includes("PGRST205")||detail.includes("Could not find the table 'public.profiles'");
  if(missingSchema){
    console.warn("Cineverse database schema is not installed. Apply supabase/migrations/202611120001_cineverse.sql, then 202611120002_repair_existing_profiles.sql.");
  }else console.error("Cineverse My List error:",detail);
  const message=missingSchema
    ?"Database Cineverse belum disiapkan. Jalankan migrasi 001 lalu 002 di project Supabase yang dipakai aplikasi."
    :`My List gagal disimpan: ${detail}`;
  if(typeof window!=="undefined")window.dispatchEvent(new CustomEvent("cineverse-toast",{detail:message}));
}

export function notifyWatchlistAdded(title:string){
  if(typeof window!=="undefined")window.dispatchEvent(new CustomEvent("cineverse-toast",{detail:`${title} ditambahkan ke My List.`}));
}

export function notifyWatchlistExists(title:string){
  if(typeof window!=="undefined")window.dispatchEvent(new CustomEvent("cineverse-toast",{detail:`${title} sudah ada di My List.`}));
}

export function notifyWatchlistRemoved(title:string){
  if(typeof window!=="undefined")window.dispatchEvent(new CustomEvent("cineverse-toast",{detail:`${title} dihapus dari My List.`}));
}

function describeError(error:unknown):string{
  if(error instanceof Error)return `${error.name}: ${error.message}`;
  if(error&&typeof error==="object"){
    const value=error as Record<string,unknown>;
    const message=[value.message,value.details,value.hint].filter(item=>typeof item==="string"&&item).join(" — ");
    const code=typeof value.code==="string"?`Kode ${value.code}. `:"";
    if(message)return `${code}${message}`;
    try{return `${code}${JSON.stringify(error,Object.getOwnPropertyNames(error))}`}catch{}
  }
  return typeof error==="string"?error:"Periksa koneksi Supabase dan migrasi database.";
}

function databaseError(stage:string,error:unknown):Error{
  return new Error(`${stage}: ${describeError(error)}`);
}

async function context() {
  const db=createClient(); if(!db)return null;
  // This is browser-only code: read the persisted browser session instead of
  // calling getUser(), which can throw AuthSessionMissingError during session
  // hydration even when Supabase is still restoring the signed-in session.
  const {data:{session},error:authError}=await db.auth.getSession();
  if(authError)throw authError;
  const user=session?.user;
  if(!user)return null;
  // Existing Auth accounts may predate the profile-creation trigger. Heal those
  // accounts here so a valid session is never mistaken for a signed-out user.
  const {data:profile,error:profileError}=await db.from("profiles").select("id").eq("user_id",user.id).limit(1).maybeSingle();
  if(profileError)throw databaseError("Memeriksa profil",profileError);
  if(profile)return {db,profileId:profile.id};
  const {error:userError}=await db.from("users").upsert({id:user.id,email:user.email??"",username:user.user_metadata?.username??user.user_metadata?.display_name??null},{onConflict:"id"});
  if(userError)throw databaseError("Menyinkronkan akun",userError);
  const {data:created,error:createError}=await db.from("profiles").insert({user_id:user.id,name:user.user_metadata?.display_name??"Main profile"}).select("id").single();
  if(createError)throw databaseError("Membuat profil",createError);
  return {db,profileId:created.id};
}
async function movieRow(movie:Movie, db:NonNullable<ReturnType<typeof createClient>>) {
  if(!db)return null;
  const {data:existing,error:lookupError}=await db.from("movies").select("id").eq("tmdb_id",movie.id).maybeSingle();
  if(lookupError)throw databaseError("Mencari film",lookupError);
  if(existing)return existing.id as string;
  const {data,error}=await db.from("movies").insert({tmdb_id:movie.id,title:movie.title,overview:movie.overview??"",poster_path:movie.poster_path,backdrop_path:movie.backdrop_path,release_date:(movie.release_date||movie.first_air_date)||null,rating:movie.vote_average??null,media_type:movie.media_type??"movie"}).select("id").single();
  if(error)throw databaseError("Menyimpan metadata film",error); return data.id as string;
}
export async function persistWatchlist(movie:Movie, action:"add"|"remove") {
  const ctx=await context();if(!ctx)return;
  const id=await movieRow(movie,ctx.db);if(!id)return;
  if(action==="add"){const {error}=await ctx.db.from("watchlist").upsert({profile_id:ctx.profileId,movie_id:id},{onConflict:"profile_id,movie_id"});if(error)throw databaseError("Menambahkan ke watchlist",error);}
  else {const {error}=await ctx.db.from("watchlist").delete().eq("profile_id",ctx.profileId).eq("movie_id",id);if(error)throw databaseError("Menghapus dari watchlist",error);}
}
export async function requestWatchlistAdd(movie:Movie):Promise<"signed-out"|"added"|"exists">{
  const ctx=await context();
  if(!ctx){
    const pending=JSON.parse(localStorage.getItem(PENDING_WATCHLIST_KEY)||"[]") as Movie[];
    if(!pending.some(item=>item.id===movie.id))localStorage.setItem(PENDING_WATCHLIST_KEY,JSON.stringify([...pending,movie]));
    return "signed-out";
  }
  const id=await movieRow(movie,ctx.db);if(!id)throw new Error("Movie metadata was not saved.");
  const {data:existing,error:existingError}=await ctx.db.from("watchlist").select("id").eq("profile_id",ctx.profileId).eq("movie_id",id).maybeSingle();
  if(existingError)throw databaseError("Memeriksa My List",existingError);
  if(existing)return "exists";
  const {error}=await ctx.db.from("watchlist").upsert({profile_id:ctx.profileId,movie_id:id},{onConflict:"profile_id,movie_id"});
  if(error)throw databaseError("Menambahkan ke watchlist",error);
  return "added";
}
export async function flushPendingWatchlist(){
  const ctx=await context();if(!ctx)return;
  const pending=JSON.parse(localStorage.getItem(PENDING_WATCHLIST_KEY)||"[]") as Movie[];
  for(const movie of pending){
    const id=await movieRow(movie,ctx.db);if(!id)continue;
    const {error}=await ctx.db.from("watchlist").upsert({profile_id:ctx.profileId,movie_id:id},{onConflict:"profile_id,movie_id"});
    if(error)throw error;
  }
  localStorage.removeItem(PENDING_WATCHLIST_KEY);
}
export async function readWatchlist():Promise<Movie[]|null> {
  try{
    const ctx=await context();if(!ctx)return null;
    const {data,error}=await ctx.db.from("watchlist").select("movie:movies(*)").eq("profile_id",ctx.profileId).order("created_at",{ascending:false});
    if(error)return null;
    type RelatedMovie={id:string;tmdb_id:number;title:string;overview:string;poster_path:string|null;backdrop_path:string|null;release_date:string|null;rating:number|null;media_type:"movie"|"tv"};
    const rows=(data??[]) as unknown as Array<{movie:RelatedMovie|null}>;
    return rows.flatMap(({movie})=>movie?[{...movie,id:movie.tmdb_id,title:movie.title,release_date:movie.release_date??undefined,vote_average:movie.rating??undefined} as Movie]:[]);
  }catch{return null;}
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
