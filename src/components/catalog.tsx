"use client";
import { useEffect,useMemo,useRef,useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import type { Movie } from "@/types/movie";
import { imageUrl } from "@/types/movie";
import { BookmarkPlus,ChevronLeft,ChevronRight,Search,SlidersHorizontal,Star,Trash2 } from "lucide-react";
import { notifyWatchlistAdded,notifyWatchlistError,notifyWatchlistExists,notifyWatchlistRemoved,persistWatchlist,readWatchlist,requestWatchlistAdd } from "@/lib/user-data";

type MovieResponse={results:Movie[];page:number;totalPages:number};
function requestUrl(mode:string,query:string,page:number){
 const params=new URLSearchParams({page:String(page)});
 if(mode==="movies"||mode==="series")params.set("category",mode);
 if(query.trim())params.set("q",query.trim());
 return `/api/movies?${params.toString()}`;
}

export function Catalog({mode="search"}:{mode?:"search"|"list"|"movies"|"series"}){
 const router=useRouter();
 const [query,setQuery]=useState("");const [movies,setMovies]=useState<Movie[]>([]);const [saved,setSaved]=useState<Movie[]>([]);
 const [genre,setGenre]=useState("All genres");const [sort,setSort]=useState("Popular");const [loading,setLoading]=useState(false);const [loadError,setLoadError]=useState("");
 const [moreLoading,setMoreLoading]=useState(false);const [page,setPage]=useState(1);const [totalPages,setTotalPages]=useState(1);
 const topTenRail=useRef<HTMLDivElement>(null);const [topTenCanLeft,setTopTenCanLeft]=useState(false);const [topTenCanRight,setTopTenCanRight]=useState(false);

 useEffect(()=>{const sync=()=>void readWatchlist().then(remote=>setSaved(remote??[]));sync();window.addEventListener("cineverse-list-change",sync);return()=>window.removeEventListener("cineverse-list-change",sync)},[]);
 useEffect(()=>{const initialQuery=new URLSearchParams(window.location.search).get("q");if(initialQuery)setQuery(initialQuery)},[]);

 useEffect(()=>{
   if(mode==="list")return;let live=true;setLoading(true);setPage(1);setTotalPages(1);
   const timer=setTimeout(()=>fetch(requestUrl(mode,query,1)).then(r=>r.json()).then((data:MovieResponse)=>{if(live){setMovies(data.results??[]);setPage(data.page??1);setTotalPages(data.totalPages??1)}}).catch(()=>{if(live)setMovies([])}).finally(()=>{if(live)setLoading(false)}),query?300:0);
   return()=>{live=false;clearTimeout(timer)};
 },[query,mode]);

 const topTen=useMemo(()=>movies.slice(0,10),[movies]);
 useEffect(()=>{const element=topTenRail.current;if(!element)return;const update=()=>{setTopTenCanLeft(element.scrollLeft>4);setTopTenCanRight(element.scrollLeft+element.clientWidth<element.scrollWidth-4)};update();element.addEventListener("scroll",update,{passive:true});window.addEventListener("resize",update);return()=>{element.removeEventListener("scroll",update);window.removeEventListener("resize",update)}},[topTen.length]);
 const moveTopTen=(direction:-1|1)=>{const element=topTenRail.current;if(element)element.scrollBy({left:direction*(element.clientWidth*.8),behavior:"smooth"})};
 let shown=mode==="list"?saved:movies;
 if(genre!=="All genres")shown=shown.filter(movie=>movie.genre_ids?.includes(Number(genre)));
 if(sort==="Title A–Z")shown=[...shown].sort((a,b)=>a.title.localeCompare(b.title));
 if(sort==="Rating")shown=[...shown].sort((a,b)=>(b.vote_average??0)-(a.vote_average??0));

 async function loadMore(){if(page>=totalPages||moreLoading)return;setMoreLoading(true);setLoadError("");try{const response=await fetch(requestUrl(mode,query,page+1));if(!response.ok)throw new Error("Request failed");const data=await response.json() as MovieResponse;setMovies(current=>{const ids=new Set(current.map(movie=>movie.id));return [...current,...(data.results??[]).filter(movie=>!ids.has(movie.id))]});setPage(data.page??page+1);setTotalPages(data.totalPages??totalPages)}catch{setLoadError("Film tambahan tidak bisa dimuat. Coba lagi sebentar.")}finally{setMoreLoading(false)}}
 async function save(movie:Movie){try{const result=await requestWatchlistAdd(movie);if(result==="signed-out"){router.push("/login?next=%2Fmy-list");return}if(result==="exists"){setSaved(current=>current.some(item=>item.id===movie.id)?current:[...current,movie]);notifyWatchlistExists(movie.title);return}setSaved(current=>current.some(item=>item.id===movie.id)?current:[...current,movie]);window.dispatchEvent(new Event("cineverse-list-change"));notifyWatchlistAdded(movie.title)}catch(error){notifyWatchlistError(error)}}
 async function remove(movie:Movie){try{await persistWatchlist(movie,"remove");setSaved(current=>current.filter(item=>item.id!==movie.id));window.dispatchEvent(new Event("cineverse-list-change"));notifyWatchlistRemoved(movie.title)}catch(error){notifyWatchlistError(error)}}

 const pageTitle=mode==="list"?"My List":mode==="series"?"Series":mode==="movies"?"Movies":"Find your next favorite";
 const isBrowse=mode==="movies"||mode==="series";
 return <main className="min-h-screen pt-28"><Navbar/><div className="mx-auto min-h-[70vh] max-w-[1600px] px-5 py-8 md:px-10">
   <div className="mb-8"><p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#e50945]">{mode==="list"?"Your collection":"Explore Cinevers"}</p><h1 className="mt-2 text-4xl font-black tracking-tight md:text-5xl">{pageTitle}</h1><p className="mt-2 text-sm text-zinc-400">{mode==="list"?`${saved.length} titles saved for later`:mode==="movies"?"Jelajahi film populer dan temukan tontonan berikutnya.":mode==="series"?"Temukan serial yang sedang populer dan banyak dibicarakan.":"Search across movies and series."}</p></div>
   {mode!=="list"&&<div className="mb-7 flex max-w-xl items-center gap-3 rounded-xl border border-white/10 bg-[#12141b] px-4 py-3"><Search size={18} className="text-zinc-500"/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search titles, actors, and more…" className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-600" autoFocus={mode==="search"}/></div>}

   {isBrowse&&topTen.length>0&&!loading&&<section className="mb-10"><div className="mb-5"><p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#e50945]">Popular right now</p><h2 className="mt-1 text-2xl font-bold md:text-3xl">Top 10 {mode==="series"?"Series":"Movies"}</h2></div><div className="relative"><div ref={topTenRail} className="no-scrollbar flex gap-3 overflow-x-auto scroll-smooth px-5 pb-4 md:gap-4">{topTen.map((movie,index)=><div key={movie.id} className="group relative w-[190px] shrink-0 pt-3 md:w-[220px]"><span className="pointer-events-none absolute -left-1 top-2 z-10 select-none text-[76px] font-black leading-none tracking-[-.12em] text-white/90 drop-shadow-[0_3px_8px_rgba(0,0,0,.8)]">{index+1}</span><Link href={`/movies/${movie.id}${movie.media_type==="tv"?"?type=tv":""}`}><div className="poster ml-8 aspect-[2/3] overflow-hidden rounded-xl bg-[#171922]"><img src={imageUrl(movie.poster_path)} alt={movie.title} loading="lazy" className="h-full w-full object-cover"/></div><h3 className="ml-9 mt-2 line-clamp-1 text-sm font-semibold">{movie.title}</h3><p className="ml-9 mt-1 flex items-center gap-1 text-xs text-zinc-400"><Star size={12} className="fill-amber-400 text-amber-400"/>{movie.vote_average?.toFixed(1)??"—"}</p></Link></div>)}</div><button type="button" aria-label="Geser Top 10 ke kiri" disabled={!topTenCanLeft} onClick={()=>moveTopTen(-1)} className="absolute left-2 top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border-2 border-[#e50945] bg-black/85 text-white shadow-[0_0_18px_#e5094530] backdrop-blur transition hover:bg-[#e50945] disabled:cursor-default disabled:opacity-35"><ChevronLeft size={22}/></button><button type="button" aria-label="Geser Top 10 ke kanan" disabled={!topTenCanRight} onClick={()=>moveTopTen(1)} className="absolute right-2 top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border-2 border-[#e50945] bg-black/85 text-white shadow-[0_0_18px_#e5094530] backdrop-blur transition hover:bg-[#e50945] disabled:cursor-default disabled:opacity-35"><ChevronRight size={22}/></button></div></section>}

   <div className="mb-6 flex flex-wrap items-center gap-2 text-xs"><SlidersHorizontal size={16} className="mr-1 text-zinc-500"/><select value={genre} onChange={event=>setGenre(event.target.value)} className="rounded-lg border border-white/10 bg-[#12141b] px-3 py-2.5 text-zinc-300"><option>All genres</option>{[[28,"Action"],[35,"Comedy"],[18,"Drama"],[27,"Horror"],[10749,"Romance"],[878,"Sci-Fi"],[12,"Adventure"]].map(([id,name])=><option key={id} value={id}>{name}</option>)}</select><select value={sort} onChange={event=>setSort(event.target.value)} className="rounded-lg border border-white/10 bg-[#12141b] px-3 py-2.5 text-zinc-300"><option>Popular</option><option>Rating</option><option>Title A–Z</option></select><span className="ml-auto text-zinc-500">{shown.length} titles</span></div>

   {loading?<p className="py-16 text-center text-sm text-zinc-500">Loading titles…</p>:shown.length?<><div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">{shown.map(movie=><article key={movie.id} className="group relative min-w-0"><Link href={`/movies/${movie.id}${movie.media_type==="tv"?"?type=tv":""}`}><div className="poster relative aspect-[2/3] overflow-hidden rounded-xl bg-[#171922]"><img src={imageUrl(movie.poster_path)} alt={movie.title} loading="lazy" className="h-full w-full object-cover"/><div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent"/><div className="absolute bottom-3 left-3 right-3"><div className="flex items-center gap-1 text-[11px] font-semibold"><Star size={12} className="fill-amber-400 text-amber-400"/>{movie.vote_average?.toFixed(1)??"—"}<span className="ml-auto text-zinc-300">{(movie.release_date??movie.first_air_date??"").slice(0,4)}</span></div><h3 className="mt-1 line-clamp-1 text-sm font-semibold">{movie.title}</h3></div></div></Link>{mode==="list"?<button type="button" title="Hapus dari My List" onClick={()=>void remove(movie)} className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-black/65 text-white shadow-lg backdrop-blur transition hover:border-red-400 hover:bg-red-600 active:scale-90" aria-label={`Hapus ${movie.title} dari My List`}><Trash2 size={16}/></button>:<button title="Add to My List" onClick={()=>void save(movie)} className="absolute right-2 top-2 rounded-full border border-white/20 bg-black/60 p-2 text-white opacity-0 backdrop-blur transition group-hover:opacity-100 hover:bg-[#e50945]" aria-label={`Add ${movie.title} to My List`}><BookmarkPlus size={16}/></button>}</article>)}</div>
     {isBrowse&&page<totalPages&&<div className="mt-10 text-center">{loadError&&<p role="alert" className="mb-3 text-sm text-red-400">{loadError}</p>}<button disabled={moreLoading} onClick={()=>void loadMore()} className="rounded-full border border-[#e50945]/50 bg-[#e50945]/10 px-7 py-3 text-sm font-semibold text-white transition hover:bg-[#e50945] disabled:opacity-50">{moreLoading?"Memuat…":"Muat lebih banyak"}</button></div>}
   </>:<div className="rounded-2xl border border-white/[.07] bg-[#12141b] py-20 text-center"><p className="text-lg font-semibold">{mode==="list"?"Your list is ready for a first pick":"No titles found"}</p><p className="mt-2 text-sm text-zinc-500">{mode==="list"?"Tap the bookmark on any title to save it here.":"Try another title or check your TMDB API configuration."}</p></div>}
 </div></main>;
}
